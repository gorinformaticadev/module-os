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

            let whereClause = `WHERE os.tenant_id = $1`;
            const params: any[] = [tenantId];
            let paramIndex = 2;

            // Aplicar filtros
            if (filters.search) {
                whereClause += ` AND (os.numero ILIKE $${paramIndex} OR c.name ILIKE $${paramIndex} OR os.descricao ILIKE $${paramIndex})`;
                params.push(`%${filters.search}%`);
                paramIndex++;
            }

            if (filters.status && filters.status.length > 0) {
                whereClause += ` AND os.status = ANY($${paramIndex})`;
                params.push(filters.status);
                paramIndex++;
            }

            if (filters.cliente_id) {
                whereClause += ` AND os.cliente_id = $${paramIndex}`;
                params.push(filters.cliente_id);
                paramIndex++;
            }

            if (filters.usuario_responsavel_id) {
                whereClause += ` AND os.usuario_responsavel_id = $${paramIndex}`;
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
                LEFT JOIN users u ON os.usuario_responsavel_id::uuid = u.id
                ${whereClause}
                ORDER BY os.created_at DESC
            `;

            const ordens = (await this.prisma.$queryRawUnsafe(query, ...params) as any[]).map(os => ({
                ...os,
                equipamento_fotos: os.equipamento_fotos ? (typeof os.equipamento_fotos === 'string' ? JSON.parse(os.equipamento_fotos) : os.equipamento_fotos) : []
            }));

            this.logger.log(`✅ ${ordens.length} ordens de serviço encontradas`);
            return ordens;
        } catch (error) {
            this.logger.error(`❌ Erro ao buscar ordens de serviço:`, error);
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
                    u.name as responsavel_nome,
                    u.email as responsavel_email
                FROM mod_ordem_servico_ordens os
                LEFT JOIN mod_ordem_servico_clients c ON os.cliente_id = c.id
                LEFT JOIN users u ON os.usuario_responsavel_id::uuid = u.id
                WHERE os.id = $1 AND os.tenant_id = $2
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

            // Gerar número sequencial da OS
            const numeroOS = await this.gerarNumeroOS(tenantId);

            const query = `
                INSERT INTO mod_ordem_servico_ordens (
                    tenant_id, numero, cliente_id, usuario_responsavel_id, tipo_servico,
                    prioridade, descricao, observacoes_internas, observacoes_cliente,
                    valor_servico, forma_pagamento, status, data_abertura, data_previsao, 
                    origem_solicitacao, orcamento_aprovado,
                    equipamento_tipo, equipamento_marca, equipamento_modelo, 
                    equipamento_serie, equipamento_acessorios, equipamento_estado,
                    formatacao_so, formatacao_backup, formatacao_backup_descricao, formatacao_senha,
                    equipamento_fotos
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
                RETURNING *
            `;

            const status = createDto.status !== undefined ? createDto.status : 0; // Default: ORCAMENTO
            const orcamentoAprovado = status === 1; // Se status for ABERTA, orçamento já foi aprovado

            const result = await this.prisma.$queryRawUnsafe(
                query,
                tenantId,
                numeroOS,
                createDto.cliente_id,
                createDto.usuario_responsavel_id === 'UNASSIGNED' ? null : (createDto.usuario_responsavel_id || userId),
                createDto.tipo_servico,
                createDto.prioridade || 'MEDIA',
                createDto.descricao,
                createDto.observacoes_internas || null,
                createDto.observacoes_cliente || null,
                createDto.valor_servico || 0,
                createDto.forma_pagamento || null,
                status,
                createDto.data_previsao || null,
                createDto.origem_solicitacao,
                orcamentoAprovado,
                createDto.equipamento_tipo || null,
                createDto.equipamento_marca || null,
                createDto.equipamento_modelo || null,
                createDto.equipamento_serie || null,
                createDto.equipamento_acessorios || null,
                createDto.equipamento_estado || null,
                createDto.formatacao_so || null,
                createDto.formatacao_backup || false,
                createDto.formatacao_backup_descricao || null,
                createDto.formatacao_senha || null,
                createDto.equipamento_fotos ? JSON.stringify(createDto.equipamento_fotos) : null
            ) as any[];

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

            // Registrar no histórico
            await this.registrarHistorico(
                tenantId,
                novaOrdem.id,
                userId,
                'CRIACAO',
                null,
                `Ordem de serviço criada com status: ${this.getStatusLabel(status)}`,
                `OS #${numeroOS} criada`
            );

            this.logger.log(`✅ Ordem de serviço criada: ${novaOrdem.id}`);
            return novaOrdem;
        } catch (error) {
            this.logger.error(`❌ Erro ao criar ordem de serviço:`, error);
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
                    if (field === 'usuario_responsavel_id' && value === 'UNASSIGNED') value = null;
                    if (field === 'equipamento_fotos' && value !== null) value = JSON.stringify(value);

                    updateFields.push(`${field} = $${paramIndex}`);
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
                WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1}
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
                WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1}
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
                `DELETE FROM mod_ordem_servico_historico WHERE ordem_servico_id = $1`,
                id
            );

            // Depois excluir a ordem
            const result = await this.prisma.$executeRawUnsafe(
                `DELETE FROM mod_ordem_servico_ordens WHERE id = $1 AND tenant_id = $2`,
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
                WHERE id = $1 AND tenant_id = $2 AND status = 0
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
                `SELECT is_active FROM mod_ordem_servico_clients WHERE id = $1 AND tenant_id = $2`,
                clienteId,
                tenantId
            ) as any[];

            return result.length > 0 && result[0].is_active;
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
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
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
}