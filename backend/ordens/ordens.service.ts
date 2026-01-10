import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { CreateOrdemServicoDTO, UpdateOrdemServicoDTO, OrdemServicoFilters } from '../shared/dto/ordem-servico.dto';

@Injectable()
export class OrdensService {
    private readonly logger = new Logger(OrdensService.name);

    constructor(private readonly prisma: PrismaService) { }

    // Transições de status permitidas
    private readonly TRANSICOES_PERMITIDAS = {
        0: [1, 7], // ORCAMENTO -> ABERTA, CANCELADA
        1: [2, 7], // ABERTA -> EM_ANALISE, CANCELADA
        2: [5, 3, 4, 7], // EM_ANALISE -> EM_EXECUCAO, AGUARDANDO_CLIENTE, AGUARDANDO_PECAS, CANCELADA
        3: [2, 5, 4, 7], // AGUARDANDO_CLIENTE -> EM_ANALISE, EM_EXECUCAO, AGUARDANDO_PECAS, CANCELADA
        4: [5, 3, 7], // AGUARDANDO_PECAS -> EM_EXECUCAO, AGUARDANDO_CLIENTE, CANCELADA
        5: [6, 3, 4, 7], // EM_EXECUCAO -> FINALIZADA, AGUARDANDO_CLIENTE, AGUARDANDO_PECAS, CANCELADA
        6: [], // FINALIZADA -> nenhuma
        7: [] // CANCELADA -> nenhuma
    };

    async findAll(tenantId: string, filters: OrdemServicoFilters) {
        try {
            this.logger.log(`Buscando ordens de serviço. Tenant: ${tenantId}`);

            const params: any[] = [tenantId];
            let whereConditions: string[] = [`os.tenant_id = $1`];
            
            // Helper to add param and return its index
            const addParam = (value: any) => {
                params.push(value);
                return params.length;
            };

            // Aplicar filtros
            if (filters.search) {
                const searchParam = filters.search.trim();
                
                if (searchParam.length > 0 && searchParam.length < 2) {
                    whereConditions.push('1=0'); // Força resultado vazio para busca curta
                } else if (searchParam.length >= 2) {
                    const searchPattern = `%${searchParam.toLowerCase()}%`;
                    const pIdx = addParam(searchPattern);
                    
                    // Robust search with text casting
                    whereConditions.push(`(
                        LOWER(COALESCE(os.numero::text, '')) LIKE $${pIdx}::text 
                        OR LOWER(COALESCE(c.name::text, '')) LIKE $${pIdx}::text 
                        OR LOWER(COALESCE(os.descricao::text, '')) LIKE $${pIdx}::text
                        OR LOWER(COALESCE(u.name::text, '')) LIKE $${pIdx}::text
                    )`);
                }
            }

            if (filters.status && filters.status.length > 0) {
                const pIdx = addParam(filters.status);
                whereConditions.push(`os.status = ANY($${pIdx})`);
            }

            if (filters.cliente_id) {
                const pIdx = addParam(filters.cliente_id);
                whereConditions.push(`os.cliente_id = $${pIdx}`);
            }

            if (filters.usuario_responsavel_id) {
                const pIdx = addParam(filters.usuario_responsavel_id);
                whereConditions.push(`os.usuario_responsavel_id = $${pIdx}`);
            }

            if (filters.data_inicio) {
                const pIdx = addParam(filters.data_inicio);
                whereConditions.push(`os.data_abertura >= $${pIdx}`);
            }

            if (filters.data_fim) {
                const pIdx = addParam(filters.data_fim);
                whereConditions.push(`os.data_abertura <= $${pIdx}`);
            }

            if (filters.origem_solicitacao) {
                const pIdx = addParam(filters.origem_solicitacao);
                whereConditions.push(`os.origem_solicitacao = $${pIdx}`);
            }

            if (filters.tipo_servico) {
                const pIdx = addParam(filters.tipo_servico);
                whereConditions.push(`os.tipo_servico = $${pIdx}`);
            }

            const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

            // Using explicit text cast on join to avoid UUID vs Text issues with 'UNASSIGNED' values
            const query = `
                SELECT 
                    os.*,
                    c.name as cliente_nome,
                    c.phone_primary as cliente_telefone,
                    c.is_active as cliente_ativo,
                    u.name as responsavel_nome,
                    u.email as responsavel_email
                FROM mod_ordem_servico_ordens os
                LEFT JOIN mod_ordem_servico_clients c ON os.cliente_id = c.id
                LEFT JOIN users u ON os.usuario_responsavel_id = u.id::text
                ${whereClause}
                ORDER BY os.created_at DESC
            `;

            this.logger.log('Executing Query:', query);
            this.logger.log('Query Params:', params);

            const parsePhotos = (photos: any) => {
                try {
                    return typeof photos === 'string' ? JSON.parse(photos) : (photos || []);
                } catch (e) {
                    return [];
                }
            };

            const ordens = (await this.prisma.$queryRawUnsafe(query, ...params) as any[]).map(os => ({
                ...os,
                equipamento_fotos: parsePhotos(os.equipamento_fotos),
                cliente: {
                    name: os.cliente_nome,
                    phone_primary: os.cliente_telefone,
                    is_active: os.cliente_ativo
                },
                responsavel: {
                    name: os.responsavel_nome,
                    email: os.responsavel_email
                }
            }));

            this.logger.log(`${ordens.length} ordens de serviço encontradas`);
            return ordens;
        } catch (error) {
            this.logger.error('Erro ao buscar ordens de serviço:', error);
            if (error instanceof Error) {
                this.logger.error('Stack:', error.stack);
            }
            throw error;
        }
    }

    async findOne(tenantId: string, id: string) {
        try {
            this.logger.log(`Buscando ordem de serviço ${id}. Tenant: ${tenantId}`);

            const result = await this.prisma.$queryRaw`
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
                    u.name as responsavel_nome,
                    u.email as responsavel_email
                FROM mod_ordem_servico_ordens os
                LEFT JOIN mod_ordem_servico_clients c ON os.cliente_id = c.id
                LEFT JOIN users u ON os.usuario_responsavel_id = u.id
                WHERE os.id = ${id} AND os.tenant_id = ${tenantId}
            ` as any[];

            const ordem = result[0];
            if (ordem && ordem.equipamento_fotos) {
                try {
                    ordem.equipamento_fotos = typeof ordem.equipamento_fotos === 'string' ? JSON.parse(ordem.equipamento_fotos) : ordem.equipamento_fotos;
                } catch (e) {
                    this.logger.error('Erro ao parsear fotos da OS:', e);
                    ordem.equipamento_fotos = [];
                }
            } else if (ordem) {
                ordem.equipamento_fotos = [];
            }

            // Estruturar dados do cliente e responsável
            if (ordem) {
                ordem.cliente = {
                    name: ordem.cliente_nome,
                    phone_primary: ordem.cliente_telefone,
                    is_active: ordem.cliente_ativo,
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

            this.logger.log(`Ordem de serviço ${id} encontrada`);
            return ordem;
        } catch (error) {
            this.logger.error('Erro ao buscar ordem de serviço:', error);
            throw error;
        }
    }

    async create(tenantId: string, userId: string, createDto: CreateOrdemServicoDTO) {
        try {
            this.logger.log(`Criando nova ordem de serviço. Tenant: ${tenantId}`);
            this.logger.log('CreateDTO recebido:', JSON.stringify(createDto, null, 2));

            // Gerar número sequencial da OS
            const numeroOS = await this.gerarNumeroOS(tenantId);
            this.logger.log(`Número da OS gerado: ${numeroOS}`);

            const status = createDto.status !== undefined ? createDto.status : 0; // Default: ORCAMENTO
            const orcamentoAprovado = status === 1; // Se status for ABERTA, orçamento já foi aprovado

            // Use a more basic INSERT query to avoid column issues
            const result = await this.prisma.$queryRaw`
                INSERT INTO mod_ordem_servico_ordens (
                    tenant_id, numero, cliente_id, tipo_servico, prioridade, descricao, 
                    status, origem_solicitacao, valor_servico,
                    usuario_responsavel_id, observacoes_internas, observacoes_cliente,
                    equipamento_tipo, equipamento_marca, equipamento_modelo, equipamento_serie,
                    equipamento_acessorios, equipamento_estado, equipamento_fotos,
                    formatacao_so, formatacao_backup, formatacao_backup_descricao, formatacao_senha,
                    data_abertura, orcamento_aprovado
                ) VALUES (
                    ${tenantId}, ${numeroOS}, ${createDto.cliente_id}::uuid, ${createDto.tipo_servico}, ${createDto.prioridade || 'MEDIA'}, ${createDto.descricao}, 
                    ${status}, ${createDto.origem_solicitacao}, ${createDto.valor_servico || 0}, ${createDto.usuario_responsavel_id === 'UNASSIGNED' || createDto.usuario_responsavel_id === 'NONE' || !createDto.usuario_responsavel_id ? userId : createDto.usuario_responsavel_id}::uuid, 
                    ${createDto.observacoes_internas || null}, ${createDto.observacoes_cliente || null},
                    ${createDto.equipamento_tipo || null}, ${createDto.equipamento_marca || null}, ${createDto.equipamento_modelo || null}, ${createDto.equipamento_serie || null},
                    ${createDto.equipamento_acessorios || null}, ${createDto.equipamento_estado || null}, ${createDto.equipamento_fotos ? JSON.stringify(createDto.equipamento_fotos) : null},
                    ${createDto.formatacao_so || null}, ${createDto.formatacao_backup || false}, ${createDto.formatacao_backup_descricao || null}, ${createDto.formatacao_senha || null},
                    NOW(), ${orcamentoAprovado}
                )
                RETURNING *
            ` as any[];

            this.logger.log('Parâmetros da query processados');

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
                this.logger.warn('Erro ao registrar histórico (não crítico):', historicoError);
                // Continue execution even if history logging fails
            }

            this.logger.log(`Ordem de serviço criada: ${novaOrdem.id}`);
            return novaOrdem;
        } catch (error) {
            this.logger.error('Erro ao criar ordem de serviço:', error);
            this.logger.error('Stack trace:', error.stack);
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
                'formatacao_backup_descricao', 'formatacao_senha', 'equipamento_fotos'
            ];

            for (const field of fieldsToUpdate) {
                if (updateDto[field] !== undefined) {
                    let value = updateDto[field];
                    if (field === 'usuario_responsavel_id' && (value === 'UNASSIGNED' || value === 'NONE' || !value)) value = null;
                    if (field === 'equipamento_fotos' && value !== null) value = JSON.stringify(value);

                    updateFields.push(`${field} = $${paramIndex}`);
                    params.push(value);
                    paramIndex++;
                }
            }

            updateFields.push('updated_at = NOW()');

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

            // Registrar alterações no histórico
            await this.registrarAlteracoesHistorico(tenantId, id, userId, ordemAtual, updateDto);

            this.logger.log(`Ordem de serviço ${id} atualizada`);
            return ordemAtualizada;
        } catch (error) {
            this.logger.error('Erro ao atualizar ordem de serviço:', error);
            throw error;
        }
    }

    async updateStatus(tenantId: string, userId: string, id: string, novoStatus: number, motivoCancelamento?: string, observacoes?: string) {
        try {
            this.logger.log(`Atualizando status da ordem ${id} para ${this.getStatusLabel(novoStatus)}. Tenant: ${tenantId}`);

            const updateFields = [`status = $1`, 'updated_at = NOW()'];
            const params: any[] = [novoStatus];
            let paramIndex = 2;

            if (motivoCancelamento) {
                updateFields.push(`motivo_cancelamento = $${paramIndex}`);
                params.push(motivoCancelamento);
                paramIndex++;
            }

            if (novoStatus === 6) { // FINALIZADA
                updateFields.push('data_conclusao = NOW()');
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
                descricao = `Ordem de serviço cancelada. Motivo: ${observacoes || 'Não informado'}`;
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

            this.logger.log(`Status da ordem ${id} atualizado para ${this.getStatusLabel(novoStatus)}`);
            return ordemAtualizada;
        } catch (error) {
            this.logger.error('Erro ao atualizar status da ordem:', error);
            throw error;
        }
    }

    async remove(tenantId: string, userId: string, id: string) {
        try {
            this.logger.log(`Excluindo ordem de serviço ${id}. Tenant: ${tenantId}`);

            // Primeiro excluir histórico
            await this.prisma.$queryRaw`
                DELETE FROM mod_ordem_servico_historico WHERE ordem_servico_id = ${id}::uuid
            `;

            // Depois excluir a ordem
            const result = await this.prisma.$queryRaw`
                DELETE FROM mod_ordem_servico_ordens WHERE id = ${id}::uuid AND tenant_id = ${tenantId}
            `;

            this.logger.log(`Ordem de serviço ${id} excluída`);
            return { success: true };
        } catch (error) {
            this.logger.error('Erro ao excluir ordem de serviço:', error);
            throw error;
        }
    }

    async aprovarOrcamento(tenantId: string, userId: string, id: string) {
        try {
            this.logger.log(`Aprovando orçamento ${id}. Tenant: ${tenantId}`);

            const result = await this.prisma.$queryRaw`
                UPDATE mod_ordem_servico_ordens 
                SET status = 1, orcamento_aprovado = true, updated_at = NOW()
                WHERE id = ${id}::uuid AND tenant_id = ${tenantId} AND status = 0
                RETURNING *
            ` as any[];

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

            this.logger.log(`Orçamento ${id} aprovado`);
            return result[0];
        } catch (error) {
            this.logger.error('Erro ao aprovar orçamento:', error);
            throw error;
        }
    }

    async getHistorico(tenantId: string, ordemId: string) {
        try {
            this.logger.log(`Buscando histórico da ordem ${ordemId}. Tenant: ${tenantId}`);

            const historico = await this.prisma.$queryRaw`
                SELECT 
                    h.*,
                    u.name as usuario_nome,
                    u.email as usuario_email
                FROM mod_ordem_servico_historico h
                LEFT JOIN users u ON h.usuario_id::uuid = u.id
                WHERE h.ordem_servico_id = ${ordemId}
                ORDER BY h.created_at DESC
            ` as any[];

            this.logger.log(`${historico.length} registros de histórico encontrados`);
            return historico;
        } catch (error) {
            this.logger.error('Erro ao buscar histórico da ordem:', error);
            throw error;
        }
    }

    async getDashboardData(tenantId: string) {
        try {
            this.logger.log(`Buscando dados do dashboard. Tenant: ${tenantId}`);

            const dados = await this.prisma.$queryRaw`
                SELECT 
                    status,
                    COUNT(*)::int as quantidade,
                    COALESCE(SUM(valor_servico), 0)::float as valor_total
                FROM mod_ordem_servico_ordens 
                WHERE tenant_id = ${tenantId}
                GROUP BY status
                ORDER BY status
            ` as any[];

            this.logger.log('Dados do dashboard obtidos');
            return dados;
        } catch (error) {
            this.logger.error('Erro ao buscar dados do dashboard:', error);
            throw error;
        }
    }

    async isClienteAtivo(tenantId: string, clienteId: string): Promise<boolean> {
        try {
            const result = await this.prisma.$queryRaw`
                SELECT is_active FROM mod_ordem_servico_clients WHERE id = ${clienteId}::uuid AND tenant_id = ${tenantId} AND deleted_at IS NULL
            ` as any[];

            // Debug logging to understand what's being returned
            this.logger.log('Cliente validation debug:', {
                clienteId,
                tenantId,
                resultLength: result.length,
                result: result[0],
                is_active_value: result[0]?.is_active,
                is_active_type: typeof result[0]?.is_active,
            });

            if (result.length === 0) {
                this.logger.warn('Cliente não encontrado:', clienteId);
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

            this.logger.log('Cliente ativo:', isActive);
            return isActive;
        } catch (error) {
            this.logger.error('Erro ao verificar se cliente está ativo:', error);
            return false;
        }
    }

    async validarTransicaoStatus(statusAtual: number, novoStatus: number): Promise<boolean> {
        const transicoesPermitidas = this.TRANSICOES_PERMITIDAS[statusAtual] || [];
        return transicoesPermitidas.includes(novoStatus);
    }

    // Métodos auxiliares privados
    private async gerarNumeroOS(tenantId: string): Promise<string> {
        const result = await this.prisma.$queryRaw`
            SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM '^[0-9]+') AS INTEGER)), 0) + 1 as proximo_numero
             FROM mod_ordem_servico_ordens 
             WHERE tenant_id = ${tenantId} AND numero ~ '^[0-9]+'
        ` as any[];

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
            await this.prisma.$queryRaw`
                INSERT INTO mod_ordem_servico_historico 
                 (tenant_id, ordem_servico_id, usuario_id, acao, valor_anterior, valor_novo, observacoes)
                 VALUES (${tenantId}, ${ordemId}::uuid, ${usuarioId}::uuid, ${acao}, ${valorAnterior}, ${valorNovo}, ${observacoes})
            `;
        } catch (error) {
            this.logger.error('Erro ao registrar histórico:', error);
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
            alteracoes.push('Descrição alterada');
        }

        if (updateDto.valor_servico !== undefined && updateDto.valor_servico !== ordemAtual.valor_servico) {
            alteracoes.push(`Valor: R$ ${ordemAtual.valor_servico} → R$ ${updateDto.valor_servico}`);
        }

        if (updateDto.usuario_responsavel_id && updateDto.usuario_responsavel_id !== ordemAtual.usuario_responsavel_id) {
            alteracoes.push('Responsável alterado');
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
            this.logger.log('Buscando tipos de serviço. Tenant:', tenantId);

            const result = await this.prisma.$queryRaw<any[]>`
                SELECT id, nome, is_default FROM mod_ordem_servico_tipos_servico 
                 WHERE tenant_id = ${tenantId}
                 ORDER BY is_default DESC, nome ASC
            `;

            this.logger.log(`${result.length} tipos de serviço encontrados`);
            return result;
        } catch (error) {
            this.logger.error('Erro ao buscar tipos de serviço:', error);
            throw error;
        }
    }

    async getTiposEquipamento(tenantId: string) {
        try {
            this.logger.log('Buscando tipos de equipamento. Tenant:', tenantId);

            const result = await this.prisma.$queryRaw<any[]>`
                SELECT id, nome FROM mod_ordem_servico_tipos_equipamento 
                 WHERE tenant_id = ${tenantId}
                 ORDER BY nome ASC
            `;

            this.logger.log(`${result.length} tipos de equipamento encontrados`);
            return result;
        } catch (error) {
            this.logger.error('Erro ao buscar tipos de equipamento:', error);
            throw error;
        }
    }

    async getTechnicians(tenantId: string) {
        try {
            this.logger.log('Buscando técnicos. Tenant:', tenantId);

            const result = await this.prisma.$queryRaw<any[]>`
                SELECT u.id, u.name, u.email 
                 FROM users u
                 INNER JOIN mod_ordem_servico_user_roles osr ON u.id = osr.user_id AND u."tenantId" = osr.tenant_id
                 WHERE u."tenantId" = ${tenantId} AND u."isLocked" = false AND osr.is_technician = true
                 ORDER BY u.name ASC
            `;

            this.logger.log(`${result.length} técnicos encontrados`);
            return result;
        } catch (error) {
            this.logger.error('Erro ao buscar técnicos:', error);
            throw error;
        }
    }
}
