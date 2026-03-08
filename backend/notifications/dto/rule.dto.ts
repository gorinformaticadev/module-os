import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { CreateNotificationRuleDto } from './create-notification-rule.dto';
import { TriggerConfigDto } from './create-notification-rule.dto';

const FORBIDDEN_FIELDS = [
    'id',
    'current_executions',
    'last_execution_at',
    'created_at',
    'updated_at',
    'tenant_id',
];

const ALLOWED_TRIGGER_TYPES = ['EVENT', 'CONDITION', 'OFFSET', 'CRON', 'SCHEDULE', 'MANUAL'] as const;
const ALLOWED_CHANNELS = ['SYSTEM', 'EMAIL', 'WHATSAPP', 'SMS', 'PUSH'] as const;

export function validateCreatePayload(data: any): CreateNotificationRuleDto {
    if (!data || typeof data !== 'object') {
        throw new BadRequestException('Payload deve ser um objeto valido');
    }

    const forbiddenUsed = FORBIDDEN_FIELDS.filter((field) => field in data);
    if (forbiddenUsed.length > 0) {
        throw new BadRequestException(`Campos nao permitidos: ${forbiddenUsed.join(', ')}`);
    }

    if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
        throw new BadRequestException('title e obrigatorio');
    }

    const triggerType = data.trigger_type || data.triggerType;
    if (triggerType && !ALLOWED_TRIGGER_TYPES.includes(triggerType)) {
        throw new BadRequestException(`trigger_type deve ser um dos: ${ALLOWED_TRIGGER_TYPES.join(', ')}`);
    }

    const channel = data.channel || data.channel;
    if (channel && !ALLOWED_CHANNELS.includes(channel)) {
        throw new BadRequestException(`channel deve ser um dos: ${ALLOWED_CHANNELS.join(', ')}`);
    }

    const normalizedTriggerConfig = normalizeTriggerConfig(triggerType, data.trigger_config || data.triggerConfig);

    let normalizedRecipients: any[] | null | undefined;
    if (data.recipients) {
        if (!Array.isArray(data.recipients)) {
            throw new BadRequestException('recipients deve ser um array');
        }
        normalizedRecipients = data.recipients.map((r: any, index: number) => {
            if (!r.type || typeof r.type !== 'string') {
                throw new BadRequestException(`recipient[${index}].type e obrigatorio`);
            }
            return {
                type: r.type,
                identifier: r.identifier,
                config: r.config,
            };
        });
    }

    let normalizedExpiresAt: string | null | undefined;
    if (data.expires_at || data.expiresAt || data.expiresIn) {
        const expiresValue = data.expires_at || data.expiresAt || data.expiresIn;
        if (expiresValue === null || expiresValue === undefined || expiresValue === '') {
            normalizedExpiresAt = null;
        } else if (typeof expiresValue === 'string') {
            const parsed = Date.parse(expiresValue);
            if (isNaN(parsed)) {
                throw new BadRequestException('expires_at deve ser uma data valida');
            }
            normalizedExpiresAt = new Date(parsed).toISOString();
        } else {
            throw new BadRequestException('expires_at deve ser uma string de data');
        }
    }

    let normalizedMaxExecutions: number | null | undefined;
    if (data.max_executions !== undefined) {
        if (data.max_executions === null || data.max_executions === '') {
            normalizedMaxExecutions = null;
        } else {
            const parsed = Number(data.max_executions);
            if (isNaN(parsed) || parsed < 0) {
                throw new BadRequestException('max_executions deve ser um numero nao negativo');
            }
            normalizedMaxExecutions = parsed;
        }
    }

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
        expires_at: normalizedExpiresAt,
    };
}

export function validateUpdatePayload(data: any): Partial<CreateNotificationRuleDto> {
    if (!data || typeof data !== 'object') {
        throw new BadRequestException('Payload deve ser um objeto valido');
    }

    const result: Partial<CreateNotificationRuleDto> = {};

    if (data.title !== undefined) {
        if (typeof data.title !== 'string' || data.title.trim() === '') {
            throw new BadRequestException('title deve ser uma string nao vazia');
        }
        result.title = data.title.trim();
    }

    if (data.trigger_type !== undefined || data.triggerType !== undefined) {
        const triggerType = data.trigger_type || data.triggerType;
        if (!ALLOWED_TRIGGER_TYPES.includes(triggerType)) {
            throw new BadRequestException(`trigger_type deve ser um dos: ${ALLOWED_TRIGGER_TYPES.join(', ')}`);
        }
        result.trigger_type = triggerType;
    }

    if (data.trigger_config !== undefined || data.triggerConfig !== undefined) {
        const triggerType = data.trigger_type || data.triggerType;
        const triggerConfig = data.trigger_config || data.triggerConfig;
        result.trigger_config = normalizeTriggerConfig(triggerType, triggerConfig);
    }

    if (data.channel !== undefined) {
        if (!ALLOWED_CHANNELS.includes(data.channel)) {
            throw new BadRequestException(`channel deve ser um dos: ${ALLOWED_CHANNELS.join(', ')}`);
        }
        result.channel = data.channel;
    }

    if (data.recipients !== undefined) {
        if (data.recipients === null) {
            result.recipients = null;
        } else if (!Array.isArray(data.recipients)) {
            throw new BadRequestException('recipients deve ser um array');
        } else {
            result.recipients = data.recipients.map((r: any, index: number) => {
                if (!r.type || typeof r.type !== 'string') {
                    throw new BadRequestException(`recipient[${index}].type e obrigatorio`);
                }
                return {
                    type: r.type,
                    identifier: r.identifier,
                    config: r.config,
                };
            });
        }
    }

    if (data.description !== undefined) {
        result.description = data.description?.trim() || null;
    }
    if (data.enabled !== undefined) {
        result.enabled = Boolean(data.enabled);
    }
    if (data.message_template !== undefined) {
        result.message_template = data.message_template?.trim() || null;
    }

    if (data.max_executions !== undefined) {
        if (data.max_executions === null || data.max_executions === '') {
            result.max_executions = null;
        } else {
            const parsed = Number(data.max_executions);
            if (isNaN(parsed) || parsed < 0) {
                throw new BadRequestException('max_executions deve ser um numero nao negativo');
            }
            result.max_executions = parsed;
        }
    }

    if (data.expires_at !== undefined || data.expiresAt !== undefined || data.expiresIn !== undefined) {
        const expiresValue = data.expires_at || data.expiresAt || data.expiresIn;
        if (expiresValue === null || expiresValue === undefined || expiresValue === '') {
            result.expires_at = null;
        } else if (typeof expiresValue === 'string') {
            const parsed = Date.parse(expiresValue);
            if (isNaN(parsed)) {
                throw new BadRequestException('expires_at deve ser uma data valida');
            }
            result.expires_at = new Date(parsed).toISOString();
        } else {
            throw new BadRequestException('expires_at deve ser uma string de data');
        }
    }

    const uiFields = ['isNew', 'isEditing', 'saving', 'loading', 'error'];
    for (const uiField of uiFields) {
        delete (result as any)[uiField];
    }

    return result;
}

function normalizeTriggerConfig(triggerType: string | undefined, triggerConfig: any): TriggerConfigDto {
    if (!triggerConfig) {
        return getDefaultTriggerConfig(triggerType || 'EVENT');
    }

    if (typeof triggerConfig === 'string') {
        try {
            const parsed = JSON.parse(triggerConfig);
            return { ...getDefaultTriggerConfig(triggerType || 'EVENT'), ...parsed };
        } catch {
            throw new BadRequestException('trigger_config deve ser um JSON valido');
        }
    }

    return { ...getDefaultTriggerConfig(triggerType || 'EVENT'), ...triggerConfig };
}

function getDefaultTriggerConfig(triggerType: string): TriggerConfigDto {
    switch (triggerType) {
        case 'EVENT':
            return {
                event_type: 'OS_STATUS_CHANGE',
                condition: {},
            };
        case 'CONDITION':
            return {
                condition: 'OVERDUE',
                frequency: { days: 0, hours: 1, minutes: 0, seconds: 0 },
            };
        case 'OFFSET':
            return {
                reference: 'BEFORE_DEADLINE',
                offset_duration: { days: 0, hours: 24, minutes: 0, seconds: 0 },
            };
        case 'SCHEDULE':
        case 'CRON':
            return {
                cron_expression: '0 9 * * *',
            };
        case 'MANUAL':
            return {};
        default:
            return {};
    }
}

export function handlePrismaError(error: any, operation: string): never {
    const message = error.message || 'Erro desconhecido';

    if (message.includes('not found') || message.includes('No record') || error.code === 'P2025') {
        throw new NotFoundException('Regra de notificacao nao encontrada');
    }

    if (error.code === 'P2002') {
        throw new ConflictException('Ja existe uma regra com este titulo');
    }

    if (error.code === '22P02' || error.code === '22P03') {
        throw new BadRequestException('Formato de dados invalido');
    }

    if (error.code === 'P2003') {
        throw new BadRequestException('Referencia invalida');
    }

    if (error.code === 'P0001') {
        throw new BadRequestException(message);
    }

    console.error(`NotificationRuleService - ${operation}:`, error);
    throw new BadRequestException(`Falha ao processar ${operation}`);
}
