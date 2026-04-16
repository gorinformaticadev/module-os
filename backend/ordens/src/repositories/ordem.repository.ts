import { Injectable, Logger } from '@nestjs/common';
import { ModuleOsPrismaService } from '../../../prisma/module-os-prisma.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { OrdemServico } from '../contracts/ordem.api';

interface Historico {
  id: string;
  tenantId: string;
  ordemServicoId: string;
  usuarioId: string;
  acao: string;
  valorAnterior?: string;
  valorNovo?: string;
  observacoes?: string;
  createdAt: Date;
}

interface Pagamento {
  id: string;
  tenantId: string;
  ordemServicoId: string;
  formaPagamento: string;
  valor: number;
  parcelas?: number;
  observacoes?: string;
  createdAt: Date;
  createdBy: string;
}

interface CreateOrdemServicoDTO {
  tenantId: string;
  clienteId: string;
  tipoServico: string;
  descricao: string;
  prioridade?: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  dataPrevisao?: Date;
  origemSolicitacao: string;
  valorServico?: number;
  formaPagamento?: string;
  equipamentoTipo?: string;
  equipamentoMarca?: string;
  equipamentoModelo?: string;
  equipamentoSerie?: string;
  equipamentoAcessorios?: string;
  equipamentoEstado?: string;
  equipamentoFotos?: string;
}

interface UpdateOrdemServicoDTO {
  tipoServico?: string;
  descricao?: string;
  observacoesInternas?: string;
  observacoesCliente?: string;
  valorServico?: number;
  formaPagamento?: string;
  prioridade?: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  dataPrevisao?: Date;
  status?: number;
  orcamentoAprovado?: boolean;
  motivoCancelamento?: string;
}

interface OrdemFilters {
  search?: string;
  status?: number | number[];
  clienteId?: string;
}

@Injectable()
export class OrdemRepository {
  private readonly logger = new Logger(OrdemRepository.name);

  constructor(
    private readonly prisma: ModuleOsPrismaService,
    private readonly corePrisma: PrismaService,
  ) {}

  async findById(id: string): Promise<OrdemServico | null> {
    const data = await this.prisma.mod_ordem_servico_ordens.findUnique({
      where: { id },
      include: { cliente: true },
    });

    if (!data) return null;

    return this.mapToDomain(data);
  }

  async findAll(filters: OrdemFilters = {}): Promise<OrdemServico[]> {
    const { search, status, clienteId } = filters;

    const where: any = {};

    if (clienteId) {
      where.clienteId = clienteId;
    }

    if (status) {
      where.status = Array.isArray(status) ? { in: status } : status;
    }

    if (search) {
      where.OR = [
        { numero: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } },
      ];
    }

    const results = await this.prisma.mod_ordem_servico_ordens.findMany({
      where,
      include: { cliente: true },
      orderBy: { createdAt: 'desc' },
    });

    return results.map(this.mapToDomain);
  }

  async create(data: CreateOrdemServicoDTO): Promise<OrdemServico> {
    const created = await this.prisma.mod_ordem_servico_ordens.create({
      data: {
        tenant_id: data.tenantId,
        numero: await this.gerarNumeroOS(data.tenantId),
        cliente_id: data.clienteId,
        tipo_servico: data.tipoServico,
        descricao: data.descricao,
        prioridade: data.prioridade || 'MEDIA',
        data_previsao: data.dataPrevisao,
        origem_solicitacao: data.origemSolicitacao,
        valor_servico: data.valorServico,
        forma_pagamento: data.formaPagamento,
        equipamento_tipo: data.equipamentoTipo,
        equipamento_marca: data.equipamentoMarca,
        equipamento_modelo: data.equipamentoModelo,
        equipamento_serie: data.equipamentoSerie,
        equipamento_acessorios: data.equipamentoAcessorios,
        equipamento_estado: data.equipamentoEstado,
        equipamento_fotos: data.equipamentoFotos,
      },
      include: { cliente: true },
    });

    return this.mapToDomain(created);
  }

  async update(id: string, data: UpdateOrdemServicoDTO): Promise<OrdemServico> {
    const updateData: any = {};

    if (data.tipoServico !== undefined) updateData.tipo_servico = data.tipoServico;
    if (data.descricao !== undefined) updateData.descricao = data.descricao;
    if (data.observacoesInternas !== undefined) updateData.observacoes_internas = data.observacoesInternas;
    if (data.observacoesCliente !== undefined) updateData.observacoes_cliente = data.observacoesCliente;
    if (data.valorServico !== undefined) updateData.valor_servico = data.valorServico;
    if (data.formaPagamento !== undefined) updateData.forma_pagamento = data.formaPagamento;
    if (data.prioridade !== undefined) updateData.prioridade = data.prioridade;
    if (data.dataPrevisao !== undefined) updateData.data_previsao = data.dataPrevisao;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.orcamentoAprovado !== undefined) updateData.orcamento_aprovado = data.orcamentoAprovado;
    if (data.motivoCancelamento !== undefined) updateData.motivo_cancelamento = data.motivoCancelamento;

    const updated = await this.prisma.mod_ordem_servico_ordens.update({
      where: { id },
      data: updateData,
      include: { cliente: true },
    });

    return this.mapToDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.mod_ordem_servico_ordens.delete({
      where: { id },
    });
  }

  async getHistorico(ordemId: string): Promise<Historico[]> {
    const results = await this.prisma.mod_ordem_servico_historico.findMany({
      where: { ordemServicoId: ordemId },
      orderBy: { createdAt: 'asc' },
    });

    return results.map(this.mapHistoricoToDomain);
  }

  async getPagamentos(ordemId: string): Promise<Pagamento[]> {
    const results = await this.prisma.mod_ordem_servico_pagamentos.findMany({
      where: { ordemServicoId: ordemId },
      orderBy: { createdAt: 'asc' },
    });

    return results.map(this.mapPagamentoToDomain);
  }

  async findByCliente(clienteId: string): Promise<OrdemServico[]> {
    const results = await this.prisma.mod_ordem_servico_ordens.findMany({
      where: { clienteId },
      include: { cliente: true },
      orderBy: { createdAt: 'desc' },
    });

    return results.map(this.mapToDomain);
  }

  private async gerarNumeroOS(tenantId: string): Promise<string> {
    const ultima = await this.prisma.mod_ordem_servico_ordens.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: { numero: true },
    });

    const ultimoNumero = Number(String(ultima?.numero || '').replace(/\D/g, '')) || 0;
    return String(ultimoNumero + 1).padStart(6, '0');
  }

  private mapToDomain(data: any): OrdemServico {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      numero: data.numero,
      clienteId: data.cliente_id,
      usuarioResponsavelId: data.usuarioResponsavelId ?? undefined,
      tipoServico: data.tipo_servico,
      descricao: data.descricao,
      observacoesInternas: data.observacoes_internas ?? undefined,
      observacoesCliente: data.observacoes_cliente ?? undefined,
      valorServico: Number(data.valor_servico || 0),
      formaPagamento: data.forma_pagamento ?? undefined,
      status: data.status,
      prioridade: data.prioridade as any || 'MEDIA',
      dataAbertura: data.data_abertura ?? new Date(),
      dataPrevisao: data.data_previsao ?? undefined,
      dataConclusao: data.data_conclusao ?? undefined,
      origemSolicitacao: data.origem_solicitacao,
      orcamentoAprovado: data.orcamento_aprovado ?? false,
      motivoCancelamento: data.motivo_cancelamento ?? undefined,
      equipamentoTipo: data.equipamento_tipo ?? undefined,
      equipamentoMarca: data.equipamento_marca ?? undefined,
      equipamentoModelo: data.equipamento_modelo ?? undefined,
      equipamentoSerie: data.equipamento_serie ?? undefined,
      equipamentoAcessorios: data.equipamento_acessorios ?? undefined,
      equipamentoEstado: data.equipamento_estado ?? undefined,
      equipamentoFotos: data.equipamento_fotos ?? undefined,
      laudoTecnico: data.laudo_tecnico ?? undefined,
      createdAt: data.created_at ?? new Date(),
      updatedAt: data.updated_at ?? new Date(),
    };
  }

  private mapHistoricoToDomain(data: any): Historico {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      ordemServicoId: data.ordemServicoId,
      usuarioId: data.usuarioId,
      acao: data.acao,
      valorAnterior: data.valor_anterior ?? undefined,
      valorNovo: data.valor_novo ?? undefined,
      observacoes: data.observacoes ?? undefined,
      createdAt: data.created_at ?? new Date(),
    };
  }

  private mapPagamentoToDomain(data: any): Pagamento {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      ordemServicoId: data.ordemServicoId,
      formaPagamento: data.forma_pagamento,
      valor: Number(data.valor),
      parcelas: data.parcelas ?? undefined,
      observacoes: data.observacoes ?? undefined,
      createdAt: data.created_at ?? new Date(),
      createdBy: data.created_by,
    };
  }
}
