import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, IsArray, IsDateString, Min } from 'class-validator';

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
    CANCELADA = 7
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
}

export class OrdemServicoFilters {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsArray()
    @IsEnum(StatusOS, { each: true })
    status?: StatusOS[];

    @IsOptional()
    @IsString()
    cliente_id?: string;

    @IsOptional()
    @IsString()
    usuario_responsavel_id?: string;

    @IsOptional()
    @IsDateString()
    data_inicio?: string;

    @IsOptional()
    @IsDateString()
    data_fim?: string;

    @IsOptional()
    @IsEnum(OrigemSolicitacao)
    origem_solicitacao?: OrigemSolicitacao;

    @IsOptional()
    @IsString()
    tipo_servico?: string;
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