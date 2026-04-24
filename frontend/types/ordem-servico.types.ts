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
  laudo_tecnico?: string;
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

  // Novos campos de conservação e retirada
  valor_conservacao?: number;
  dias_atraso?: number;
  justificativa_conservacao?: string;
  data_limite_retirada?: string;
  data_retirada?: string;

  // Relacionamentos
  cliente?: Cliente;
  usuario_responsavel?: Usuario;
  historico?: HistoricoOS[];
  itens?: any[];
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

export type WhatsAppSendMethod = 'api' | 'web' | 'crm';

export interface WhatsAppEnvioHistorico {
  id: string;
  ordem_servico_id: string;
  usuario_id: string;
  usuario_nome?: string;
  usuario_email?: string;
  forma_envio: WhatsAppSendMethod | string;
  mensagem: string;
  created_at: string;
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
  CANCELADA = 7,
  RETIRADO = 8,
  ABANDONADO = 9
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
  [StatusOS.CANCELADA]: 'Cancelada',
  [StatusOS.RETIRADO]: 'Retirado',
  [StatusOS.ABANDONADO]: 'Abandonado'
};

export const STATUS_COLORS: Record<StatusOS, string> = {
  [StatusOS.ORCAMENTO]: 'bg-yellow-500',
  [StatusOS.ABERTA]: 'bg-green-500',
  [StatusOS.EM_ANALISE]: 'bg-blue-500',
  [StatusOS.AGUARDANDO_CLIENTE]: 'bg-orange-500',
  [StatusOS.AGUARDANDO_PECAS]: 'bg-purple-500',
  [StatusOS.EM_EXECUCAO]: 'bg-indigo-500',
  [StatusOS.FINALIZADA]: 'bg-gray-500',
  [StatusOS.CANCELADA]: 'bg-red-500',
  [StatusOS.RETIRADO]: 'bg-teal-500',
  [StatusOS.ABANDONADO]: 'bg-stone-500'
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
  [StatusOS.FINALIZADA]: [StatusOS.EM_EXECUCAO, StatusOS.RETIRADO, StatusOS.ABANDONADO],
  [StatusOS.CANCELADA]: [StatusOS.EM_EXECUCAO],
  [StatusOS.RETIRADO]: [], // Estado final
  [StatusOS.ABANDONADO]: [] // Estado final
};

export interface CreateOrdemServicoDTO {
  cliente_id: string;
  tipo_servico: string;
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA';
  descricao: string;
  laudo_tecnico?: string;
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
  laudo_tecnico?: string;
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

// ============================================
// TIPOS PARA PAGAMENTOS E RETIRADA
// ============================================

export enum FormaPagamento {
  PIX = 'PIX',
  DINHEIRO = 'DINHEIRO',
  CARTAO_CREDITO = 'CARTAO_CREDITO',
  CARTAO_DEBITO = 'CARTAO_DEBITO',
  TRANSFERENCIA = 'TRANSFERENCIA',
  CHEQUE = 'CHEQUE',
  BOLETO = 'BOLETO'
}

export const FORMA_PAGAMENTO_LABELS: Record<FormaPagamento, string> = {
  [FormaPagamento.PIX]: 'PIX',
  [FormaPagamento.DINHEIRO]: 'Dinheiro',
  [FormaPagamento.CARTAO_CREDITO]: 'Cartão de Crédito',
  [FormaPagamento.CARTAO_DEBITO]: 'Cartão de Débito',
  [FormaPagamento.TRANSFERENCIA]: 'Transferência',
  [FormaPagamento.CHEQUE]: 'Cheque',
  [FormaPagamento.BOLETO]: 'Boleto'
};

export interface Pagamento {
  id?: string;
  ordem_servico_id?: string;
  forma_pagamento: FormaPagamento;
  valor: number;
  parcelas?: number;
  observacoes?: string;
  created_at?: string;
  created_by?: string;
  created_by_nome?: string;
}

export interface RetiradaDTO {
  pagamentos: Pagamento[];
  observacoes?: string;
  valor_conservacao?: number;
  justificativa_conservacao?: string;
}

// ============================================
// TIPOS PARA ALERTAS DE ABANDONO
// ============================================

export enum MeioComunicacao {
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  CARTA = 'CARTA',
  TELEFONE = 'TELEFONE'
}

export const MEIO_COMUNICACAO_LABELS: Record<MeioComunicacao, string> = {
  [MeioComunicacao.WHATSAPP]: 'WhatsApp',
  [MeioComunicacao.EMAIL]: 'E-mail',
  [MeioComunicacao.SMS]: 'SMS',
  [MeioComunicacao.CARTA]: 'Carta',
  [MeioComunicacao.TELEFONE]: 'Telefone'
};

export interface AlertaAbandono {
  id?: string;
  ordem_servico_id?: string;
  numero_alerta: number;
  data_envio: string;
  meio_comunicacao: MeioComunicacao;
  enviado_por?: string;
  enviado_por_nome?: string;
  mensagem?: string;
  observacoes?: string;
  created_at?: string;
  anexos?: AnexoAbandono[];
}

export interface AnexoAbandono {
  id?: string;
  alerta_id?: string;
  nome_arquivo: string;
  tipo_arquivo?: string;
  tamanho_bytes?: number;
  url_arquivo: string;
  descricao?: string;
  created_at?: string;
  uploaded_by?: string;
}

// ============================================
// TIPOS PARA CONSERVAÇÃO
// ============================================

export interface ConservacaoCalculo {
  diasAtraso: number;
  valorConservacao: number;
  emAtraso: boolean;
  dataLimite: string | null;
  prazoRetiradaDias: number;
  valorDiario: number;
  conservacaoHabilitada: boolean;
}

// ============================================
// TIPOS PARA HISTÓRICO DE STATUS
// ============================================

export interface StatusHistorico {
  id: string;
  ordem_servico_id: string;
  status_anterior: number;
  status_novo: number;
  usuario_id: string;
  usuario_nome?: string;
  usuario_email?: string;
  data_alteracao: string;
  observacoes?: string;
  created_at: string;
}

// ============================================
// TIPOS PARA ALERTAS DE RETIRADA (BADGES)
// ============================================

export interface AlertaRetirada {
  total_pendentes: number;
  urgentes: number;
  atencao: number;
  normal: number;
  cobranca_ativa: number;
}
