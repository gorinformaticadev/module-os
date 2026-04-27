import { Injectable, Logger } from "@nestjs/common";
import { ModuleOsPrismaService } from "../../../prisma/module-os-prisma.service";
import { PrismaService } from "@core/prisma/prisma.service";
import {
  mod_ordem_servico_alertas_abandono,
  mod_ordem_servico_anexos_abandono,
  mod_ordem_servico_historico,
  mod_ordem_servico_ordens,
  mod_ordem_servico_pagamentos,
  Prisma,
} from "../../../generated/prisma-client";
import { StatusOS } from "../../../shared/dto/ordem-servico.dto";

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

interface TipoServico {
  id: string;
  nome: string;
  isDefault: boolean;
}

interface TipoEquipamento {
  id: string;
  nome: string;
}

interface UserRole {
  userId: string;
  isTechnician: boolean;
}

interface Config {
  key: string;
  value: string;
}

interface CreateOrdemServicoDTO {
  tenantId: string;
  clienteId: string;
  usuarioResponsavelId: string;
  tipoServico: string;
  descricao: string;
  prioridade?: "BAIXA" | "MEDIA" | "ALTA" | "URGENTE";
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
  prioridade?: "BAIXA" | "MEDIA" | "ALTA" | "URGENTE";
  dataPrevisao?: Date;
  status?: number;
  orcamentoAprovado?: boolean;
  motivoCancelamento?: string;
}

interface OrdemFilters {
  search?: string;
  status?: number | number[];
  clienteId?: string;
  usuarioResponsavelId?: string;
  dataInicio?: Date;
  dataFim?: Date;
  origemSolicitacao?: string;
  tipoServico?: string;
  page?: number;
  limit?: number;
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

    return this.mapToDomain(data as OrdemServicoIncludePayload);
  }

  async findAll(filters: OrdemFilters = {}): Promise<OrdemServico[]> {
    const { search, status, clienteId } = filters;

    const where: Prisma.mod_ordem_servico_ordensWhereInput = {};

    if (clienteId) {
      where.clienteId = clienteId;
    }

    if (status) {
      where.status = Array.isArray(status) ? { in: status } : status;
    }

    if (search) {
      where.OR = [
        { numero: { contains: search, mode: "insensitive" } },
        { descricao: { contains: search, mode: "insensitive" } },
      ];
    }

    const results = await this.prisma.mod_ordem_servico_ordens.findMany({
      where,
      include: { cliente: true },
      orderBy: { createdAt: "desc" },
    });

    return results.map((item) =>
      this.mapToDomain(item as OrdemServicoIncludePayload),
    );
  }

  async create(data: CreateOrdemServicoDTO): Promise<OrdemServico> {
    const created = await this.prisma.mod_ordem_servico_ordens.create({
      data: {
        tenantId: data.tenantId,
        numero: await this.gerarNumeroOS(data.tenantId),
        clienteId: data.clienteId,
        usuarioResponsavelId: data.usuarioResponsavelId,
        tipoServico: data.tipoServico,
        descricao: data.descricao,
        prioridade: data.prioridade || "MEDIA",
        dataPrevisao: data.dataPrevisao,
        origemSolicitacao: data.origemSolicitacao,
        valorServico: data.valorServico,
        formaPagamento: data.formaPagamento,
        equipamentoTipo: data.equipamentoTipo,
        equipamentoMarca: data.equipamentoMarca,
        equipamentoModelo: data.equipamentoModelo,
        equipamentoSerie: data.equipamentoSerie,
        equipamentoAcessorios: data.equipamentoAcessorios,
        equipamentoEstado: data.equipamentoEstado,
        equipamentoFotos: data.equipamentoFotos,
      },
      include: { cliente: true },
    });

    return this.mapToDomain(created as OrdemServicoIncludePayload);
  }

  async update(id: string, data: UpdateOrdemServicoDTO): Promise<OrdemServico> {
    const updateData: Prisma.mod_ordem_servico_ordensUpdateInput = {};

    if (data.tipoServico !== undefined)
      updateData.tipoServico = data.tipoServico;
    if (data.descricao !== undefined) updateData.descricao = data.descricao;
    if (data.observacoesInternas !== undefined)
      updateData.observacoesInternas = data.observacoesInternas;
    if (data.observacoesCliente !== undefined)
      updateData.observacoesCliente = data.observacoesCliente;
    if (data.valorServico !== undefined)
      updateData.valorServico = data.valorServico;
    if (data.formaPagamento !== undefined)
      updateData.formaPagamento = data.formaPagamento;
    if (data.prioridade !== undefined) updateData.prioridade = data.prioridade;
    if (data.dataPrevisao !== undefined)
      updateData.dataPrevisao = data.dataPrevisao;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.orcamentoAprovado !== undefined)
      updateData.orcamentoAprovado = data.orcamentoAprovado;
    if (data.motivoCancelamento !== undefined)
      updateData.motivoCancelamento = data.motivoCancelamento;

    const updated = await this.prisma.mod_ordem_servico_ordens.update({
      where: { id },
      data: updateData,
      include: { cliente: true },
    });

    return this.mapToDomain(updated as OrdemServicoIncludePayload);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.mod_ordem_servico_ordens.delete({
      where: { id },
    });
  }

  async getHistorico(ordemId: string): Promise<Historico[]> {
    const results = await this.prisma.mod_ordem_servico_historico.findMany({
      where: { ordemServicoId: ordemId },
      orderBy: { createdAt: "asc" },
    });

    return results.map(this.mapHistoricoToDomain);
  }

  async getHistoricoByAcao(
    ordemId: string,
    acao: string,
  ): Promise<Historico[]> {
    const results = await this.prisma.mod_ordem_servico_historico.findMany({
      where: { ordemServicoId: ordemId, acao },
      orderBy: { createdAt: "desc" },
    });

    return results.map(this.mapHistoricoToDomain);
  }

  async getPagamentos(ordemId: string): Promise<Pagamento[]> {
    const results = await this.prisma.mod_ordem_servico_pagamentos.findMany({
      where: { ordemServicoId: ordemId },
      orderBy: { createdAt: "asc" },
    });

    return results.map(this.mapPagamentoToDomain);
  }

  async findByCliente(clienteId: string): Promise<OrdemServico[]> {
    const results = await this.prisma.mod_ordem_servico_ordens.findMany({
      where: { clienteId },
      include: { cliente: true },
      orderBy: { createdAt: "desc" },
    });

    return results.map(this.mapToDomain);
  }

  async count(filters: OrdemFilters): Promise<number> {
    const where: Prisma.mod_ordem_servico_ordensWhereInput = {};

    if (filters.clienteId) where.clienteId = filters.clienteId;
    if (filters.usuarioResponsavelId)
      where.usuarioResponsavelId = filters.usuarioResponsavelId;
    if (filters.status)
      where.status = Array.isArray(filters.status)
        ? { in: filters.status }
        : filters.status;
    if (filters.origemSolicitacao)
      where.origemSolicitacao = filters.origemSolicitacao;
    if (filters.tipoServico) where.tipoServico = filters.tipoServico;
    if (filters.dataInicio || filters.dataFim) {
      where.dataAbertura = {};
      if (filters.dataInicio)
        (where.dataAbertura as Prisma.DateTimeFilter).gte = filters.dataInicio;
      if (filters.dataFim)
        (where.dataAbertura as Prisma.DateTimeFilter).lte = filters.dataFim;
    }
    if (filters.search) {
      where.OR = [
        { numero: { contains: filters.search, mode: "insensitive" } },
        { descricao: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return this.prisma.mod_ordem_servico_ordens.count({ where });
  }

  async findAllPaginated(
    filters: OrdemFilters,
  ): Promise<{ data: OrdemServico[]; total: number }> {
    const where: Prisma.mod_ordem_servico_ordensWhereInput = {};

    if (filters.clienteId) where.clienteId = filters.clienteId;
    if (filters.usuarioResponsavelId)
      where.usuarioResponsavelId = filters.usuarioResponsavelId;
    if (filters.status)
      where.status = Array.isArray(filters.status)
        ? { in: filters.status }
        : filters.status;
    if (filters.origemSolicitacao)
      where.origemSolicitacao = filters.origemSolicitacao;
    if (filters.tipoServico) where.tipoServico = filters.tipoServico;
    if (filters.dataInicio || filters.dataFim) {
      where.dataAbertura = {};
      if (filters.dataInicio)
        (where.dataAbertura as Prisma.DateTimeFilter).gte = filters.dataInicio;
      if (filters.dataFim)
        (where.dataAbertura as Prisma.DateTimeFilter).lte = filters.dataFim;
    }
    if (filters.search) {
      where.OR = [
        { numero: { contains: filters.search, mode: "insensitive" } },
        { descricao: { contains: filters.search, mode: "insensitive" } },
        {
          cliente: { name: { contains: filters.search, mode: "insensitive" } },
        },
      ];
    }

    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));

    const [total, results] = await Promise.all([
      this.prisma.mod_ordem_servico_ordens.count({ where }),
      this.prisma.mod_ordem_servico_ordens.findMany({
        where,
        include: { cliente: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: results.map((item) =>
        this.mapToDomain(item as OrdemServicoIncludePayload),
      ),
      total,
    };
  }

  async getConfig(key: string): Promise<string | null> {
    const result = await this.prisma.mod_ordem_servico_configs.findFirst({
      where: { key },
      select: { value: true },
    });
    return result?.value || null;
  }

  async updateStatus(
    id: string,
    status: number,
    dataConclusao?: Date,
    motivoCancelamento?: string,
  ): Promise<OrdemServico> {
    const updateData: Prisma.mod_ordem_servico_ordensUpdateInput = {
      status,
      updatedAt: new Date(),
    };
    if (dataConclusao) updateData.dataConclusao = dataConclusao;
    if (motivoCancelamento !== undefined)
      updateData.motivoCancelamento = motivoCancelamento;

    const updated = await this.prisma.mod_ordem_servico_ordens.update({
      where: { id },
      data: updateData,
      include: { cliente: true },
    });

    return this.mapToDomain(updated as OrdemServicoIncludePayload);
  }

  async deleteCascade(id: string): Promise<void> {
    await this.prisma.mod_ordem_servico_anexos_abandono.deleteMany({
      where: { alerta: { ordemServicoId: id } },
    });
    await this.prisma.mod_ordem_servico_alertas_abandono.deleteMany({
      where: { ordemServicoId: id },
    });
    await this.prisma.mod_ordem_servico_pagamentos.deleteMany({
      where: { ordemServicoId: id },
    });
    await this.prisma.mod_ordem_servico_status_historico.deleteMany({
      where: { ordemServicoId: id },
    });
    await this.prisma.mod_ordem_servico_historico.deleteMany({
      where: { ordemServicoId: id },
    });
    await this.prisma.mod_ordem_servico_order_notifications.deleteMany({
      where: { ordemId: id },
    });
    await this.prisma.mod_ordem_servico_ordens.delete({ where: { id } });
  }

  async getDashboardData(): Promise<
    { status: number; quantidade: number; valor_total: number }[]
  > {
    const dados = await this.prisma.mod_ordem_servico_ordens.groupBy({
      by: ["status"],
      _count: { status: true },
      _sum: { valorServico: true },
    });

    return dados.map((item) => ({
      status: item.status,
      quantidade: item._count.status,
      valor_total: Number(item._sum.valorServico || 0),
    }));
  }

  async getTiposServico(): Promise<TipoServico[]> {
    const result = await this.prisma.mod_ordem_servico_tipos_servico.findMany({
      orderBy: { nome: "asc" },
    });

    return result.map((item) => ({
      id: item.id,
      nome: item.nome,
      isDefault: item.isDefault === true,
    }));
  }

  async getTiposEquipamento(): Promise<TipoEquipamento[]> {
    const result =
      await this.prisma.mod_ordem_servico_tipos_equipamento.findMany({
        orderBy: { nome: "asc" },
      });

    return result.map((item) => ({
      id: item.id,
      nome: item.nome,
    }));
  }

  async getTechnicians(
    tenantId: string,
  ): Promise<{ id: string; name: string; email: string }[]> {
    const userRoles = await this.prisma.mod_ordem_servico_user_roles.findMany({
      where: { isTechnician: true },
      select: { userId: true },
    });

    if (userRoles.length === 0) return [];

    const users = await this.corePrisma.user.findMany({
      where: {
        id: { in: userRoles.map((item) => item.userId) },
        tenantId,
        isLocked: false,
      },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });

    return users;
  }

  async getStatusHistorico(ordemId: string): Promise<any[]> {
    const historico =
      await this.prisma.mod_ordem_servico_status_historico.findMany({
        where: { ordemServicoId: ordemId },
        orderBy: { dataAlteracao: "desc" },
      });

    return historico.map((item) => ({
      id: item.id,
      ordem_servico_id: item.ordemServicoId,
      status_anterior: item.statusAnterior,
      status_novo: item.statusNovo,
      usuario_id: item.usuarioId,
      data_alteracao: item.dataAlteracao.toISOString(),
      observacoes: item.observacoes,
      created_at: item.createdAt?.toISOString() || null,
    }));
  }

  async createPagamento(data: {
    tenantId: string;
    ordemServicoId: string;
    formaPagamento: string;
    valor: number;
    parcelas?: number;
    observacoes?: string;
    createdBy: string;
  }): Promise<Pagamento> {
    const created = await this.prisma.mod_ordem_servico_pagamentos.create({
      data: {
        tenantId: data.tenantId,
        ordemServicoId: data.ordemServicoId,
        formaPagamento: data.formaPagamento,
        valor: data.valor,
        parcelas: data.parcelas,
        observacoes: data.observacoes,
        createdBy: data.createdBy,
      },
    });

    return this.mapPagamentoToDomain(created);
  }

  async createManyPagamentos(
    pagamentos: {
      tenantId: string;
      ordemServicoId: string;
      formaPagamento: string;
      valor: number;
      parcelas?: number;
      observacoes?: string;
      createdBy: string;
    }[],
  ): Promise<void> {
    await this.prisma.mod_ordem_servico_pagamentos.createMany({
      data: pagamentos.map((p) => ({
        tenantId: p.tenantId,
        ordemServicoId: p.ordemServicoId,
        formaPagamento: p.formaPagamento,
        valor: p.valor,
        parcelas: p.parcelas,
        observacoes: p.observacoes,
        createdBy: p.createdBy,
      })),
    });
  }

  async registrarHistorico(data: {
    tenantId: string;
    ordemServicoId: string;
    usuarioId: string;
    acao: string;
    valorAnterior?: string;
    valorNovo?: string;
    observacoes?: string;
  }): Promise<Historico> {
    const created = await this.prisma.mod_ordem_servico_historico.create({
      data: {
        tenantId: data.tenantId,
        ordemServicoId: data.ordemServicoId,
        usuarioId: data.usuarioId,
        acao: data.acao,
        valorAnterior: data.valorAnterior,
        valorNovo: data.valorNovo,
        observacoes: data.observacoes,
      },
    });

    return this.mapHistoricoToDomain(created);
  }

  async registrarStatusHistorico(data: {
    tenantId: string;
    ordemServicoId: string;
    usuarioId: string;
    statusAnterior: number;
    statusNovo: number;
    observacoes?: string;
  }): Promise<void> {
    await this.prisma.mod_ordem_servico_status_historico.create({
      data: {
        tenantId: data.tenantId,
        ordemServicoId: data.ordemServicoId,
        usuarioId: data.usuarioId,
        statusAnterior: data.statusAnterior,
        statusNovo: data.statusNovo,
        observacoes: data.observacoes,
      },
    });
  }

  async getAlertasAbandono(ordemId: string): Promise<any[]> {
    const alertas =
      await this.prisma.mod_ordem_servico_alertas_abandono.findMany({
        where: { ordemServicoId: ordemId },
        include: { anexos: true },
        orderBy: { numeroAlerta: "asc" },
      });

    return alertas;
  }

  async createAlertaAbandono(data: {
    tenantId: string;
    ordemServicoId: string;
    numeroAlerta: number;
    dataEnvio: Date;
    meioComunicacao: string;
    enviadoPor: string;
    mensagem?: string;
    observacoes?: string;
  }): Promise<any> {
    const created = await this.prisma.mod_ordem_servico_alertas_abandono.create(
      {
        data: {
          tenantId: data.tenantId,
          ordemServicoId: data.ordemServicoId,
          numeroAlerta: data.numeroAlerta,
          dataEnvio: data.dataEnvio,
          meioComunicacao: data.meioComunicacao,
          enviadoPor: data.enviadoPor,
          mensagem: data.mensagem,
          observacoes: data.observacoes,
        },
      },
    );

    return created;
  }

  async createAnexoAlerta(data: {
    tenantId: string;
    alertaId: string;
    nomeArquivo: string;
    tipoArquivo?: string;
    tamanhoBytes?: number;
    urlArquivo: string;
    descricao?: string;
    uploadedBy: string;
  }): Promise<any> {
    return this.prisma.mod_ordem_servico_anexos_abandono.create({
      data: {
        tenantId: data.tenantId,
        alertaId: data.alertaId,
        nomeArquivo: data.nomeArquivo,
        tipoArquivo: data.tipoArquivo || "application/octet-stream",
        tamanhoBytes: data.tamanhoBytes,
        urlArquivo: data.urlArquivo,
        descricao: data.descricao,
        uploadedBy: data.uploadedBy,
      },
    });
  }

  async getAlertasRetirada(): Promise<{
    total_pendentes: number;
    urgentes: number;
    atencao: number;
    normal: number;
    cobranca_ativa: number;
  }> {
    const ordens = await this.prisma.mod_ordem_servico_ordens.findMany({
      where: {
        status: StatusOS.FINALIZADA,
        dataConclusao: { not: null },
      },
      select: { dataConclusao: true },
    });

    const result = {
      total_pendentes: 0,
      urgentes: 0,
      atencao: 0,
      normal: 0,
      cobranca_ativa: 0,
    };
    const now = Date.now();

    for (const ordem of ordens) {
      if (!ordem.dataConclusao) continue;
      result.total_pendentes += 1;
      const diff = Math.floor((now - ordem.dataConclusao.getTime()) / 86400000);
      if (diff > 30) result.urgentes += 1;
      else if (diff >= 15) result.atencao += 1;
      else result.normal += 1;
    }

    return result;
  }

  async updateConservacao(
    id: string,
    valorConservacao: number,
    justificativa?: string,
  ): Promise<OrdemServico> {
    const updated = await this.prisma.mod_ordem_servico_ordens.update({
      where: { id },
      data: {
        valorConservacao: valorConservacao,
        justificativaConservacao: justificativa,
        updatedAt: new Date(),
      },
      include: { cliente: true },
    });

    return this.mapToDomain(updated);
  }

  private async gerarNumeroOS(tenantId: string): Promise<string> {
    const ultima = await this.prisma.mod_ordem_servico_ordens.findFirst({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      select: { numero: true },
    });

    const ultimoNumero =
      Number(String(ultima?.numero || "").replace(/\D/g, "")) || 0;
    return String(ultimoNumero + 1).padStart(6, "0");
  }

  private mapToDomain(data: OrdemServicoIncludePayload): OrdemServico {
    return {
      id: data.id,
      tenantId: data.tenantId,
      numero: data.numero,
      clienteId: data.clienteId,
      usuarioResponsavelId: data.usuarioResponsavelId ?? undefined,
      tipoServico: data.tipoServico,
      descricao: data.descricao,
      observacoesInternas: data.observacoesInternas ?? undefined,
      observacoesCliente: data.observacoesCliente ?? undefined,
      valorServico: Number(data.valorServico || 0),
      formaPagamento: data.formaPagamento ?? undefined,
      status: data.status,
      prioridade: data.prioridade || "MEDIA",
      dataAbertura: data.dataAbertura ?? new Date(),
      dataPrevisao: data.dataPrevisao ?? undefined,
      dataConclusao: data.dataConclusao ?? undefined,
      origemSolicitacao: data.origemSolicitacao,
      orcamentoAprovado: data.orcamentoAprovado ?? false,
      motivoCancelamento: data.motivoCancelamento ?? undefined,
      equipamentoTipo: data.equipamentoTipo ?? undefined,
      equipamentoMarca: data.equipamentoMarca ?? undefined,
      equipamentoModelo: data.equipamentoModelo ?? undefined,
      equipamentoSerie: data.equipamentoSerie ?? undefined,
      equipamentoAcessorios: data.equipamentoAcessorios ?? undefined,
      equipamentoEstado: data.equipamentoEstado ?? undefined,
      equipamentoFotos: data.equipamentoFotos ?? undefined,
      laudoTecnico: data.laudoTecnico ?? undefined,
      valorConservacao: data.valorConservacao
        ? Number(data.valorConservacao)
        : undefined,
      justificativaConservacao: data.justificativaConservacao ?? undefined,
      createdAt: data.createdAt ?? new Date(),
      updatedAt: data.updatedAt ?? new Date(),
      cliente: data.cliente
        ? {
            id: data.cliente.id,
            name: data.cliente.name,
            document: data.cliente.document ?? undefined,
            phonePrimary: data.cliente.phonePrimary ?? undefined,
            phoneSecondary: data.cliente.phoneSecondary ?? undefined,
            email: data.cliente.email ?? undefined,
            addressStreet: data.cliente.addressStreet ?? undefined,
            addressNumber: data.cliente.addressNumber ?? undefined,
            addressCity: data.cliente.addressCity ?? undefined,
            addressState: data.cliente.addressState ?? undefined,
            imageUrl: data.cliente.imageUrl ?? undefined,
            isActive: data.cliente.isActive ?? true,
          }
        : null,
    };
  }

  private mapHistoricoToDomain(data: mod_ordem_servico_historico): Historico {
    return {
      id: data.id,
      tenantId: data.tenantId,
      ordemServicoId: data.ordemServicoId,
      usuarioId: data.usuarioId,
      acao: data.acao,
      valorAnterior: data.valorAnterior ?? undefined,
      valorNovo: data.valorNovo ?? undefined,
      observacoes: data.observacoes ?? undefined,
      createdAt: data.createdAt ?? new Date(),
    };
  }

  private mapPagamentoToDomain(data: mod_ordem_servico_pagamentos): Pagamento {
    return {
      id: data.id,
      tenantId: data.tenantId,
      ordemServicoId: data.ordemServicoId,
      formaPagamento: data.formaPagamento,
      valor: Number(data.valor),
      parcelas: data.parcelas ?? undefined,
      observacoes: data.observacoes ?? undefined,
      createdAt: data.createdAt ?? new Date(),
      createdBy: data.createdBy,
    };
  }
}

type OrdemServicoIncludePayload = Prisma.mod_ordem_servico_ordensGetPayload<{
  include: { cliente: true };
}>;
