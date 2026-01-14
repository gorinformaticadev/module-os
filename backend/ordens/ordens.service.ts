import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { CreateOrdemServicoDTO, UpdateOrdemServicoDTO, OrdemServicoFilters } from '../shared/dto/ordem-servico.dto';
import * as puppeteer from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';
import { generatePdfHtml } from './pdf-template.util';

@Injectable()
export class OrdensService {
    private readonly logger = new Logger(OrdensService.name);

    constructor(private readonly prisma: PrismaService) { }

    // Implementação de PDF com Puppeteer
    async generatePdf(tenantId: string, id: string): Promise<Buffer> {
        try {
            this.logger.log(`Gerando PDF para ordem ${id}. Tenant: ${tenantId}`);

            // 1. Buscar dados da ordem
            const ordem = await this.findOne(tenantId, id);
            if (!ordem) {
                throw new Error('Ordem de serviço não encontrada');
            }

            // 2. Buscar config do tenant (logo, detalhes)
            // Aqui estamos simulando busca de info do tenant, ideal seria ter um TenantsService injetado ou query no banco
            // Vou tentar buscar dados básicos do tenant via Prisma se possível, ou usar dados da ordem se ela tiver algo
            // NOTE: A query findOne já faz joins com clientes, mas não traz dados do Tenant em si (nome, logo, etc).
            // O ideal é buscar na tabela de Tenants ou Configurações.
            // Vou usar uma query raw rápida para pegar info do tenant.

            const tenantQuery = `SELECT * FROM tenants WHERE id = $1`;
            const tenantResult = await this.prisma.$queryRawUnsafe(tenantQuery, tenantId) as any[];
            const tenantData = tenantResult[0] || {};


            // Buscar configurações para "condicoes_execucao"
            const configQuery = `SELECT value FROM mod_ordem_servico_configs WHERE tenant_id = $1 AND key = 'condicoes_execucao'`;
            const configResult = await this.prisma.$queryRawUnsafe(configQuery, tenantId) as any[];
            const condicoesExecucao = configResult.length > 0 ? configResult[0].value : '';

            // Preparar objeto tenantInfo
            // OBS: O logoUrl geralmente precisa ser resolvido para um path local ou URL pública acessível pelo puppeteer
            // Se for URL relativa (/api/...), o puppeteer pode não conseguir acessar se não tiver o host.
            // O ideal é converter para base64 ou usar path absoluto de arquivo se local.
            // Vou tentar usar a URL completa se possível, ou Base64 se eu tivesse acesso aos arquivos aqui.
            // Por simplicidade, assumindo que logos são urls publicas ou tratadas no template.
            // Para garantir, se user tiver logoUrl, vou tentar ler o arquivo do disco e converter pra base64.

            let logoBase64 = undefined;
            if (tenantData.logoUrl) {
                try {
                    const logoPath = path.resolve(process.cwd(), 'uploads', 'logos', tenantData.logoUrl);
                    if (fs.existsSync(logoPath)) {
                        const logoBuffer = fs.readFileSync(logoPath);
                        logoBase64 = `data:image/jpeg;base64,${logoBuffer.toString('base64')}`;
                    }
                } catch (e) {
                    this.logger.warn(`Erro ao ler logo para PDF: ${e.message}`);
                }
            }

            const tenantInfo = {
                name: tenantData.nomeFantasia || tenantData.razaoSocial || 'Empresa',
                document: tenantData.cnpjCpf,
                address: tenantData.endereco || '', // Simplificação
                phone: tenantData.telefone,
                email: tenantData.email,
                logo_url: logoBase64
            };

            // Injetar condicoes nas ordens para o template
            // @ts-ignore
            ordem.condicoesExecucao = condicoesExecucao;

            // 3. Gerar HTML
            const html = generatePdfHtml(ordem, tenantInfo);

            // 4. Puppeteer

            // Configuração otimizada para ambiente Windows/Server e prevenção de timeout
            const browser = await puppeteer.launch({
                headless: true, // ou 'new' se suportado
                timeout: 60000, // Aumentar timeout para 60s
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage', // Reduz uso de memória compartilhada
                    '--disable-gpu', // Evita problemas de renderização em alguns ambientes
                    '--disable-extensions',
                    '--no-first-run',
                    '--no-zygote',
                ]
            });
            const page = await browser.newPage();

            // Otimizar carregamento da página
            await page.setContent(html, {
                waitUntil: ['load', 'networkidle0'], // Esperar carregamento completo
                timeout: 60000 // Timeout também para o carregamento do conteúdo
            });

            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '0mm', // Margens controladas pelo CSS do @page
                    bottom: '0mm',
                    left: '0mm',
                    right: '0mm'
                }
            });

            await browser.close();

            this.logger.log(`✅ PDF gerado com sucesso. Tamanho: ${pdfBuffer.length} bytes`);
            return Buffer.from(pdfBuffer);
        } catch (error) {
            this.logger.error(`❌ Erro ao gerar PDF: ${error.message}`);
            throw error;
        }
    }

    // Transições de status permitidas
    private readonly TRANSICOES_PERMITIDAS = {
        0: [1, 7], // ORCAMENTO -> ABERTA, CANCELADA
        1: [2, 7], // ABERTA -> EM_ANALISE, CANCELADA
        2: [5, 3, 4, 7], // EM_ANALISE -> EM_EXECUCAO, AGUARDANDO_CLIENTE, AGUARDANDO_PECAS, CANCELADA
        3: [2, 5, 4, 7], // AGUARDANDO_CLIENTE -> EM_ANALISE, EM_EXECUCAO, AGUARDANDO_PECAS, CANCELADA
        4: [5, 3, 7], // AGUARDANDO_PECAS -> EM_EXECUCAO, AGUARDANDO_CLIENTE, CANCELADA
        5: [6, 3, 4, 7], // EM_EXECUCAO -> FINALIZADA, AGUARDANDO_CLIENTE, AGUARDANDO_PECAS, CANCELADA
        6: [5], // FINALIZADA -> EM_EXECUCAO
        7: [5] // CANCELADA -> EM_EXECUCAO
    };

    async findAll(tenantId: string, filters: OrdemServicoFilters) {
        try {
            this.logger.log(`Buscando ordens de serviço. Tenant: ${tenantId}`);

            // ============================================
            // VALIDAÇÃO MANUAL SEGURA (SEM ValidationPipe)
            // ============================================

            // Validar e sanitizar cliente_id se fornecido
            if (filters.cliente_id) {
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (!uuidRegex.test(filters.cliente_id)) {
                    this.logger.error(`❌ UUID inválido fornecido: ${filters.cliente_id}`);
                    throw new Error('ID de cliente inválido');
                }
            }

            // Validar e sanitizar usuario_responsavel_id se fornecido
            if (filters.usuario_responsavel_id) {
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (!uuidRegex.test(filters.usuario_responsavel_id)) {
                    this.logger.error(`❌ UUID de responsável inválido: ${filters.usuario_responsavel_id}`);
                    throw new Error('ID de responsável inválido');
                }
            }

            // Validar e converter paginação com valores seguros
            const page = Math.max(1, parseInt(String(filters.page || 1), 10) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(String(filters.limit || 20), 10) || 20));
            const offset = (page - 1) * limit;

            // Validar status array se fornecido
            let validatedStatus: number[] | undefined;
            if (filters.status && Array.isArray(filters.status)) {
                validatedStatus = filters.status
                    .map(s => parseInt(String(s), 10))
                    .filter(s => !isNaN(s) && s >= 0 && s <= 7); // StatusOS válidos: 0-7

                if (validatedStatus.length === 0) {
                    validatedStatus = undefined; // Ignorar se nenhum status válido
                }
            }

            // Validar datas se fornecidas
            let validatedDataInicio: string | undefined;
            let validatedDataFim: string | undefined;

            if (filters.data_inicio) {
                const dataInicio = new Date(filters.data_inicio);
                if (!isNaN(dataInicio.getTime())) {
                    validatedDataInicio = dataInicio.toISOString();
                }
            }

            if (filters.data_fim) {
                const dataFim = new Date(filters.data_fim);
                if (!isNaN(dataFim.getTime())) {
                    validatedDataFim = dataFim.toISOString();
                }
            }

            // Sanitizar search string (remover caracteres perigosos para SQL)
            let sanitizedSearch: string | undefined;
            if (filters.search && typeof filters.search === 'string') {
                sanitizedSearch = filters.search
                    .trim()
                    .replace(/[<>'"]/g, '') // Remove caracteres potencialmente perigosos
                    .substring(0, 100); // Limita tamanho

                if (sanitizedSearch.length === 0) {
                    sanitizedSearch = undefined;
                }
            }

            let whereClause = `WHERE os.tenant_id = $1`;
            const params: any[] = [tenantId];
            let paramIndex = 2;

            // Aplicar filtros
            if (filters.search) {
                const searchParam = filters.search.trim();
                this.logger.log(`🔍 Filtro de busca: "${searchParam}" (length: ${searchParam.length})`);

                // Bloquear buscas muito curtas para performance
                if (searchParam.length > 0 && searchParam.length < 2) {
                    this.logger.warn(`⚠️ Busca muito curta bloqueada: "${searchParam}"`);
                    return { data: [], total: 0, page, totalPages: 0, limit };
                } else if (searchParam.length >= 2) {
                    const searchPattern = `%${searchParam.toLowerCase()}%`;
                    whereClause += ` AND (
                        LOWER(COALESCE(os.numero, '')) LIKE $${paramIndex}::text 
                        OR LOWER(COALESCE(c.name, '')) LIKE $${paramIndex}::text 
                        OR LOWER(COALESCE(os.descricao, '')) LIKE $${paramIndex}::text
                    )`;
                    params.push(searchPattern);
                    paramIndex++;
                    this.logger.log(`✅ Filtro de busca aplicado: ${searchPattern}`);
                }
            }

            if (filters.status && filters.status.length > 0) {
                this.logger.log(`📊 Filtro de status: ${JSON.stringify(filters.status)}`);
                whereClause += ` AND os.status = ANY($${paramIndex})`;
                params.push(filters.status);
                paramIndex++;
                this.logger.log(`✅ Filtro de status aplicado`);
            }

            if (filters.cliente_id) {
                whereClause += ` AND os.cliente_id = $${paramIndex}::uuid`;
                params.push(filters.cliente_id);
                paramIndex++;
            }

            if (filters.usuario_responsavel_id) {
                whereClause += ` AND os.usuario_responsavel_id = $${paramIndex}::uuid`;
                params.push(filters.usuario_responsavel_id);
                paramIndex++;
            }

            if (filters.data_inicio) {
                whereClause += ` AND os.data_abertura >= $${paramIndex}`;
                params.push(filters.data_inicio);
                paramIndex++;
            }

            if (filters.data_fim) {
                whereClause += ` AND os.data_abertura <= $${paramIndex}`;
                params.push(filters.data_fim);
                paramIndex++;
            }

            if (filters.origem_solicitacao) {
                whereClause += ` AND os.origem_solicitacao = $${paramIndex}`;
                params.push(filters.origem_solicitacao);
                paramIndex++;
            }

            if (filters.tipo_servico) {
                whereClause += ` AND os.tipo_servico = $${paramIndex}`;
                params.push(filters.tipo_servico);
                paramIndex++;
            }

            // Query de contagem para paginação
            this.logger.log(`🔍 Executando query de contagem...`);
            const countQuery = `
                SELECT COUNT(*)::int as total
                FROM mod_ordem_servico_ordens os
                LEFT JOIN mod_ordem_servico_clients c ON os.cliente_id = c.id
                ${whereClause}
            `;

            this.logger.log(`📊 Count Query: ${countQuery}`);
            this.logger.log(`📊 Count Params: ${JSON.stringify(params)}`);

            const countResult = await this.prisma.$queryRawUnsafe(countQuery, ...params) as any[];
            const total = countResult[0]?.total || 0;
            const totalPages = Math.ceil(total / limit);

            this.logger.log(`✅ Contagem concluída: ${total} registros encontrados`);

            // Query principal com paginação (versão simplificada para debug)
            this.logger.log(`🔍 Executando query principal...`);
            const query = `
                SELECT 
                    os.*,
                    c.name as cliente_nome,
                    c.phone_primary as cliente_telefone,
                    c.is_active as cliente_ativo
                FROM mod_ordem_servico_ordens os
                LEFT JOIN mod_ordem_servico_clients c ON os.cliente_id = c.id
                ${whereClause}
                ORDER BY os.created_at DESC
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `;

            params.push(limit, offset);

            this.logger.log(`📊 Main Query: ${query}`);
            this.logger.log(`📊 Main Params: ${JSON.stringify(params)}`);

            this.logger.log(`🔍 Executando query principal no banco...`);
            const rawResult = await this.prisma.$queryRawUnsafe(query, ...params) as any[];
            this.logger.log(`✅ Query executada, ${rawResult.length} registros retornados`);
            this.logger.log(`📊 Primeiro registro (raw): ${JSON.stringify(rawResult[0], null, 2)}`);

            const parsePhotos = (photos: any) => {
                try {
                    return typeof photos === 'string' ? JSON.parse(photos) : (photos || []);
                } catch (e) {
                    this.logger.error(`❌ Erro ao parsear fotos: ${e.message}`);
                    return [];
                }
            };

            this.logger.log(`🔄 Processando dados das ordens...`);
            const ordens = rawResult.map((os, index) => {
                try {
                    this.logger.log(`🔄 Processando ordem ${index + 1}/${rawResult.length} - ID: ${os.id}`);

                    // Processar fotos de forma mais segura
                    let equipamento_fotos = [];
                    try {
                        if (os.equipamento_fotos) {
                            if (typeof os.equipamento_fotos === 'string') {
                                equipamento_fotos = JSON.parse(os.equipamento_fotos);
                            } else if (Array.isArray(os.equipamento_fotos)) {
                                equipamento_fotos = os.equipamento_fotos;
                            }
                        }
                    } catch (photoError) {
                        this.logger.warn(`⚠️ Erro ao processar fotos da ordem ${os.id}: ${photoError.message}`);
                        equipamento_fotos = [];
                    }

                    // Processar dados do cliente de forma mais segura
                    const cliente = {
                        name: os.cliente_nome ? String(os.cliente_nome) : null,
                        phone_primary: os.cliente_telefone ? String(os.cliente_telefone) : null,
                        is_active: os.cliente_ativo !== null ? Boolean(os.cliente_ativo) : null
                    };

                    // Processar dados do responsável de forma mais segura
                    const responsavel = {
                        name: null,
                        email: null
                    };

                    // Criar objeto da ordem processada com conversão de tipos MAIS RIGOROSA
                    const processedOrder = {
                        // IDs como strings
                        id: String(os.id),
                        tenant_id: String(os.tenant_id),
                        cliente_id: os.cliente_id ? String(os.cliente_id) : null,
                        usuario_responsavel_id: os.usuario_responsavel_id ? String(os.usuario_responsavel_id) : null,

                        // Strings garantidas
                        numero: os.numero ? String(os.numero) : null,
                        descricao: os.descricao ? String(os.descricao) : null,
                        tipo_servico: os.tipo_servico ? String(os.tipo_servico) : null,
                        prioridade: os.prioridade ? String(os.prioridade) : null,
                        origem_solicitacao: os.origem_solicitacao ? String(os.origem_solicitacao) : null,
                        observacoes_internas: os.observacoes_internas ? String(os.observacoes_internas) : null,
                        observacoes_cliente: os.observacoes_cliente ? String(os.observacoes_cliente) : null,
                        forma_pagamento: os.forma_pagamento ? String(os.forma_pagamento) : null,
                        motivo_cancelamento: os.motivo_cancelamento ? String(os.motivo_cancelamento) : null,

                        // Campos de equipamento
                        equipamento_tipo: os.equipamento_tipo ? String(os.equipamento_tipo) : null,
                        equipamento_marca: os.equipamento_marca ? String(os.equipamento_marca) : null,
                        equipamento_modelo: os.equipamento_modelo ? String(os.equipamento_modelo) : null,
                        equipamento_serie: os.equipamento_serie ? String(os.equipamento_serie) : null,
                        equipamento_acessorios: os.equipamento_acessorios ? String(os.equipamento_acessorios) : null,
                        equipamento_estado: os.equipamento_estado ? String(os.equipamento_estado) : null,
                        equipamento_fotos,

                        // Campos de formatação
                        formatacao_so: os.formatacao_so ? String(os.formatacao_so) : null,
                        formatacao_backup_descricao: os.formatacao_backup_descricao ? String(os.formatacao_backup_descricao) : null,
                        formatacao_senha: os.formatacao_senha ? String(os.formatacao_senha) : null,
                        laudo_tecnico: os.laudo_tecnico ? String(os.laudo_tecnico) : null,
                        itens: os.itens ? (typeof os.itens === 'string' ? JSON.parse(os.itens) : os.itens) : [],

                        // Números garantidos como números
                        valor_servico: os.valor_servico ? Number(parseFloat(String(os.valor_servico))) : 0,
                        status: os.status ? Number(parseInt(String(os.status))) : 0,

                        // Booleanos garantidos
                        orcamento_aprovado: Boolean(os.orcamento_aprovado),
                        formatacao_backup: Boolean(os.formatacao_backup),

                        // Datas como strings ISO ou null
                        data_abertura: os.data_abertura ? new Date(os.data_abertura).toISOString() : null,
                        data_previsao: os.data_previsao ? new Date(os.data_previsao).toISOString() : null,
                        data_conclusao: os.data_conclusao ? new Date(os.data_conclusao).toISOString() : null,
                        created_at: os.created_at ? new Date(os.created_at).toISOString() : null,
                        updated_at: os.updated_at ? new Date(os.updated_at).toISOString() : null,

                        // Objetos relacionados
                        cliente,
                        responsavel
                    };

                    // Teste de serialização individual
                    try {
                        JSON.stringify(processedOrder);
                    } catch (serError) {
                        this.logger.error(`❌ Erro de serialização na ordem ${os.id}:`, serError);
                        this.logger.error(`❌ Dados problemáticos:`, processedOrder);
                        throw new Error(`Ordem ${os.id} não é serializável: ${serError.message}`);
                    }

                    this.logger.log(`✅ Ordem ${index + 1} processada com sucesso - Número: ${processedOrder.numero}`);
                    return processedOrder;
                } catch (error) {
                    this.logger.error(`❌ Erro ao processar ordem ${index + 1}: ${error.message}`);
                    this.logger.error(`❌ Stack trace: ${error.stack}`);
                    this.logger.error(`❌ Dados da ordem: ${JSON.stringify(os, null, 2)}`);
                    throw error;
                }
            });

            this.logger.log(`✅ ${ordens.length} ordens de serviço encontradas (Total: ${total}, Página: ${page}/${totalPages})`);

            const result = {
                data: ordens,
                total,
                page,
                totalPages,
                limit
            };

            this.logger.log(`📤 Retornando resultado: ${JSON.stringify({
                dataLength: result.data.length,
                total: result.total,
                page: result.page,
                totalPages: result.totalPages,
                limit: result.limit
            })}`);

            // Verificar se o resultado é serializável
            try {
                JSON.stringify(result);
                this.logger.log(`✅ Resultado é serializável em JSON`);
            } catch (serializationError) {
                this.logger.error(`❌ Erro de serialização JSON: ${serializationError.message}`);
                throw new Error(`Erro de serialização: ${serializationError.message}`);
            }

            return result;
        } catch (error) {
            this.logger.error(`❌ Erro ao buscar ordens de serviço:`, error);
            this.logger.error(`❌ Stack trace:`, error.stack);
            throw error;
        }
    }

    async findOne(tenantId: string, id: string) {
        try {
            this.logger.log(`Buscando ordem de serviço ${id}. Tenant: ${tenantId}`);

            const query = `
                SELECT 
                    os.*,
                    c.name as cliente_nome,
                    c.phone_primary as cliente_telefone,
                    c.phone_secondary as cliente_telefone_secundario,
                    c.document as cliente_documento,
                    c.address_street as cliente_endereco_rua,
                    c.address_number as cliente_endereco_numero,
                    c.address_neighborhood as cliente_endereco_bairro,
                    c.address_city as cliente_endereco_cidade,
                    c.address_state as cliente_endereco_estado,
                    c.address_zip as cliente_endereco_cep,
                    c.is_active as cliente_ativo,
                    c.image_url as cliente_image_url,
                    u.name as responsavel_nome,
                    u.email as responsavel_email,
                    os.itens
                FROM mod_ordem_servico_ordens os
                LEFT JOIN mod_ordem_servico_clients c ON os.cliente_id = c.id
                LEFT JOIN users u ON os.usuario_responsavel_id = u.id
                WHERE os.id = $1::uuid AND os.tenant_id = $2
            `;

            const result = await this.prisma.$queryRawUnsafe(query, id, tenantId) as any[];

            const ordem = result[0];
            if (ordem && ordem.equipamento_fotos) {
                try {
                    ordem.equipamento_fotos = typeof ordem.equipamento_fotos === 'string' ? JSON.parse(ordem.equipamento_fotos) : ordem.equipamento_fotos;
                } catch (e) {
                    this.logger.error(`Erro ao parsear fotos da OS ${id}:`, e);
                    ordem.equipamento_fotos = [];
                }
            } else if (ordem) {
                ordem.equipamento_fotos = [];
            }

            if (ordem && ordem.itens) {
                try {
                    ordem.itens = typeof ordem.itens === 'string' ? JSON.parse(ordem.itens) : ordem.itens;
                } catch (e) {
                    this.logger.error(`Erro ao parsear itens da OS ${id}:`, e);
                    ordem.itens = [];
                }
            } else if (ordem) {
                ordem.itens = [];
            }

            // Estruturar dados do cliente e responsável
            if (ordem) {
                ordem.cliente = {
                    name: ordem.cliente_nome,
                    phone_primary: ordem.cliente_telefone,
                    is_active: ordem.cliente_ativo,
                    image_url: ordem.cliente_image_url,
                    // Incluir dados de endereço se necessário
                    address_street: ordem.cliente_endereco_rua,
                    address_number: ordem.cliente_endereco_numero,
                    address_neighborhood: ordem.cliente_endereco_bairro,
                    address_city: ordem.cliente_endereco_cidade,
                    address_state: ordem.cliente_endereco_estado,
                    address_zip: ordem.cliente_endereco_cep
                };
                ordem.responsavel = {
                    name: ordem.responsavel_nome,
                    email: ordem.responsavel_email
                };
            }

            this.logger.log(`✅ Ordem de serviço ${id} encontrada`);
            return ordem;
        } catch (error) {
            this.logger.error(`❌ Erro ao buscar ordem de serviço ${id}:`, error);
            throw error;
        }
    }

    async create(tenantId: string, userId: string, createDto: CreateOrdemServicoDTO) {
        try {
            this.logger.log(`Criando nova ordem de serviço. Tenant: ${tenantId}`);
            this.logger.log(`CreateDTO recebido:`, JSON.stringify(createDto, null, 2));

            // Gerar número sequencial da OS
            const numeroOS = await this.gerarNumeroOS(tenantId);
            this.logger.log(`Número da OS gerado: ${numeroOS}`);

            // Use a more basic INSERT query to avoid column issues
            const query = `
                INSERT INTO mod_ordem_servico_ordens (
                    tenant_id, numero, cliente_id, tipo_servico, prioridade, descricao, 
                    status, origem_solicitacao, valor_servico,
                    usuario_responsavel_id, observacoes_internas, observacoes_cliente, laudo_tecnico,
                    equipamento_tipo, equipamento_marca, equipamento_modelo, equipamento_serie,
                    equipamento_acessorios, equipamento_estado, equipamento_fotos,
                    formatacao_so, formatacao_backup, formatacao_backup_descricao, formatacao_senha,
                    data_abertura, orcamento_aprovado, itens, garantia_dias
                ) VALUES (
                    $1, $2, $3::uuid, $4, $5, $6, $7, $8, $9, $10::uuid, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, NOW(), $25, $26, $27
                )
                RETURNING *
            `;

            const status = createDto.status !== undefined ? createDto.status : 0; // Default: ORCAMENTO
            const orcamentoAprovado = status === 1; // Se status for ABERTA, orçamento já foi aprovado

            // Prepare parameters with logging (simplified)
            const params = [
                tenantId,                                                                                    // $1
                numeroOS,                                                                                    // $2
                createDto.cliente_id,                                                                        // $3
                createDto.tipo_servico,                                                                      // $4
                createDto.prioridade || 'MEDIA',                                                            // $5
                createDto.descricao,                                                                         // $6
                status,                                                                                      // $7
                createDto.origem_solicitacao,                                                               // $8
                createDto.valor_servico || 0,                                                               // $9
                createDto.usuario_responsavel_id === 'UNASSIGNED' || createDto.usuario_responsavel_id === 'NONE' || !createDto.usuario_responsavel_id ? userId : createDto.usuario_responsavel_id, // $10 - Fallback to creator if not assigned
                createDto.observacoes_internas || null,                                                     // $11
                createDto.observacoes_cliente || null,                                                      // $12
                createDto.laudo_tecnico || null,                                                            // $13
                createDto.equipamento_tipo || null,                                                         // $14
                createDto.equipamento_marca || null,                                                        // $15
                createDto.equipamento_modelo || null,                                                       // $16
                createDto.equipamento_serie || null,                                                        // $17
                createDto.equipamento_acessorios || null,                                                   // $18
                createDto.equipamento_estado || null,                                                       // $19
                createDto.equipamento_fotos ? JSON.stringify(createDto.equipamento_fotos) : null,          // $20
                createDto.formatacao_so || null,                                                            // $21
                createDto.formatacao_backup || false,                                                       // $22
                createDto.formatacao_backup_descricao || null,                                              // $23
                createDto.formatacao_senha || null,                                                         // $24
                orcamentoAprovado,                                                                          // $25
                createDto.itens ? JSON.stringify(createDto.itens) : null,                                   // $26
                createDto.garantia_dias || 0                                                                // $27
            ];

            this.logger.log(`Parâmetros da query:`, params);

            const result = await this.prisma.$queryRawUnsafe(query, ...params) as any[];

            const novaOrdem = result[0];
            if (novaOrdem.equipamento_fotos) {
                try {
                    novaOrdem.equipamento_fotos = typeof novaOrdem.equipamento_fotos === 'string' ? JSON.parse(novaOrdem.equipamento_fotos) : novaOrdem.equipamento_fotos;
                } catch (e) {
                    novaOrdem.equipamento_fotos = [];
                }
            } else {
                novaOrdem.equipamento_fotos = [];
            }

            // Registrar no histórico (with error handling)
            try {
                await this.registrarHistorico(
                    tenantId,
                    novaOrdem.id,
                    userId,
                    'CRIACAO',
                    null,
                    `Ordem de serviço criada com status: ${this.getStatusLabel(status)}`,
                    `OS #${numeroOS} criada`
                );
            } catch (historicoError) {
                this.logger.warn(`⚠️ Erro ao registrar histórico (não crítico):`, historicoError);
                // Continue execution even if history logging fails
            }

            this.logger.log(`✅ Ordem de serviço criada: ${novaOrdem.id}`);
            return novaOrdem;
        } catch (error) {
            this.logger.error(`❌ Erro ao criar ordem de serviço:`, error);
            this.logger.error(`❌ Stack trace:`, error.stack);
            throw error;
        }
    }

    async update(tenantId: string, userId: string, id: string, updateDto: UpdateOrdemServicoDTO) {
        try {
            this.logger.log(`Atualizando ordem de serviço ${id}. Tenant: ${tenantId}`);

            // Buscar ordem atual para comparação
            const ordemAtual = await this.findOne(tenantId, id);
            if (!ordemAtual) {
                throw new Error('Ordem de serviço não encontrada');
            }

            const updateFields: string[] = [];
            const params: any[] = [];
            let paramIndex = 1;

            const fieldsToUpdate = [
                'tipo_servico', 'prioridade', 'descricao', 'observacoes_internas',
                'observacoes_cliente', 'valor_servico', 'forma_pagamento', 'data_previsao',
                'usuario_responsavel_id', 'equipamento_tipo', 'equipamento_marca',
                'equipamento_modelo', 'equipamento_serie', 'equipamento_acessorios',
                'equipamento_estado', 'formatacao_so', 'formatacao_backup',
                'formatacao_backup_descricao', 'formatacao_senha', 'equipamento_fotos', 'itens',
                'laudo_tecnico', 'garantia_dias'
            ];

            // Handle Status Update if present
            if (updateDto.status !== undefined && updateDto.status !== ordemAtual.status) {
                const transicaoValida = await this.validarTransicaoStatus(ordemAtual.status, updateDto.status);
                if (!transicaoValida) {
                    throw new Error(`Transição de status inválida: ${this.getStatusLabel(ordemAtual.status)} → ${this.getStatusLabel(updateDto.status)}`);
                }

                // If finalizing, validate requirements
                if (updateDto.status === 6) { // FINALIZADA
                    if (ordemAtual.status !== 5) { // EM_EXECUCAO
                        throw new Error('Só é possível finalizar ordens em execução');
                    }
                    if ((!updateDto.valor_servico && !ordemAtual.valor_servico) || (updateDto.valor_servico || ordemAtual.valor_servico) <= 0) {
                        throw new Error('Valor do serviço deve estar definido para finalizar');
                    }
                    updateFields.push(`data_conclusao = NOW()`);
                }

                fieldsToUpdate.push('status');
            }

            for (const field of fieldsToUpdate) {
                if (updateDto[field] !== undefined) {
                    let value = updateDto[field];

                    // Preserve existing special handling for usuario_responsavel_id
                    if (field === 'usuario_responsavel_id' && (value === 'UNASSIGNED' || value === 'NONE' || !value)) {
                        value = null;
                        updateFields.push(`${field} = $${paramIndex}`);
                    }
                    // Handle arrays (e.g., equipamento_fotos, itens) as JSON
                    else if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
                        value = JSON.stringify(value);
                        updateFields.push(`${field} = $${paramIndex}::jsonb`); // Explicitly cast to jsonb
                    } else if (field === 'data_previsao') {
                        updateFields.push(`${field} = $${paramIndex}::timestamp`);
                    } else {
                        updateFields.push(`${field} = $${paramIndex}`);
                    }

                    params.push(value);
                    paramIndex++;
                }
            }

            updateFields.push(`updated_at = NOW()`);

            if (updateFields.length === 1) { // Só tem o updated_at
                return ordemAtual;
            }

            params.push(id, tenantId);
            const query = `
                UPDATE mod_ordem_servico_ordens 
                SET ${updateFields.join(', ')}
                WHERE id = $${paramIndex}::uuid AND tenant_id = $${paramIndex + 1}
                RETURNING *
            `;

            const result = await this.prisma.$queryRawUnsafe(query, ...params) as any[];
            const ordemAtualizada = result[0];
            if (ordemAtualizada.equipamento_fotos) {
                try {
                    ordemAtualizada.equipamento_fotos = typeof ordemAtualizada.equipamento_fotos === 'string' ? JSON.parse(ordemAtualizada.equipamento_fotos) : ordemAtualizada.equipamento_fotos;
                } catch (e) {
                    ordemAtualizada.equipamento_fotos = [];
                }
            } else {
                ordemAtualizada.equipamento_fotos = [];
            }

            if (ordemAtualizada.itens) {
                try {
                    ordemAtualizada.itens = typeof ordemAtualizada.itens === 'string' ? JSON.parse(ordemAtualizada.itens) : ordemAtualizada.itens;
                } catch (e) {
                    ordemAtualizada.itens = [];
                }
            } else {
                ordemAtualizada.itens = [];
            }

            // Registrar alterações no histórico
            await this.registrarAlteracoesHistorico(tenantId, id, userId, ordemAtual, updateDto);

            this.logger.log(`✅ Ordem de serviço ${id} atualizada`);
            return ordemAtualizada;
        } catch (error) {
            this.logger.error(`❌ Erro ao atualizar ordem de serviço ${id}:`, error);
            throw error;
        }
    }

    async updateStatus(tenantId: string, userId: string, id: string, novoStatus: number, motivoCancelamento?: string, observacoes?: string) {
        try {
            this.logger.log(`Atualizando status da ordem ${id} para ${novoStatus}. Tenant: ${tenantId}`);

            const updateFields = ['status = $1', 'updated_at = NOW()'];
            const params: any[] = [novoStatus];
            let paramIndex = 2;

            if (motivoCancelamento) {
                updateFields.push(`motivo_cancelamento = $${paramIndex}`);
                params.push(motivoCancelamento);
                paramIndex++;
            }

            if (novoStatus === 6) { // FINALIZADA
                updateFields.push(`data_conclusao = NOW()`);
            }

            params.push(id, tenantId);
            const query = `
                UPDATE mod_ordem_servico_ordens 
                SET ${updateFields.join(', ')}
                WHERE id = $${paramIndex}::uuid AND tenant_id = $${paramIndex + 1}
                RETURNING *
            `;

            const result = await this.prisma.$queryRawUnsafe(query, ...params) as any[];
            const ordemAtualizada = result[0];

            // Registrar no histórico
            let acao = 'MUDANCA_STATUS';
            let descricao = `Status alterado para: ${this.getStatusLabel(novoStatus)}`;

            if (novoStatus === 6) {
                acao = 'FINALIZACAO';
                descricao = 'Ordem de serviço finalizada';
            } else if (novoStatus === 7) {
                acao = 'CANCELAMENTO';
                descricao = `Ordem de serviço cancelada. Motivo: ${motivoCancelamento}`;
            }

            await this.registrarHistorico(
                tenantId,
                id,
                userId,
                acao,
                null,
                descricao,
                observacoes
            );

            this.logger.log(`✅ Status da ordem ${id} atualizado para ${novoStatus}`);
            return ordemAtualizada;
        } catch (error) {
            this.logger.error(`❌ Erro ao atualizar status da ordem ${id}:`, error);
            throw error;
        }
    }

    async remove(tenantId: string, userId: string, id: string) {
        try {
            this.logger.log(`Excluindo ordem de serviço ${id}. Tenant: ${tenantId}`);

            // Primeiro excluir histórico
            await this.prisma.$executeRawUnsafe(
                `DELETE FROM mod_ordem_servico_historico WHERE ordem_servico_id = $1::uuid`,
                id
            );

            // Depois excluir a ordem
            const result = await this.prisma.$executeRawUnsafe(
                `DELETE FROM mod_ordem_servico_ordens WHERE id = $1::uuid AND tenant_id = $2`,
                id,
                tenantId
            );

            this.logger.log(`✅ Ordem de serviço ${id} excluída`);
            return { success: true };
        } catch (error) {
            this.logger.error(`❌ Erro ao excluir ordem de serviço ${id}:`, error);
            throw error;
        }
    }

    async aprovarOrcamento(tenantId: string, userId: string, id: string) {
        try {
            this.logger.log(`Aprovando orçamento ${id}. Tenant: ${tenantId}`);

            const query = `
                UPDATE mod_ordem_servico_ordens 
                SET status = 1, orcamento_aprovado = true, updated_at = NOW()
                WHERE id = $1::uuid AND tenant_id = $2 AND status = 0
                RETURNING *
            `;

            const result = await this.prisma.$queryRawUnsafe(query, id, tenantId) as any[];

            if (result.length === 0) {
                throw new Error('Orçamento não encontrado ou já aprovado');
            }

            // Registrar no histórico
            await this.registrarHistorico(
                tenantId,
                id,
                userId,
                'APROVACAO_ORCAMENTO',
                null,
                'Orçamento aprovado - Status alterado para Aberta',
                null
            );

            this.logger.log(`✅ Orçamento ${id} aprovado`);
            return result[0];
        } catch (error) {
            this.logger.error(`❌ Erro ao aprovar orçamento ${id}:`, error);
            throw error;
        }
    }

    async getHistorico(tenantId: string, ordemId: string) {
        try {
            this.logger.log(`Buscando histórico da ordem ${ordemId}. Tenant: ${tenantId}`);

            const query = `
                SELECT 
                    h.*,
                    u.name as usuario_nome,
                    u.email as usuario_email
                FROM mod_ordem_servico_historico h
                LEFT JOIN users u ON h.usuario_id::uuid = u.id
                WHERE h.ordem_servico_id = $1
                ORDER BY h.created_at DESC
            `;

            const historico = await this.prisma.$queryRawUnsafe(query, ordemId) as any[];

            this.logger.log(`✅ ${historico.length} registros de histórico encontrados`);
            return historico;
        } catch (error) {
            this.logger.error(`❌ Erro ao buscar histórico da ordem ${ordemId}:`, error);
            throw error;
        }
    }

    async getDashboardData(tenantId: string) {
        try {
            this.logger.log(`Buscando dados do dashboard. Tenant: ${tenantId}`);

            const query = `
                SELECT 
                    status,
                    COUNT(*)::int as quantidade,
                    COALESCE(SUM(valor_servico), 0)::float as valor_total
                FROM mod_ordem_servico_ordens 
                WHERE tenant_id = $1
                GROUP BY status
                ORDER BY status
            `;

            const dados = await this.prisma.$queryRawUnsafe(query, tenantId) as any[];

            this.logger.log(`✅ Dados do dashboard obtidos`);
            return dados;
        } catch (error) {
            this.logger.error(`❌ Erro ao buscar dados do dashboard:`, error);
            throw error;
        }
    }

    async isClienteAtivo(tenantId: string, clienteId: string): Promise<boolean> {
        try {
            const result = await this.prisma.$queryRawUnsafe(
                `SELECT is_active FROM mod_ordem_servico_clients WHERE id = $1::uuid AND tenant_id = $2 AND deleted_at IS NULL`,
                clienteId,
                tenantId
            ) as any[];

            // Debug logging to understand what's being returned
            this.logger.log(`🔍 Cliente validation debug:`, {
                clienteId,
                tenantId,
                resultLength: result.length,
                result: result[0],
                is_active_value: result[0]?.is_active,
                is_active_type: typeof result[0]?.is_active,
            });

            if (result.length === 0) {
                this.logger.warn(`⚠️ Cliente não encontrado: ${clienteId}`);
                return false;
            }

            const isActiveValue = result[0].is_active;

            // Handle different data types for is_active field
            let isActive = false;
            if (typeof isActiveValue === 'boolean') {
                isActive = isActiveValue;
            } else if (typeof isActiveValue === 'string') {
                isActive = isActiveValue.toLowerCase() === 'true' || isActiveValue === '1';
            } else if (typeof isActiveValue === 'number') {
                isActive = isActiveValue === 1;
            } else {
                // Handle null/undefined as inactive
                isActive = false;
            }

            this.logger.log(`✅ Cliente ${clienteId} ativo: ${isActive}`);
            return isActive;
        } catch (error) {
            this.logger.error(`❌ Erro ao verificar se cliente está ativo:`, error);
            return false;
        }
    }

    async validarTransicaoStatus(statusAtual: number, novoStatus: number): Promise<boolean> {
        const transicoesPermitidas = this.TRANSICOES_PERMITIDAS[statusAtual] || [];
        return transicoesPermitidas.includes(novoStatus);
    }

    // Métodos auxiliares privados
    private async gerarNumeroOS(tenantId: string): Promise<string> {
        const result = await this.prisma.$queryRawUnsafe(
            `SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM '^[0-9]+') AS INTEGER)), 0) + 1 as proximo_numero
             FROM mod_ordem_servico_ordens 
             WHERE tenant_id = $1 AND numero ~ '^[0-9]+'`,
            tenantId
        ) as any[];

        const proximoNumero = result[0]?.proximo_numero || 1;
        return proximoNumero.toString().padStart(6, '0');
    }

    private async registrarHistorico(
        tenantId: string,
        ordemId: string,
        usuarioId: string,
        acao: string,
        valorAnterior: string | null,
        valorNovo: string,
        observacoes: string | null
    ) {
        try {
            await this.prisma.$executeRawUnsafe(
                `INSERT INTO mod_ordem_servico_historico 
                 (tenant_id, ordem_servico_id, usuario_id, acao, valor_anterior, valor_novo, observacoes)
                 VALUES ($1, $2::uuid, $3::uuid, $4, $5, $6, $7)`,
                tenantId,
                ordemId,
                usuarioId,
                acao,
                valorAnterior,
                valorNovo,
                observacoes
            );
        } catch (error) {
            this.logger.error(`❌ Erro ao registrar histórico:`, error);
        }
    }

    private async registrarAlteracoesHistorico(
        tenantId: string,
        ordemId: string,
        usuarioId: string,
        ordemAtual: any,
        updateDto: UpdateOrdemServicoDTO
    ) {
        const alteracoes: string[] = [];

        if (updateDto.tipo_servico && updateDto.tipo_servico !== ordemAtual.tipo_servico) {
            alteracoes.push(`Tipo de serviço: ${ordemAtual.tipo_servico} → ${updateDto.tipo_servico}`);
        }

        if (updateDto.descricao && updateDto.descricao !== ordemAtual.descricao) {
            alteracoes.push(`Descrição alterada`);
        }

        if (updateDto.valor_servico !== undefined && updateDto.valor_servico !== ordemAtual.valor_servico) {
            alteracoes.push(`Valor: R$ ${ordemAtual.valor_servico} → R$ ${updateDto.valor_servico}`);
        }

        if (updateDto.usuario_responsavel_id && updateDto.usuario_responsavel_id !== ordemAtual.usuario_responsavel_id) {
            alteracoes.push(`Responsável alterado`);
        }

        if (updateDto.status !== undefined && updateDto.status !== ordemAtual.status) {
            alteracoes.push(`Status: ${this.getStatusLabel(ordemAtual.status)} → ${this.getStatusLabel(updateDto.status)}`);
        }

        if (alteracoes.length > 0) {
            await this.registrarHistorico(
                tenantId,
                ordemId,
                usuarioId,
                'EDICAO',
                null,
                alteracoes.join('; '),
                null
            );
        }
    }

    private getStatusLabel(status: number): string {
        const labels = {
            0: 'Orçamento',
            1: 'Aberta',
            2: 'Em Análise',
            3: 'Aguardando Cliente',
            4: 'Aguardando Peças',
            5: 'Em Execução',
            6: 'Finalizada',
            7: 'Cancelada'
        };
        return labels[status] || 'Desconhecido';
    }

    async getTiposServico(tenantId: string) {
        try {
            this.logger.log(`Buscando tipos de serviço. Tenant: ${tenantId}`);

            const result = await this.prisma.$queryRawUnsafe<any[]>(
                `SELECT id, nome, is_default FROM mod_ordem_servico_tipos_servico 
                 WHERE tenant_id = $1 
                 ORDER BY is_default DESC, nome ASC`,
                tenantId
            );

            this.logger.log(`✅ ${result.length} tipos de serviço encontrados`);
            return result;
        } catch (error) {
            this.logger.error(`❌ Erro ao buscar tipos de serviço:`, error);
            throw error;
        }
    }

    async getTiposEquipamento(tenantId: string) {
        try {
            this.logger.log(`Buscando tipos de equipamento. Tenant: ${tenantId}`);

            const result = await this.prisma.$queryRawUnsafe<any[]>(
                `SELECT id, nome FROM mod_ordem_servico_tipos_equipamento 
                 WHERE tenant_id = $1 
                 ORDER BY nome ASC`,
                tenantId
            );

            this.logger.log(`✅ ${result.length} tipos de equipamento encontrados`);
            return result;
        } catch (error) {
            this.logger.error(`❌ Erro ao buscar tipos de equipamento:`, error);
            throw error;
        }
    }

    async getTechnicians(tenantId: string) {
        try {
            this.logger.log(`Buscando técnicos. Tenant: ${tenantId}`);

            const result = await this.prisma.$queryRawUnsafe<any[]>(
                `SELECT u.id, u.name, u.email 
                 FROM users u
                 INNER JOIN mod_ordem_servico_user_roles osr ON u.id = osr.user_id AND u."tenantId" = osr.tenant_id
                 WHERE u."tenantId" = $1 AND u."isLocked" = false AND osr.is_technician = true
                 ORDER BY u.name ASC`,
                tenantId
            );

            this.logger.log(`✅ ${result.length} técnicos encontrados`);
            return result;
        } catch (error) {
            this.logger.error(`❌ Erro ao buscar técnicos:`, error);
            throw error;
        }
    }
}
