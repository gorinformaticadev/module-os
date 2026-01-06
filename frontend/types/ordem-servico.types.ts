// Tipos para o módulo de Ordem de Serviço

export interface OrdemServico {
  id: string;
  numero: string;
  tenant_id: string;
  cliente_id: string;
  usuario_responsavel_id: string;
  tipo_servico: string;
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA';
  descricao: string;
  observacoes_internas?: string;
  observacoes_cliente?: string;
  valor_servico: number;
  forma_pagamento?: string;
  status: StatusOS;
  data_abertura: string;
  data_previsao?: string;
  data_conclusao?: string;
  origem_solicitacao: OrigemSolicitacao;

  // Equipamento
  equipamento_tipo?: string;
  equipamento_marca?: string;
  equipamento_modelo?: string;
  equipamento_serie?: string;
  equipamento_acessorios?: string;
  equipamento_estado?: string;

  // Formatação (Campos Condicionais)
  formatacao_so?: string;
  formatacao_backup?: boolean;
  formatacao_backup_descricao?: string;
  formatacao_senha?: string;
  equipamento_fotos?: string[];

  orcamento_aprovado?: boolean;
  motivo_cancelamento?: string;
  created_at: string;
  updated_at: string;

  // Relacionamentos
  cliente?: Cliente;
  usuario_responsavel?: Usuario;
  historico?: HistoricoOS[];
}

export interface Cliente {
  id: string;
  name: string;
  document?: string;
  phone_primary: string;
  phone_secondary?: string;
  address_street?: string;
  address_number?: string;
  address_complement?: string;
  address_neighborhood?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  observations?: string;
  image_url?: string;
  is_active: boolean;
}

export interface Usuario {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface HistoricoOS {
  id: string;
  ordem_servico_id: string;
  usuario_id: string;
  acao: string;
  valor_anterior?: string;
  valor_novo?: string;
  observacoes?: string;
  created_at: string;
  usuario?: Usuario;
}

// Enums
export enum StatusOS {
  ORCAMENTO = 0,
  ABERTA = 1,
  EM_ANALISE = 2,
  AGUARDANDO_CLIENTE = 3,
  AGUARDANDO_PECAS = 4,
  EM_EXECUCAO = 5,
  FINALIZADA = 6,
  CANCELADA = 7
}

export enum OrigemSolicitacao {
  WHATSAPP = 'WHATSAPP',
  PRESENCIAL = 'PRESENCIAL',
  SISTEMA = 'SISTEMA'
}

export enum TipoServico {
  IMPRESSAO = 'IMPRESSAO',
  FORMATACAO = 'FORMATACAO',
  MANUTENCAO = 'MANUTENCAO',
  CRIACAO_ARTE = 'CRIACAO_ARTE',
  CADASTRO_DIGITAL = 'CADASTRO_DIGITAL',
  SUPORTE_TECNICO = 'SUPORTE_TECNICO',
  OUTROS = 'OUTROS'
}

// Utilitários
export const STATUS_LABELS: Record<StatusOS, string> = {
  [StatusOS.ORCAMENTO]: 'Orçamento',
  [StatusOS.ABERTA]: 'Aberta',
  [StatusOS.EM_ANALISE]: 'Em Análise',
  [StatusOS.AGUARDANDO_CLIENTE]: 'Aguardando Cliente',
  [StatusOS.AGUARDANDO_PECAS]: 'Aguardando Peças',
  [StatusOS.EM_EXECUCAO]: 'Em Execução',
  [StatusOS.FINALIZADA]: 'Finalizada',
  [StatusOS.CANCELADA]: 'Cancelada'
};

export const STATUS_COLORS: Record<StatusOS, string> = {
  [StatusOS.ORCAMENTO]: 'bg-yellow-500',
  [StatusOS.ABERTA]: 'bg-green-500',
  [StatusOS.EM_ANALISE]: 'bg-blue-500',
  [StatusOS.AGUARDANDO_CLIENTE]: 'bg-orange-500',
  [StatusOS.AGUARDANDO_PECAS]: 'bg-purple-500',
  [StatusOS.EM_EXECUCAO]: 'bg-indigo-500',
  [StatusOS.FINALIZADA]: 'bg-gray-500',
  [StatusOS.CANCELADA]: 'bg-red-500'
};

export const ORIGEM_LABELS: Record<OrigemSolicitacao, string> = {
  [OrigemSolicitacao.WHATSAPP]: 'WhatsApp',
  [OrigemSolicitacao.PRESENCIAL]: 'Presencial',
  [OrigemSolicitacao.SISTEMA]: 'Sistema'
};

export const TIPO_SERVICO_LABELS: Record<TipoServico, string> = {
  [TipoServico.IMPRESSAO]: 'Impressão',
  [TipoServico.FORMATACAO]: 'Formatação',
  [TipoServico.MANUTENCAO]: 'Manutenção',
  [TipoServico.CRIACAO_ARTE]: 'Criação de Arte',
  [TipoServico.CADASTRO_DIGITAL]: 'Cadastro Digital',
  [TipoServico.SUPORTE_TECNICO]: 'Suporte Técnico',
  [TipoServico.OUTROS]: 'Outros'
};

// Validações de transição de status
export const TRANSICOES_PERMITIDAS: Record<StatusOS, StatusOS[]> = {
  [StatusOS.ORCAMENTO]: [StatusOS.ABERTA, StatusOS.CANCELADA],
  [StatusOS.ABERTA]: [StatusOS.EM_ANALISE, StatusOS.CANCELADA],
  [StatusOS.EM_ANALISE]: [StatusOS.EM_EXECUCAO, StatusOS.AGUARDANDO_CLIENTE, StatusOS.AGUARDANDO_PECAS, StatusOS.CANCELADA],
  [StatusOS.AGUARDANDO_CLIENTE]: [StatusOS.EM_ANALISE, StatusOS.EM_EXECUCAO, StatusOS.AGUARDANDO_PECAS, StatusOS.CANCELADA],
  [StatusOS.AGUARDANDO_PECAS]: [StatusOS.EM_EXECUCAO, StatusOS.AGUARDANDO_CLIENTE, StatusOS.CANCELADA],
  [StatusOS.EM_EXECUCAO]: [StatusOS.FINALIZADA, StatusOS.AGUARDANDO_CLIENTE, StatusOS.AGUARDANDO_PECAS, StatusOS.CANCELADA],
  [StatusOS.FINALIZADA]: [],
  [StatusOS.CANCELADA]: []
};

export interface CreateOrdemServicoDTO {
  cliente_id: string;
  tipo_servico: string;
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA';
  descricao: string;
  observacoes_internas?: string;
  observacoes_cliente?: string;
  valor_servico?: number;
  forma_pagamento?: string;
  data_previsao?: string;
  origem_solicitacao: OrigemSolicitacao;
  status?: StatusOS;

  // Equipamento
  equipamento_tipo?: string;
  equipamento_marca?: string;
  equipamento_modelo?: string;
  equipamento_serie?: string;
  equipamento_acessorios?: string;
  equipamento_estado?: string;

  // Formatação (Campos Condicionais)
  formatacao_so?: string;
  formatacao_backup?: boolean;
  formatacao_backup_descricao?: string;
  formatacao_senha?: string;
  equipamento_fotos?: string[];
}

export interface UpdateOrdemServicoDTO {
  tipo_servico?: string;
  prioridade?: 'BAIXA' | 'MEDIA' | 'ALTA';
  descricao?: string;
  observacoes_internas?: string;
  observacoes_cliente?: string;
  valor_servico?: number;
  forma_pagamento?: string;
  data_previsao?: string;
  usuario_responsavel_id?: string;
  status?: StatusOS;
  motivo_cancelamento?: string;

  // Equipamento
  equipamento_tipo?: string;
  equipamento_marca?: string;
  equipamento_modelo?: string;
  equipamento_serie?: string;
  equipamento_acessorios?: string;
  equipamento_estado?: string;

  // Formatação (Campos Condicionais)
  formatacao_so?: string;
  formatacao_backup?: boolean;
  formatacao_backup_descricao?: string;
  formatacao_senha?: string;
  equipamento_fotos?: string[];
}

export interface OrdemServicoFilters {
  search?: string;
  status?: StatusOS[];
  cliente_id?: string;
  usuario_responsavel_id?: string;
  data_inicio?: string;
  data_fim?: string;
  origem_solicitacao?: OrigemSolicitacao;
  tipo_servico?: string;
}