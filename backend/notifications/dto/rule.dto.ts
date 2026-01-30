import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateNotificationRuleDto } from './create-notification-rule.dto';
import { TriggerConfigDto } from './create-notification-rule.dto';

/**
 * Campos proibidos que não devem ser enviados pelo frontend
 */
const FORBIDDEN_FIELDS = [
    'id',
    'current_executions',
    'last_execution_at',
    'created_at',
    'updated_at',
    'tenant_id'
];

const ALLOWED_TRIGGER_TYPES = ['EVENT', 'SCHEDULE', 'MANUAL'] as const;
const ALLOWED_CHANNELS = ['SYSTEM', 'EMAIL', 'WHATSAPP', 'SMS', 'PUSH'] as const;

/**
 * Valida e normaliza o payload de criação
 * @throws BadRequestException para payload inválido
 */
export function validateCreatePayload(data: any): CreateNotificationRuleDto {
    if (!data || typeof data !== 'object') {
        throw new BadRequestException('Payload deve ser um objeto válido');
    }

    // Verificar campos proibidos
    const forbiddenUsed = FORBIDDEN_FIELDS.filter(field => field in data);
    if (forbiddenUsed.length > 0) {
        throw new BadRequestException(`Campos não permitidos: ${forbiddenUsed.join(', ')}`);
    }

    // Validar título obrigatório
    if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
        throw new BadRequestException(' título é obrigatório');
    }

    // Validar trigger_type se fornecido
    const triggerType = data.trigger_type || data.triggerType;
    if (triggerType && !ALLOWED_TRIGGER_TYPES.includes(triggerType)) {
        throw new BadRequestException(`trigger_type deve ser um dos: ${ALLOWED_TRIGGER_TYPES.join(', ')}`);
    }

    // Validar channel se fornecido
    const channel = data.channel || data.channel;
    if (channel && !ALLOWED_CHANNELS.includes(channel)) {
        throw new BadRequestException(`channel deve ser um dos: ${ALLOWED_CHANNELS.join(', ')}`);
    }

    // Normalizar trigger_config baseado no trigger_type
    const normalizedTriggerConfig = normalizeTriggerConfig(triggerType, data.trigger_config || data.triggerConfig);

    // Validar recipients se fornecido
    let normalizedRecipients: any[] | null | undefined;
    if (data.recipients) {
        if (!Array.isArray(data.recipients)) {
            throw new BadRequestException('recipients deve ser um array');
        }
        normalizedRecipients = data.recipients.map((r: any, index: number) => {
            if (!r.type || typeof r.type !== 'string') {
                throw new BadRequestException(`recipient[${index}].type é obrigatório`);
            }
            return {
                type: r.type,
                identifier: r.identifier,
                config: r.config
            };
        });
    }

    // Validar e converter expires_at
    let normalizedExpiresAt: string | null | undefined;
    if (data.expires_at || data.expiresAt || data.expiresIn) {
        const expiresValue = data.expires_at || data.expiresAt || data.expiresIn;
        if (expiresValue === null || expiresValue === undefined || expiresValue === '') {
            normalizedExpiresAt = null;
        } else if (typeof expiresValue === 'string') {
            const parsed = Date.parse(expiresValue);
            if (isNaN(parsed)) {
                throw new BadRequestException('expires_at deve ser uma data válida');
            }
            normalizedExpiresAt = new Date(parsed).toISOString();
        } else {
            throw new BadRequestException('expires_at deve ser uma string de data');
        }
    }

    // Validar max_executions
    let normalizedMaxExecutions: number | null | undefined;
    if (data.max_executions !== undefined) {
        if (data.max_executions === null || data.max_executions === '') {
            normalizedMaxExecutions = null;
        } else {
            const parsed = Number(data.max_executions);
            if (isNaN(parsed) || parsed < 0) {
                throw new BadRequestException('max_executions deve ser um número não negativo');
            }
            normalizedMaxExecutions = parsed;
        }
    }

    // Campos de UI ignorados (removidos do payload antes da persistência)
    const uiFields = ['isNew', 'isEditing', 'saving', 'loading', 'error'];
    for (const uiField of uiFields) {
        delete data[uiField];
    }

    return {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        enabled: data.enabled !== false,
        trigger_type: triggerType || 'EVENT',
        trigger_config: normalizedTriggerConfig,
        channel: channel || 'SYSTEM',
        recipients: normalizedRecipients,
        message_template: data.message_template?.trim() || data.messageTemplate?.trim() || null,
        max_executions: normalizedMaxExecutions,
        expires_at: normalizedExpiresAt
    };
}

/**
 * Valida e normaliza o payload de atualização (parcial)
 */
export function validateUpdatePayload(data: any): Partial<CreateNotificationRuleDto> {
    if (!data || typeof data !== 'object') {
        throw new BadRequestException('Payload deve ser um objeto válido');
    }

    // Verificar campos proibidos
    const forbiddenUsed = FORBIDDEN_FIELDS.filter(field => field in data);
    if (forbiddenUsed.length > 0) {
        throw new BadRequestException(`Campos não permitidos: ${forbiddenUsed.join(', ')}`);
    }

    const result: Partial<CreateNotificationRuleDto> = {};

    // Validar título se fornecido
    if (data.title !== undefined) {
        if (typeof data.title !== 'string' || data.title.trim() === '') {
            throw new BadRequestException('title deve ser uma string não vazia');
        }
        result.title = data.title.trim();
    }

    // Validar trigger_type se fornecido
    if (data.trigger_type !== undefined || data.triggerType !== undefined) {
        const triggerType = data.trigger_type || data.triggerType;
        if (!ALLOWED_TRIGGER_TYPES.includes(triggerType)) {
            throw new BadRequestException(`trigger_type deve ser um dos: ${ALLOWED_TRIGGER_TYPES.join(', ')}`);
        }
        result.trigger_type = triggerType;
    }

    // Normalizar trigger_config se fornecido
    if (data.trigger_config !== undefined || data.triggerConfig !== undefined) {
        const triggerType = data.trigger_type || data.triggerType;
        const triggerConfig = data.trigger_config || data.triggerConfig;
        result.trigger_config = normalizeTriggerConfig(triggerType, triggerConfig);
    }

    // Validar channel se fornecido
    if (data.channel !== undefined) {
        if (!ALLOWED_CHANNELS.includes(data.channel)) {
            throw new BadRequestException(`channel deve ser um dos: ${ALLOWED_CHANNELS.join(', ')}`);
        }
        result.channel = data.channel;
    }

    // Validar recipients se fornecido
    if (data.recipients !== undefined) {
        if (data.recipients === null) {
            result.recipients = null;
        } else if (!Array.isArray(data.recipients)) {
            throw new BadRequestException('recipients deve ser um array');
        } else {
            result.recipients = data.recipients.map((r: any, index: number) => {
                if (!r.type || typeof r.type !== 'string') {
                    throw new BadRequestException(`recipient[${index}].type é obrigatório`);
                }
                return {
                    type: r.type,
                    identifier: r.identifier,
                    config: r.config
                };
            });
        }
    }

    // Campos simples
    if (data.description !== undefined) {
        result.description = data.description?.trim() || null;
    }
    if (data.enabled !== undefined) {
        result.enabled = Boolean(data.enabled);
    }
    if (data.message_template !== undefined) {
        result.message_template = data.message_template?.trim() || null;
    }

    // Validar max_executions
    if (data.max_executions !== undefined) {
        if (data.max_executions === null || data.max_executions === '') {
            result.max_executions = null;
        } else {
            const parsed = Number(data.max_executions);
            if (isNaN(parsed) || parsed < 0) {
                throw new BadRequestException('max_executions deve ser um número não negativo');
            }
            result.max_executions = parsed;
        }
    }

    // Validar expires_at
    if (data.expires_at !== undefined || data.expiresAt !== undefined || data.expiresIn !== undefined) {
        const expiresValue = data.expires_at || data.expiresAt || data.expiresIn;
        if (expiresValue === null || expiresValue === undefined || expiresValue === '') {
            result.expires_at = null;
        } else if (typeof expiresValue === 'string') {
            const parsed = Date.parse(expiresValue);
            if (isNaN(parsed)) {
                throw new BadRequestException('expires_at deve ser uma data válida');
            }
            result.expires_at = new Date(parsed).toISOString();
        } else {
            throw new BadRequestException('expires_at deve ser uma string de data');
        }
    }

    // Remover campos de UI se existirem
    const uiFields = ['isNew', 'isEditing', 'saving', 'loading', 'error'];
    for (const uiField of uiFields) {
        delete (result as any)[uiField];
    }

    return result;
}

/**
 * Normaliza trigger_config baseado no trigger_type
 */
function normalizeTriggerConfig(triggerType: string | undefined, triggerConfig: any): TriggerConfigDto {
    // Se não fornecido, retornar configuração padrão baseada no tipo
    if (!triggerConfig) {
        return getDefaultTriggerConfig(triggerType || 'EVENT');
    }

    // Se já for string, validar e retornar
    if (typeof triggerConfig === 'string') {
        try {
            const parsed = JSON.parse(triggerConfig);
            return { ...getDefaultTriggerConfig(triggerType || 'EVENT'), ...parsed };
        } catch {
            throw new BadRequestException('trigger_config deve ser um JSON válido');
        }
    }

    // Se for objeto, mesclar com padrões
    return { ...getDefaultTriggerConfig(triggerType || 'EVENT'), ...triggerConfig };
}

/**
 * Retorna configuração padrão baseada no tipo de trigger
 */
function getDefaultTriggerConfig(triggerType: string): TriggerConfigDto {
    switch (triggerType) {
        case 'EVENT':
            return {
                event_type: 'OS_STATUS_CHANGE',
                condition: {}
            };
        case 'SCHEDULE':
            return {
                frequency: { days: 0, hours: 0, minutes: 0, seconds: 0 }
            };
        case 'MANUAL':
            return {};
        default:
            return {};
    }
}

/**
 * Tratamento de erros do Prisma
 */
export function handlePrismaError(error: any, operation: string): never {
    const message = error.message || 'Erro desconhecido';

    // Registro não encontrado
    if (message.includes('not found') || message.includes('No record') || error.code === 'P2025') {
        throw new NotFoundException(`Regra de notificação não encontrada`);
    }

    // Violação de constraint única
    if (error.code === 'P2002') {
        throw new ConflictException('Já existe uma regra com este título');
    }

    // Erro de validação do PostgreSQL
    if (error.code === '22P02' || error.code === '22P03') {
        throw new BadRequestException('Formato de dados inválido');
    }

    // Erro de foreign key
    if (error.code === 'P2003') {
        throw new BadRequestException('Referência inválida');
    }

    // Erro genérico de constraint
    if (error.code === 'P0001') {
        throw new BadRequestException(message);
    }

    // Log do erro original para debug
    console.error(`NotificationRuleService - ${operation}:`, error);

    // Erro interno genérico
    throw new BadRequestException(`Falha ao processar ${operation}`);
}
