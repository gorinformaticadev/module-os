import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@core/prisma/prisma.service';
import { RequestSecurityContextService } from '@common/services/request-security-context.service';
import {
    CreateOrdemServicoDTO,
    OrdemServicoFilters,
    PagamentoDTO,
    RetiradaDTO,
    StatusOS,
    UpdateOrdemServicoDTO,
    AlertaAbandonoDTO,
} from '../shared/dto/ordem-servico.dto';
import { ClientesService } from '../../clientes/src/clientes.service';
import { OrdemRepository } from './repositories/ordem.repository';
import * as puppeteer from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';
import { generatePdfHtml } from './pdf-template.util';

@Injectable()
export class OrdensService {
    private readonly logger = new Logger(OrdensService.name);

    private readonly TRANSICOES_PERMITIDAS: Record<number, number[]> = {
        0: [1, 7],
        1: [2, 7],
        2: [5, 3, 4, 7],
        3: [2, 5, 4, 7],
        4: [5, 3, 7],
        5: [6, 3, 4, 7],
        6: [5, 8, 9],
        7: [5],
        8: [],
        9: [],
    };

    constructor(
        private readonly requestSecurityContext: RequestSecurityContextService,
        private readonly eventEmitter: EventEmitter2,
        private readonly ordemRepository: OrdemRepository,
        private readonly clientesService: ClientesService,
        private readonly corePrisma: PrismaService,
    ) { }

async findOne(id: string) {
        const ordem = await this.ordemRepository.findById(id);

        if (!ordem) {
            throw new NotFoundException('Ordem de servico nao encontrada');
        }

        return this.mapOrder(ordem, null);
    }

    async isClienteAtivo(clienteId: string): Promise<boolean> {
        const cliente = await this.clientesService.findById(clienteId);
        return cliente?.is_active === true;
    }

    async validarTransicaoStatus(statusAtual: number, novoStatus: number): Promise<boolean> {
        return (this.TRANSICOES_PERMITIDAS[statusAtual] || []).includes(novoStatus);
    }

    async getConfig(key: string): Promise<string | null> {
        return this.ordemRepository.getConfig(key);
    }

    private parseJson<T>(value: string | null | undefined, fallback: T): T {
        if (!value) {
            return fallback;
        }
        try {
            return JSON.parse(value) as T;
        } catch {
            return fallback;
        }
    }

    private stringifyJson(value: unknown) {
        if (value === undefined || value === null) {
            return null;
        }
        return JSON.stringify(value);
    }

    private parseDate(value?: string | null) {
        if (!value) return null;
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    private normalizeResponsibleId(value: string | undefined, fallback: string) {
        const normalized = String(value || '').trim();
        if (!normalized || normalized === 'UNASSIGNED' || normalized === 'NONE') {
            return fallback;
        }
        return normalized;
    }

    private normalizeNullableResponsibleId(value: string | undefined) {
        const normalized = String(value || '').trim();
        if (!normalized || normalized === 'UNASSIGNED' || normalized === 'NONE') {
            return null;
        }
        return normalized;
    }

    private validateOrderFilters(filters: OrdemServicoFilters) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        for (const field of [filters.cliente_id, filters.usuario_responsavel_id]) {
            if (field && !uuidRegex.test(field)) {
                throw new BadRequestException('ID invalido nos filtros da ordem');
            }
        }

        if (filters.search && String(filters.search).trim().length > 0 && String(filters.search).trim().length < 2) {
            throw new BadRequestException('Busca muito curta');
        }
    }

    private async loadUsersMap(userIds: Array<string | null | undefined>) {
        const uniqueIds = Array.from(new Set(userIds.filter((id): id is string => Boolean(id))));
        if (uniqueIds.length === 0) {
            return new Map<string, any>();
        }

        const users = await this.corePrisma.user.findMany({
            where: { id: { in: uniqueIds } },
            select: { id: true, name: true, email: true },
        });

        return new Map(users.map((user) => [user.id, user]));
    }

    private mapOrder(ordem: any, responsavel: any) {
        const itens = this.parseJson(ordem.itens, []);
        const equipamentoFotos = this.parseJson(ordem.equipamentoFotos, []);

        return {
            id: ordem.id,
            tenant_id: ordem.tenantId,
            numero: ordem.numero,
            cliente_id: ordem.clienteId,
            usuario_responsavel_id: ordem.usuarioResponsavelId,
            tipo_servico: ordem.tipoServico,
            descricao: ordem.descricao,
            laudo_tecnico: ordem.laudoTecnico,
            observacoes_internas: ordem.observacoesInternas,
            observacoes_cliente: ordem.observacoesCliente,
            valor_servico: Number(ordem.valorServico || 0),
            forma_pagamento: ordem.formaPagamento,
            status: ordem.status,
            prioridade: ordem.prioridade,
            data_abertura: ordem.dataAbertura instanceof Date ? ordem.dataAbertura.toISOString() : null,
            data_previsao: ordem.dataPrevisao instanceof Date ? ordem.dataPrevisao.toISOString() : null,
            data_conclusao: ordem.dataConclusao instanceof Date ? ordem.dataConclusao.toISOString() : null,
            origem_solicitacao: ordem.origemSolicitacao,
            orcamento_aprovado: ordem.orcamentoAprovado,
            motivo_cancelamento: ordem.motivoCancelamento,
            equipamento_tipo: ordem.equipamentoTipo,
            equipamento_marca: ordem.equipamentoMarca,
            equipamento_modelo: ordem.equipamentoModelo,
            equipamento_serie: ordem.equipamentoSerie,
            equipamento_acessorios: ordem.equipamentoAcessorios,
            equipamento_estado: ordem.equipamentoEstado,
            equipamento_fotos: Array.isArray(equipamentoFotos) ? equipamentoFotos : [],
            formatacao_so: ordem.formatacaoSo,
            formatacao_backup: ordem.formatacaoBackup,
            formatacao_backup_descricao: ordem.formatacaoBackupDescricao,
            formatacao_senha: ordem.formatacaoSenha,
            created_at: ordem.createdAt instanceof Date ? ordem.createdAt.toISOString() : null,
            updated_at: ordem.updatedAt instanceof Date ? ordem.updatedAt.toISOString() : null,
            itens: Array.isArray(itens) ? itens : [],
            garantia_dias: ordem.garantiaDias ?? 0,
            valor_conservacao: Number(ordem.valorConservacao || 0),
            dias_atraso: ordem.diasAtraso ?? 0,
            justificativa_conservacao: ordem.justificativaConservacao,
            data_limite_retirada: ordem.dataLimiteRetirada instanceof Date ? ordem.dataLimiteRetirada.toISOString() : null,
            data_retirada: ordem.dataRetirada instanceof Date ? ordem.dataRetirada.toISOString() : null,
            cliente: (ordem as any).cliente
                ? {
                    id: (ordem as any).cliente.id,
                    name: (ordem as any).cliente.name,
                    phone_primary: (ordem as any).cliente.phonePrimary,
                    email: (ordem as any).cliente.email,
                    is_active: (ordem as any).cliente.isActive,
                }
                : null,
            responsavel: responsavel
                ? {
                    id: responsavel.id,
                    name: responsavel.name,
                    email: responsavel.email,
                }
                : null,
        };
    }

async findAll(filters: OrdemServicoFilters) {
        this.validateOrderFilters(filters);

        const page = Math.max(1, Number(filters.page || 1));
        const limit = Math.min(100, Math.max(1, Number(filters.limit || 20)));
        const search = String(filters.search || '').trim();

        const result = await this.ordemRepository.findAllPaginated({
            search: search.length >= 2 ? search : undefined,
            status: filters.status?.length ? filters.status.map(Number) : undefined,
            clienteId: filters.cliente_id,
            usuarioResponsavelId: filters.usuario_responsavel_id,
            dataInicio: filters.data_inicio ? new Date(filters.data_inicio) : undefined,
            dataFim: filters.data_fim ? new Date(filters.data_fim) : undefined,
            origemSolicitacao: filters.origem_solicitacao,
            tipoServico: filters.tipo_servico,
            page,
            limit,
        });

        return {
            data: result.data.map((ordem) => this.mapOrder(ordem, null)),
            total: result.total,
            page,
            totalPages: Math.ceil(result.total / limit),
            limit,
        };
    }

    async create(createDto: CreateOrdemServicoDTO) {
        const actor = this.getActorOrThrow();
        const status = createDto.status ?? StatusOS.ORCAMENTO;

        const ordem = await this.ordemRepository.create({
            tenantId: actor.tenantId as string,
            clienteId: createDto.cliente_id,
            tipoServico: createDto.tipo_servico,
            prioridade: createDto.prioridade || 'MEDIA',
            descricao: createDto.descricao,
            origemSolicitacao: createDto.origem_solicitacao,
            valorServico: createDto.valor_servico ?? 0,
            dataPrevisao: this.parseDate(createDto.data_previsao),
            equipamentoTipo: createDto.equipamento_tipo || undefined,
            equipamentoMarca: createDto.equipamento_marca || undefined,
            equipamentoModelo: createDto.equipamento_modelo || undefined,
            equipamentoSerie: createDto.equipamento_serie || undefined,
            equipamentoAcessorios: createDto.equipamento_acessorios || undefined,
            equipamentoEstado: createDto.equipamento_estado || undefined,
            equipamentoFotos: this.stringifyJson(createDto.equipamento_fotos),
        });

        const mapped = this.mapOrder(ordem, {
            id: actor.id as string,
            name: actor.name || '',
            email: actor.email || '',
        });

        this.eventEmitter.emit('os.created', {
            tenantId: actor.tenantId,
            osId: ordem.id,
            data: mapped,
        });

        return mapped;
    }

    async update(id: string, updateDto: UpdateOrdemServicoDTO) {
        const actor = this.getActorOrThrow();
        const atual = await this.findOne(id);

        if (updateDto.status !== undefined && updateDto.status !== atual.status) {
            const transicaoValida = await this.validarTransicaoStatus(atual.status, updateDto.status);
            if (!transicaoValida) {
                throw new BadRequestException(`Transicao de status invalida: ${this.getStatusLabel(atual.status)} -> ${this.getStatusLabel(updateDto.status)}`);
            }

            if (updateDto.status === StatusOS.FINALIZADA) {
                const valorFinal = Number(updateDto.valor_servico ?? atual.valor_servico ?? 0);
                if (atual.status !== StatusOS.EM_EXECUCAO) {
                    throw new BadRequestException('So e possivel finalizar ordens em execucao');
                }
                if (valorFinal <= 0) {
                    throw new BadRequestException('Valor do servico deve estar definido para finalizar');
                }
            }
        }

        const data: any = {
            ...(updateDto.tipo_servico !== undefined ? { tipoServico: updateDto.tipo_servico } : {}),
            ...(updateDto.prioridade !== undefined ? { prioridade: updateDto.prioridade } : {}),
            ...(updateDto.descricao !== undefined ? { descricao: updateDto.descricao } : {}),
            ...(updateDto.observacoes_internas !== undefined ? { observacoesInternas: updateDto.observacoes_internas } : {}),
            ...(updateDto.observacoes_cliente !== undefined ? { observacoesCliente: updateDto.observacoes_cliente } : {}),
            ...(updateDto.valor_servico !== undefined ? { valorServico: updateDto.valor_servico } : {}),
            ...(updateDto.forma_pagamento !== undefined ? { formaPagamento: updateDto.forma_pagamento } : {}),
            ...(updateDto.data_previsao !== undefined ? { dataPrevisao: this.parseDate(updateDto.data_previsao) } : {}),
            ...(updateDto.usuario_responsavel_id !== undefined ? { usuarioResponsavelId: this.normalizeNullableResponsibleId(updateDto.usuario_responsavel_id) } : {}),
            ...(updateDto.equipamento_tipo !== undefined ? { equipamentoTipo: updateDto.equipamento_tipo } : {}),
            ...(updateDto.equipamento_marca !== undefined ? { equipamentoMarca: updateDto.equipamento_marca } : {}),
            ...(updateDto.equipamento_modelo !== undefined ? { equipamentoModelo: updateDto.equipamento_modelo } : {}),
            ...(updateDto.equipamento_serie !== undefined ? { equipamentoSerie: updateDto.equipamento_serie } : {}),
            ...(updateDto.equipamento_acessorios !== undefined ? { equipamentoAcessorios: updateDto.equipamento_acessorios } : {}),
            ...(updateDto.equipamento_estado !== undefined ? { equipamentoEstado: updateDto.equipamento_estado } : {}),
            ...(updateDto.formatacao_so !== undefined ? { formatacaoSo: updateDto.formatacao_so } : {}),
            ...(updateDto.formatacao_backup !== undefined ? { formatacaoBackup: updateDto.formatacao_backup } : {}),
            ...(updateDto.formatacao_backup_descricao !== undefined ? { formatacaoBackupDescricao: updateDto.formatacao_backup_descricao } : {}),
            ...(updateDto.formatacao_senha !== undefined ? { formatacaoSenha: updateDto.formatacao_senha } : {}),
            ...(updateDto.equipamento_fotos !== undefined ? { equipamentoFotos: this.stringifyJson(updateDto.equipamento_fotos) } : {}),
            ...(updateDto.itens !== undefined ? { itens: this.stringifyJson(updateDto.itens) } : {}),
            ...(updateDto.laudo_tecnico !== undefined ? { laudoTecnico: updateDto.laudo_tecnico } : {}),
            ...(updateDto.garantia_dias !== undefined ? { garantiaDias: updateDto.garantia_dias } : {}),
            ...(updateDto.origem_solicitacao !== undefined ? { origemSolicitacao: updateDto.origem_solicitacao } : {}),
            ...(updateDto.status !== undefined ? { status: updateDto.status } : {}),
            ...(updateDto.motivo_cancelamento !== undefined ? { motivoCancelamento: updateDto.motivo_cancelamento } : {}),
            ...(updateDto.status === StatusOS.FINALIZADA && updateDto.status !== atual.status ? { dataConclusao: new Date() } : {}),
            updatedAt: new Date(),
        };

        await this.ordemRepository.update(id, {
            tipoServico: updateDto.tipo_servico,
            descricao: updateDto.descricao,
            observacoesInternas: updateDto.observacoes_internas,
            observacoesCliente: updateDto.observacoes_cliente,
            valorServico: updateDto.valor_servico,
            formaPagamento: updateDto.forma_pagamento,
            prioridade: updateDto.prioridade,
            dataPrevisao: this.parseDate(updateDto.data_previsao),
            status: updateDto.status,
            motivoCancelamento: updateDto.motivo_cancelamento,
        });

        const atualizada = await this.findOne(id);
        await this.registrarAlteracoesHistorico(id, atual, updateDto);

        if (updateDto.status !== undefined && updateDto.status !== atual.status) {
            await this.registrarStatusHistorico(id, atual.status, updateDto.status, 'Alteracao via edicao da ordem');
            this.eventEmitter.emit('os.status_changed', {
                tenantId: actor.tenantId,
                osId: id,
                oldStatus: atual.status,
                newStatus: updateDto.status,
                data: atualizada,
            });
        }

        return atualizada;
    }

    async updateStatus(id: string, novoStatus: number, motivoCancelamento?: string, observacoes?: string) {
        const actor = this.getActorOrThrow();
        const ordemAtual = await this.findOne(id);
        const statusAnterior = ordemAtual.status;

        const transicaoValida = await this.validarTransicaoStatus(statusAnterior, novoStatus);
        if (!transicaoValida) {
            throw new BadRequestException(`Transicao de status invalida: ${this.getStatusLabel(statusAnterior)} -> ${this.getStatusLabel(novoStatus)}`);
        }

        const data: any = {
            status: novoStatus,
            updatedAt: new Date(),
            ...(novoStatus === StatusOS.CANCELADA ? { motivoCancelamento: motivoCancelamento || null } : {}),
            ...(novoStatus === StatusOS.FINALIZADA ? { dataConclusao: new Date() } : {}),
        };

        await this.ordemRepository.updateStatus(id, novoStatus, novoStatus === StatusOS.FINALIZADA ? new Date() : undefined, motivoCancelamento);

        const ordemAtualizada = await this.findOne(id);
        await this.registrarStatusHistorico(id, statusAnterior, novoStatus, observacoes || null);
        await this.registrarHistorico(
            id,
            'ALTERACAO_STATUS',
            String(statusAnterior),
            String(novoStatus),
            observacoes || `Status alterado para ${this.getStatusLabel(novoStatus)}`,
        );

        this.eventEmitter.emit('os.status_changed', {
            tenantId: actor.tenantId,
            osId: id,
            oldStatus: statusAnterior,
            newStatus: novoStatus,
            data: ordemAtualizada,
        });

        return ordemAtualizada;
    }

    async remove(id: string) {
        await this.ordemRepository.deleteCascade(id);
        return { success: true };
    }

    async aprovarOrcamento(id: string) {
        const ordem = await this.findOne(id);
        if (ordem.status !== StatusOS.ORCAMENTO) {
            throw new BadRequestException('Orcamento nao encontrado ou ja aprovado');
        }

        await this.ordemRepository.updateStatus(id, StatusOS.ABERTA, undefined, undefined);

        await this.ordemRepository.registrarStatusHistorico({
            tenantId: ordem.tenant_id,
            ordemServicoId: id,
            usuarioId: this.getActorOrThrow().id as string,
            statusAnterior: StatusOS.ORCAMENTO,
            statusNovo: StatusOS.ABERTA,
            observacoes: 'Orcamento aprovado pelo cliente',
        });

        return this.findOne(id);
    }

    async getHistorico(ordemId: string) {
        const historico = await this.ordemRepository.getHistorico(ordemId);

        const userIds = historico.map((item) => item.usuarioId).filter(Boolean);
        const usersById = await this.loadUsersMap(userIds);

        return historico.map((item) => {
            const user = usersById.get(item.usuarioId);
            return {
                id: item.id,
                ordem_servico_id: item.ordemServicoId,
                usuario_id: item.usuarioId,
                acao: item.acao,
                valor_anterior: item.valorAnterior,
                valor_novo: item.valorNovo,
                observacoes: item.observacoes,
                created_at: item.createdAt instanceof Date ? item.createdAt.toISOString() : null,
                usuario_nome: user?.name || '',
                usuario_email: user?.email || '',
            };
        });
    }

    async getDashboardData() {
        return this.ordemRepository.getDashboardData();
    }

    async getTiposServico() {
        return this.ordemRepository.getTiposServico();
    }

    async getTiposEquipamento() {
        return this.ordemRepository.getTiposEquipamento();
    }

    async getTechnicians() {
        const tenantId = this.getTenantIdOrThrow();
        return this.ordemRepository.getTechnicians(tenantId);
    }
    }

    async getStatusHistorico(ordemId: string) {
        const historico = await this.ordemRepository.getStatusHistorico(ordemId);

        const userIds = historico.map((item) => item.usuario_id).filter(Boolean);
        const usersById = await this.loadUsersMap(userIds);

        return historico.map((item) => {
            const user = usersById.get(item.usuario_id);
            return {
                id: item.id,
                ordem_servico_id: item.ordem_servico_id,
                status_anterior: item.status_anterior,
                status_novo: item.status_novo,
                usuario_id: item.usuario_id,
                usuario_nome: user?.name || '',
                usuario_email: user?.email || '',
                data_alteracao: item.data_alteracao,
                observacoes: item.observacoes,
                created_at: item.created_at,
            };
        });
    }

    async calcularConservacao(ordemId: string) {
        const ordem = await this.findOne(ordemId);
        const prazoRetiradaDias = Number(await this.getConfig('prazo_retirada_dias') || 30);
        const valorConservacaoConfig =
            (await this.getConfig('valor_conservacao_diario')) ??
            (await this.getConfig('valor_conservacao_diaria')) ??
            0;
        const valorDiario = Number(valorConservacaoConfig || 0);
        const conservacaoHabilitada = (await this.getConfig('conservacao_habilitada')) === 'true';

        if (!ordem.data_conclusao) {
            return {
                diasAtraso: 0,
                valorConservacao: 0,
                emAtraso: false,
                dataLimite: null,
                prazoRetiradaDias,
                valorDiario,
                conservacaoHabilitada,
            };
        }

        const dataFinalizacao = new Date(ordem.data_conclusao);
        const dataLimite = new Date(dataFinalizacao);
        dataLimite.setDate(dataLimite.getDate() + prazoRetiradaDias);
        const hoje = new Date();

        if (hoje <= dataLimite || !conservacaoHabilitada) {
            return {
                diasAtraso: 0,
                valorConservacao: 0,
                emAtraso: false,
                dataLimite: dataLimite.toISOString(),
                prazoRetiradaDias,
                valorDiario,
                conservacaoHabilitada,
            };
        }

        const diffTime = Math.abs(hoje.getTime() - dataLimite.getTime());
        const diasAtraso = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const valorConservacao = diasAtraso * valorDiario;

        return {
            diasAtraso,
            valorConservacao,
            emAtraso: true,
            dataLimite: dataLimite.toISOString(),
            prazoRetiradaDias,
            valorDiario,
            conservacaoHabilitada,
        };
    }

    async atualizarConservacao(ordemId: string, valorConservacao: number, justificativa?: string) {
        return this.ordemRepository.updateConservacao(ordemId, valorConservacao, justificativa);
    }

    async validarRetirada(ordemId: string, pagamentos: PagamentoDTO[]) {
        const ordem = await this.findOne(ordemId);
        if (ordem.status !== StatusOS.FINALIZADA) {
            throw new BadRequestException('So e possivel registrar retirada de ordens finalizadas');
        }
        if (pagamentos.length === 0) {
            throw new BadRequestException('Informe ao menos uma forma de pagamento');
        }
        if (pagamentos.length > 5) {
            throw new BadRequestException('Maximo de 5 formas de pagamento permitidas');
        }

        const conservacao = await this.calcularConservacao(ordemId);
        const totalPagamentos = pagamentos.reduce((sum, item) => sum + Number(item.valor), 0);
        const valorServico = Number(ordem.valor_servico || 0);
        const valorConservacao = conservacao.emAtraso ? conservacao.valorConservacao : Number(ordem.valor_conservacao || 0);
        const totalOS = valorServico + valorConservacao;

        if (Math.abs(totalPagamentos - totalOS) > 0.01) {
            throw new BadRequestException(
                `Soma dos pagamentos (R$ ${totalPagamentos.toFixed(2)}) deve ser igual ao total da OS (R$ ${totalOS.toFixed(2)})`
            );
        }

        return { ordem, conservacao, totalOS };
    }

    async getPagamentos(ordemId: string) {
        const pagamentos = await this.ordemRepository.getPagamentos(ordemId);

        const userIds = pagamentos.map((item) => item.createdBy).filter(Boolean);
        const usersById = await this.loadUsersMap(userIds);

        return pagamentos.map((item) => ({
            id: item.id,
            ordem_servico_id: item.ordemServicoId,
            forma_pagamento: item.formaPagamento,
            valor: item.valor,
            parcelas: item.parcelas || 1,
            observacoes: item.observacoes,
            created_at: item.createdAt instanceof Date ? item.createdAt.toISOString() : null,
            created_by: item.createdBy,
            created_by_nome: usersById.get(item.createdBy)?.name || '',
        }));
    }

    async registrarRetirada(ordemId: string, retiradaDTO: RetiradaDTO) {
        const actor = this.getActorOrThrow();
        const { ordem, conservacao, totalOS } = await this.validarRetirada(ordemId, retiradaDTO.pagamentos);
        const valorConservacaoFinal = retiradaDTO.valor_conservacao !== undefined
            ? retiradaDTO.valor_conservacao
            : conservacao.emAtraso ? conservacao.valorConservacao : 0;

        await this.ordemRepository.createManyPagamentos(
            retiradaDTO.pagamentos.map((pagamento) => ({
                tenantId: actor.tenantId as string,
                ordemServicoId: ordemId,
                formaPagamento: pagamento.forma_pagamento,
                valor: Number(pagamento.valor),
                parcelas: pagamento.parcelas || 1,
                observacoes: pagamento.observacoes,
                createdBy: actor.id as string,
            }))
        );

        await this.ordemRepository.updateStatus(ordemId, StatusOS.RETIRADA, new Date(), undefined);
        await this.ordemRepository.registrarStatusHistorico({
            tenantId: actor.tenantId as string,
            ordemServicoId: ordemId,
            usuarioId: actor.id as string,
            statusAnterior: ordem.status,
            statusNovo: StatusOS.RETIRADA,
            observacoes: retiradaDTO.observacoes || 'Equipamento retirado pelo cliente',
        });

return this.findOne(ordemId);
    }

async getAlertasAbandono(ordemId: string) {
        const alertas = await this.ordemRepository.getAlertasAbandono(ordemId);

        const userIds = alertas.map((item) => item.enviadoPor).filter(Boolean);
        const usersById = await this.loadUsersMap(userIds);

        return alertas.map((item) => ({
            id: item.id,
            ordem_servico_id: item.ordemServicoId,
            numero_alerta: item.numeroAlerta,
            data_envio: item.dataEnvio instanceof Date ? item.dataEnvio.toISOString() : null,
            meio_comunicacao: item.meioComunicacao,
            enviado_por: item.enviadoPor,
            enviado_por_nome: usersById.get(item.enviadoPor)?.name || '',
            mensagem: item.mensagem,
            observacoes: item.observacoes,
            created_at: item.createdAt instanceof Date ? item.createdAt.toISOString() : null,
            anexos: (item as any).anexos?.map((anexo: any) => ({
                id: anexo.id,
                alerta_id: anexo.alertaId,
                nome_arquivo: anexo.nomeArquivo,
                tipo_arquivo: anexo.tipoArquivo,
                tamanho_bytes: anexo.tamanhoBytes,
                url_arquivo: anexo.urlArquivo,
                descricao: anexo.descricao,
                created_at: anexo.createdAt instanceof Date ? anexo.createdAt.toISOString() : null,
                uploaded_by: anexo.uploadedBy,
            })) || [],
        }));
    }

    async registrarAlertaAbandono(ordemId: string, alertaDTO: AlertaAbandonoDTO) {
        const ordem = await this.findOne(ordemId);
        const actor = this.getActorOrThrow();

        if (ordem.status !== StatusOS.FINALIZADA) {
            throw new BadRequestException('So e possivel registrar alertas para ordens finalizadas');
        }

        const alertasExistentes = await this.getAlertasAbandono(ordemId);
        const numeroEsperado = alertasExistentes.length + 1;
        if (alertaDTO.numero_alerta !== numeroEsperado) {
            throw new BadRequestException(`Alerta ${alertaDTO.numero_alerta} nao pode ser registrado. O proximo alerta esperado e o ${numeroEsperado}`);
        }

        const alerta = await this.ordemRepository.createAlertaAbandono({
            tenantId: actor.tenantId as string,
            ordemServicoId: ordemId,
            numeroAlerta: alertaDTO.numero_alerta,
            dataEnvio: new Date(alertaDTO.data_envio),
            meioComunicacao: alertaDTO.meio_comunicacao,
            enviadoPor: actor.id as string,
            mensagem: alertaDTO.mensagem || undefined,
            observacoes: alertaDTO.observacoes || undefined,
        });

        await this.ordemRepository.registrarHistorico({
            tenantId: actor.tenantId as string,
            ordemServicoId: ordemId,
            usuarioId: actor.id as string,
            acao: 'ALERTA_ABANDONO',
            valorNovo: `Alerta ${alertaDTO.numero_alerta}/3 enviado via ${alertaDTO.meio_comunicacao}`,
            observacoes: alertaDTO.observacoes,
        });

        return {
            id: alerta.id,
            ordem_servico_id: alerta.ordemServicoId,
            numero_alerta: alerta.numeroAlerta,
            data_envio: alerta.dataEnvio instanceof Date ? alerta.dataEnvio.toISOString() : null,
            meio_comunicacao: alerta.meioComunicacao,
            enviado_por: alerta.enviadoPor,
            mensagem: alerta.mensagem,
            observacoes: alerta.observacoes,
            created_at: alerta.createdAt?.toISOString() || null,
            anexos: [],
        };
    }

    async registrarAnexoAlerta(alertaId: string, anexoDTO: any) {
        const actor = this.getActorOrThrow();

        return this.ordemRepository.createAnexoAlerta({
            tenantId: actor.tenantId as string,
            alertaId,
            nomeArquivo: anexoDTO.nome_arquivo,
            tipoArquivo: anexoDTO.tipo_arquivo,
            tamanhoBytes: anexoDTO.tamanho_bytes,
            urlArquivo: anexoDTO.url_arquivo,
            descricao: anexoDTO.descricao,
            uploadedBy: actor.id as string,
        });
    }

    async validarAbandono(ordemId: string) {
        const ordem = await this.findOne(ordemId);
        if (ordem.status !== StatusOS.FINALIZADA) {
            throw new BadRequestException('So e possivel marcar como abandonado ordens finalizadas');
        }

        const alertas = await this.getAlertasAbandono(ordemId);
        if (alertas.length < 3) {
            throw new BadRequestException(`Sao necessarios 3 alertas registrados para marcar como abandonado. Alertas registrados: ${alertas.length}/3`);
        }

        if (alertas.some((item) => !item.data_envio)) {
            throw new BadRequestException('Todos os alertas devem ter data de envio registrada');
        }

        return { ordem, alertas };
    }

    async marcarComoAbandonado(ordemId: string, observacoes?: string) {
        const { ordem } = await this.validarAbandono(ordemId);
        const actor = this.getActorOrThrow();

        await this.ordemRepository.updateStatus(ordemId, StatusOS.ABANDONADO, undefined, undefined);

        await this.ordemRepository.registrarStatusHistorico({
            tenantId: actor.tenantId as string,
            ordemServicoId: ordemId,
            usuarioId: actor.id as string,
            statusAnterior: ordem.status,
            statusNovo: StatusOS.ABANDONADO,
            observacoes: observacoes || 'Equipamento marcado como abandonado apos 3 tentativas de contato',
        });
            observacoes || 'Equipamento marcado como abandonado apos 3 tentativas de contato',
        );
        await this.registrarHistorico(
            ordemId,
            'ABANDONO',
            null,
            'Equipamento marcado como abandonado apos 3 tentativas de contato sem sucesso',
            observacoes,
        );

        return this.findOne(ordemId);
    }

    async getAlertasRetirada() {
        return this.ordemRepository.getAlertasRetirada();
    }

    async generatePdf(id: string): Promise<Buffer> {
        const tenantId = this.getTenantIdOrThrow();
        const ordem = await this.findOne(id);
        const tenant = await this.corePrisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
                nomeFantasia: true,
                cnpjCpf: true,
                telefone: true,
                email: true,
                logoUrl: true,
            },
        });

        const condicoesExecucao = await this.getConfig('condicoes_execucao');
        const ordemPdf = {
            ...ordem,
            condicoesExecucao,
            usuario_responsavel: ordem.responsavel,
        };

        let logoBase64: string | undefined;
        if (tenant?.logoUrl) {
            try {
                const logoPath = path.resolve(process.cwd(), 'uploads', 'logos', tenant.logoUrl);
                if (fs.existsSync(logoPath)) {
                    const logoBuffer = fs.readFileSync(logoPath);
                    logoBase64 = `data:image/jpeg;base64,${logoBuffer.toString('base64')}`;
                }
            } catch (error: any) {
                this.logger.warn(`Erro ao ler logo para PDF: ${error.message}`);
            }
        }

        const html = generatePdfHtml(ordemPdf, {
            name: tenant?.nomeFantasia || 'Empresa',
            document: tenant?.cnpjCpf || '',
            address: '',
            phone: tenant?.telefone || '',
            email: tenant?.email || '',
            logo_url: logoBase64,
        });

        const browser = await puppeteer.launch({
            headless: true,
            timeout: 60000,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-extensions',
                '--no-first-run',
                '--no-zygote',
            ],
        });

        try {
            const page = await browser.newPage();
            await page.setContent(html, {
                waitUntil: ['load', 'networkidle0'],
                timeout: 60000,
            });

            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '0mm',
                    bottom: '0mm',
                    left: '0mm',
                    right: '0mm',
                },
            });

            return Buffer.from(pdfBuffer);
        } finally {
            await browser.close();
        }
    }

    private async registrarHistorico(
        ordemId: string,
        acao: string,
        valorAnterior?: string | null,
        valorNovo?: string | null,
        observacoes?: string | null,
    ) {
        const actor = this.getActorOrThrow();
        await this.ordemRepository.registrarHistorico({
            tenantId: actor.tenantId as string,
            ordemServicoId: ordemId,
            usuarioId: actor.id as string,
            acao,
            valorAnterior: valorAnterior || undefined,
            valorNovo: valorNovo || undefined,
            observacoes: observacoes || undefined,
        });
    }

    private async registrarAlteracoesHistorico(id: string, ordemAtual: any, updateDto: UpdateOrdemServicoDTO) {
        const entries = Object.entries(updateDto).filter(([, value]) => value !== undefined);
        for (const [field, value] of entries) {
            const previous = (ordemAtual as any)[field];
            const nextValue = Array.isArray(value) || typeof value === 'object'
                ? JSON.stringify(value)
                : value == null ? null : String(value);
            const prevValue = Array.isArray(previous) || typeof previous === 'object'
                ? JSON.stringify(previous)
                : previous == null ? null : String(previous);

            if (prevValue === nextValue) {
                continue;
            }

            await this.registrarHistorico(
                id,
                `ALTERACAO_${field.toUpperCase()}`,
                prevValue,
                nextValue,
                `Campo ${field} alterado`,
            );
        }
    }

    private async registrarStatusHistorico(
        ordemId: string,
        statusAnterior: number,
        statusNovo: number,
        observacoes?: string | null,
    ) {
        const actor = this.getActorOrThrow();
        await this.ordemRepository.registrarStatusHistorico({
            tenantId: actor.tenantId as string,
            ordemServicoId: ordemId,
            usuarioId: actor.id as string,
            statusAnterior,
            statusNovo,
            observacoes: observacoes || undefined,
        });
    }

    private getStatusLabel(status: number) {
        const labels: Record<number, string> = {
            0: 'Orcamento',
            1: 'Aberta',
            2: 'Em Analise',
            3: 'Aguardando Cliente',
            4: 'Aguardando Pecas',
            5: 'Em Execucao',
            6: 'Finalizada',
            7: 'Cancelada',
            8: 'Retirado',
            9: 'Abandonado',
        };
        return labels[status] || 'Desconhecido';
    }

    private getActorOrThrow() {
        const actor = this.requestSecurityContext.getActor();
        if (!actor?.id || !actor.tenantId) {
            throw new BadRequestException('Contexto de seguranca ausente para ordem de servico');
        }
        return actor;
    }

    private getTenantIdOrThrow() {
        return this.getActorOrThrow().tenantId as string;
    }
}
