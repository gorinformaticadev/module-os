import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, IsArray, IsDateString, IsInt, Min, Max, ArrayMinSize, ArrayMaxSize, ValidateNested, IsNotEmpty } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum OrigemSolicitacao {
    WHATSAPP = 'WHATSAPP',
    PRESENCIAL = 'PRESENCIAL',
    SISTEMA = 'SISTEMA'
}

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

export class ItemOrdem {
    produto_id?: string;
    descricao: string;
    valor_unitario: number;
    quantidade: number;
    valor_total: number;
}

export class CreateOrdemServicoDTO {
    @IsString()
    cliente_id: string;

    @IsString()
    tipo_servico: string;

    @IsString()
    @IsEnum(['BAIXA', 'MEDIA', 'ALTA'])
    prioridade: 'BAIXA' | 'MEDIA' | 'ALTA';

    @IsString()
    descricao: string;

    @IsOptional()
    @IsString()
    observacoes_internas?: string;

    @IsOptional()
    @IsString()
    observacoes_cliente?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    valor_servico?: number;

    @IsOptional()
    @IsString()
    forma_pagamento?: string;

    @IsOptional()
    @IsDateString()
    data_previsao?: string;

    @IsEnum(OrigemSolicitacao)
    origem_solicitacao: OrigemSolicitacao;

    @IsOptional()
    @IsEnum(StatusOS)
    status?: StatusOS;

    @IsOptional()
    @IsString()
    laudo_tecnico?: string;

    @IsOptional()
    @IsString()
    usuario_responsavel_id?: string;

    // Equipamento
    @IsOptional()
    @IsString()
    equipamento_tipo?: string;

    @IsOptional()
    @IsString()
    equipamento_marca?: string;

    @IsOptional()
    @IsString()
    equipamento_modelo?: string;

    @IsOptional()
    @IsString()
    equipamento_serie?: string;

    @IsOptional()
    @IsString()
    equipamento_acessorios?: string;

    @IsOptional()
    @IsString()
    equipamento_estado?: string;

    // Formatação
    @IsOptional()
    @IsString()
    formatacao_so?: string;

    @IsOptional()
    @IsBoolean()
    formatacao_backup?: boolean;

    @IsOptional()
    @IsString()
    formatacao_backup_descricao?: string;

    @IsOptional()
    @IsString()
    formatacao_senha?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    equipamento_fotos?: string[];

    @IsOptional()
    @IsArray()
    itens?: ItemOrdem[];

    @IsOptional()
    @IsInt()
    @Min(0)
    garantia_dias?: number;
}

export class UpdateOrdemServicoDTO {
    @IsOptional()
    @IsString()
    tipo_servico?: string;

    @IsOptional()
    @IsString()
    @IsEnum(['BAIXA', 'MEDIA', 'ALTA'])
    prioridade?: 'BAIXA' | 'MEDIA' | 'ALTA';

    @IsOptional()
    @IsString()
    descricao?: string;

    @IsOptional()
    @IsString()
    observacoes_internas?: string;

    @IsOptional()
    @IsString()
    observacoes_cliente?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    valor_servico?: number;

    @IsOptional()
    @IsString()
    forma_pagamento?: string;

    @IsOptional()
    @IsDateString()
    data_previsao?: string;

    @IsOptional()
    @IsString()
    usuario_responsavel_id?: string;

    @IsOptional()
    @IsEnum(StatusOS)
    status?: StatusOS;

    @IsOptional()
    @IsString()
    motivo_cancelamento?: string;

    @IsOptional()
    @IsEnum(OrigemSolicitacao)
    origem_solicitacao?: OrigemSolicitacao;

    @IsOptional()
    @IsString()
    laudo_tecnico?: string;

    // Equipamento
    @IsOptional()
    @IsString()
    equipamento_tipo?: string;

    @IsOptional()
    @IsString()
    equipamento_marca?: string;

    @IsOptional()
    @IsString()
    equipamento_modelo?: string;

    @IsOptional()
    @IsString()
    equipamento_serie?: string;

    @IsOptional()
    @IsString()
    equipamento_acessorios?: string;

    @IsOptional()
    @IsString()
    equipamento_estado?: string;

    // Formatação
    @IsOptional()
    @IsString()
    formatacao_so?: string;

    @IsOptional()
    @IsBoolean()
    formatacao_backup?: boolean;

    @IsOptional()
    @IsString()
    formatacao_backup_descricao?: string;

    @IsOptional()
    @IsString()
    formatacao_senha?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    equipamento_fotos?: string[];

    @IsOptional()
    @IsArray()
    itens?: ItemOrdem[];

    @IsOptional()
    @IsInt()
    @Min(0)
    garantia_dias?: number;
}

// ============================================
// DTOs DE QUERY - APENAS PARA TIPAGEM
// ============================================
// IMPORTANTE: Estes DTOs NÃO devem ser usados com ValidationPipe
// Servem apenas para tipagem, documentação e contratos de API

export class OrdemServicoFilters {
    // Busca textual livre - sem validação (pode ser qualquer string)
    @IsOptional()
    @IsString()
    search?: string;

    // Array de status - tipagem apenas, sem validação automática
    @IsOptional()
    @Transform(({ value }) => {
        if (value === undefined || value === null || value === '') {
            return undefined;
        }

        const rawValues = Array.isArray(value) ? value : String(value).split(',');
        return rawValues
            .map((entry) => Number(String(entry).trim()))
            .filter((entry) => Number.isFinite(entry));
    })
    @IsArray()
    @IsNumber({}, { each: true })
    status?: StatusOS[];

    // IDs - tipagem como string, validação manual no service se necessário
    @IsOptional()
    @IsString()
    cliente_id?: string;

    @IsOptional()
    @IsString()
    usuario_responsavel_id?: string;

    // Datas - tipagem como string, parsing manual no service
    @IsOptional()
    @IsString()
    data_inicio?: string;

    @IsOptional()
    @IsString()
    data_fim?: string;

    // Enums - tipagem apenas, sem validação automática
    @IsOptional()
    @IsString()
    origem_solicitacao?: OrigemSolicitacao;

    @IsOptional()
    @IsString()
    tipo_servico?: string;

    // Paginação - tipagem como number, conversão manual no service
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number;
}

// DTO para parâmetros de path (tipagem apenas)
export class OrdemServicoParamsDTO {
    id?: string;
    tenantId?: string;
    filename?: string;
}

export class UpdateStatusDTO {
    @IsEnum(StatusOS)
    status: StatusOS;

    @IsOptional()
    @IsString()
    motivo_cancelamento?: string;

    @IsOptional()
    @IsString()
    observacoes?: string;
}

// ============================================
// DTOs DE RESPOSTA
// ============================================

export class ClienteResponseDTO {
    name: string;
    phone_primary: string;
    is_active: boolean;
}

export class ResponsavelResponseDTO {
    name: string;
    email: string;
}

export class OrdemServicoResponseDTO {
    id: string;
    tenant_id: string;
    numero: string;
    cliente_id: string;
    usuario_responsavel_id: string;
    tipo_servico: string;
    descricao: string;
    laudo_tecnico: string;
    observacoes_internas: string;
    observacoes_cliente: string;
    valor_servico: number;
    forma_pagamento: string;
    status: number;
    prioridade: string;
    data_abertura: string;
    data_previsao: string;
    data_conclusao: string;
    origem_solicitacao: string;
    orcamento_aprovado: boolean;
    motivo_cancelamento: string;
    equipamento_tipo: string;
    equipamento_marca: string;
    equipamento_modelo: string;
    equipamento_serie: string;
    equipamento_acessorios: string;
    equipamento_estado: string;
    equipamento_fotos: string[];
    formatacao_so: string;
    formatacao_backup: boolean;
    formatacao_backup_descricao: string;
    formatacao_senha: string;
    created_at: string;
    updated_at: string;
    cliente: ClienteResponseDTO;
    responsavel: ResponsavelResponseDTO;
    itens?: ItemOrdem[];
    // Novos campos de conservação e retirada
    valor_conservacao?: number;
    dias_atraso?: number;
    justificativa_conservacao?: string;
    data_limite_retirada?: string;
    data_retirada?: string;
}

export class OrdemServicoListResponseDTO {
    data: OrdemServicoResponseDTO[];
    total: number;
    page: number;
    totalPages: number;
    limit: number;
}

export class DashboardDataResponseDTO {
    status: number;
    quantidade: number;
    valor_total: number;
}

export class TipoServicoResponseDTO {
    id: string;
    nome: string;
    is_default: boolean;
}

export class TipoEquipamentoResponseDTO {
    id: string;
    nome: string;
}

export class TechnicianResponseDTO {
    id: string;
    name: string;
    email: string;
}

export class HistoricoResponseDTO {
    id: string;
    ordem_servico_id: string;
    usuario_id: string;
    acao: string;
    valor_anterior: string;
    valor_novo: string;
    observacoes: string;
    created_at: string;
    usuario_nome: string;
    usuario_email: string;
}

export class RegistrarWhatsAppEnvioDTO {
    @IsString()
    @IsNotEmpty()
    forma_envio: string;

    @IsString()
    @IsNotEmpty()
    mensagem: string;
}

export class WhatsAppEnvioHistoricoResponseDTO {
    id: string;
    ordem_servico_id: string;
    usuario_id: string;
    usuario_nome: string;
    usuario_email: string;
    forma_envio: string;
    mensagem: string;
    created_at: string;
}

export class UploadResponseDTO {
    url: string;
}

export class DeleteResponseDTO {
    success: boolean;
}

// ============================================
// DTOs PARA RETIRADA E PAGAMENTOS
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

export class PagamentoDTO {
    @IsString()
    @IsNotEmpty()
    @IsEnum(FormaPagamento)
    forma_pagamento: FormaPagamento;

    @IsNumber()
    @Min(0.01)
    valor: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(12)
    parcelas?: number;

    @IsOptional()
    @IsString()
    observacoes?: string;
}

export class RetiradaDTO {
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(5)
    @ValidateNested({ each: true })
    @Type(() => PagamentoDTO)
    pagamentos: PagamentoDTO[];

    @IsOptional()
    @IsString()
    observacoes?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    valor_conservacao?: number;

    @IsOptional()
    @IsString()
    justificativa_conservacao?: string;
}

export class PagamentoResponseDTO {
    id: string;
    ordem_servico_id: string;
    forma_pagamento: string;
    valor: number;
    parcelas: number;
    observacoes: string;
    created_at: string;
    created_by: string;
}

// ============================================
// DTOs PARA ALERTAS DE ABANDONO
// ============================================

export enum MeioComunicacao {
    WHATSAPP = 'WHATSAPP',
    EMAIL = 'EMAIL',
    SMS = 'SMS',
    CARTA = 'CARTA',
    TELEFONE = 'TELEFONE'
}

export class AlertaAbandonoDTO {
    @IsInt()
    @Min(1)
    @Max(3)
    numero_alerta: number;

    @IsDateString()
    data_envio: string;

    @IsString()
    @IsNotEmpty()
    @IsEnum(MeioComunicacao)
    meio_comunicacao: MeioComunicacao;

    @IsOptional()
    @IsString()
    mensagem?: string;

    @IsOptional()
    @IsString()
    observacoes?: string;
}

export class AnexoAbandonoDTO {
    @IsString()
    @IsNotEmpty()
    nome_arquivo: string;

    @IsString()
    @IsNotEmpty()
    url_arquivo: string;

    @IsOptional()
    @IsString()
    tipo_arquivo?: string;

    @IsOptional()
    @IsInt()
    tamanho_bytes?: number;

    @IsOptional()
    @IsString()
    descricao?: string;
}

export class AlertaAbandonoResponseDTO {
    id: string;
    ordem_servico_id: string;
    numero_alerta: number;
    data_envio: string;
    meio_comunicacao: string;
    enviado_por: string;
    mensagem: string;
    observacoes: string;
    created_at: string;
    anexos?: AnexoAbandonoResponseDTO[];
}

export class AnexoAbandonoResponseDTO {
    id: string;
    alerta_id: string;
    nome_arquivo: string;
    tipo_arquivo: string;
    tamanho_bytes: number;
    url_arquivo: string;
    descricao: string;
    created_at: string;
    uploaded_by: string;
}

export class MarcarAbandonadoDTO {
    @IsOptional()
    @IsString()
    observacoes?: string;
}

// ============================================
// DTOs PARA CONSERVAÇÃO
// ============================================

export class ConservacaoCalculoResponseDTO {
    diasAtraso: number;
    valorConservacao: number;
    emAtraso: boolean;
    dataLimite: string;
    prazoRetiradaDias: number;
    valorDiario: number;
    conservacaoHabilitada: boolean;
}

export class AtualizarConservacaoDTO {
    @IsOptional()
    @IsNumber()
    @Min(0)
    valor_conservacao?: number;

    @IsOptional()
    @IsString()
    justificativa_conservacao?: string;
}

// ============================================
// DTOs PARA HISTÓRICO DE STATUS
// ============================================

export class StatusHistoricoResponseDTO {
    id: string;
    ordem_servico_id: string;
    status_anterior: number;
    status_novo: number;
    usuario_id: string;
    usuario_nome: string;
    usuario_email: string;
    data_alteracao: string;
    observacoes: string;
    created_at: string;
}

// ============================================
// DTOs PARA ALERTAS DE RETIRADA (BADGES)
// ============================================

export class AlertaRetiradaResponseDTO {
    total_pendentes: number;
    urgentes: number;
    atencao: number;
    normal: number;
    cobranca_ativa: number;
}
