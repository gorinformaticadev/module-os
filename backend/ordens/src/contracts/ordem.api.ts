// Contrato mínimo da Ordem de Serviço

export interface OrdemServico {
  id: string;
  tenantId: string;
  numero: string;
  clienteId: string;
  usuarioResponsavelId?: string;
  tipoServico: string;
  descricao: string;
  observacoesInternas?: string;
  observacoesCliente?: string;
  valorServico: number;
  formaPagamento?: string;
  status: number;
  prioridade: string;
  dataAbertura: Date;
  dataPrevisao?: Date;
  dataConclusao?: Date;
  origemSolicitacao?: string;
  orcamentoAprovado?: boolean;
  motivoCancelamento?: string;
  equipamentoTipo?: string;
  equipamentoMarca?: string;
  equipamentoModelo?: string;
  equipamentoSerie?: string;
  equipamentoAcessorios?: string;
  equipamentoEstado?: string;
  equipamentoFotos?: string | string[];
  laudoTecnico?: string;
  valorConservacao?: number;
  justificativaConservacao?: string;
  diasAtraso?: number;
  dataLimiteRetirada?: Date;
  dataRetirada?: Date;
  garantiaDias?: number;
  createdAt?: Date;
  updatedAt?: Date;
  cliente?: {
    id: string;
    name: string;
    document?: string;
    phonePrimary?: string;
    phoneSecondary?: string;
    email?: string;
    addressStreet?: string;
    addressNumber?: string;
    addressCity?: string;
    addressState?: string;
    imageUrl?: string;
    isActive?: boolean;
  } | null;
}

export interface OrdemAPI {
  findById(id: string): Promise<OrdemServico | null>;
  findAll(filters?: { search?: string; status?: number; clienteId?: string }): Promise<OrdemServico[]>;
  findByCliente(clienteId: string): Promise<OrdemServico[]>;
  create(data: any): Promise<OrdemServico>;
  update(id: string, data: any): Promise<OrdemServico>;
  delete(id: string): Promise<void>;
}
