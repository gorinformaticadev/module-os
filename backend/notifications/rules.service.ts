import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateNotificationRuleDto } from './dto/create-notification-rule.dto';

@Injectable()
export class NotificationRuleService {
    private readonly logger = new Logger(NotificationRuleService.name);

    constructor(private readonly prisma: PrismaService) { }

    async findAll(tenantId: string) {
        return this.prisma.$queryRawUnsafe(
            `SELECT * FROM mod_ordem_servico_notif_rules WHERE tenant_id = $1 ORDER BY created_at DESC`,
            tenantId
        );
    }

    async findOne(tenantId: string, id: string) {
        const rules: any[] = await this.prisma.$queryRawUnsafe(
            `SELECT * FROM mod_ordem_servico_notif_rules WHERE tenant_id = $1 AND id = $2`,
            tenantId,
            id
        );

        if (!rules || rules.length === 0) {
            throw new NotFoundException(`Regra de notificação ${id} não encontrada`);
        }

        return rules[0];
    }

    async create(tenantId: string, data: CreateNotificationRuleDto) {
        this.logger.log(`Creating rule for tenant ${tenantId}. Data: ${JSON.stringify(data)}`);

        try {
            // Converter objetos para JSON strings para o PostgreSQL
            const triggerConfigJson = data.trigger_config
                ? JSON.stringify(data.trigger_config)
                : '{}';

            const recipientsJson = data.recipients
                ? JSON.stringify(data.recipients)
                : '[]';

            const results = await this.prisma.$queryRawUnsafe(
                `INSERT INTO mod_ordem_servico_notif_rules (
                    tenant_id, title, description, enabled, trigger_type, 
                    trigger_config, channel, recipients, message_template, 
                    max_executions, expires_at
                ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8::jsonb, $9, $10, $11)
                RETURNING *`,
                tenantId,
                data.title,
                data.description,
                data.enabled ?? true,
                data.trigger_type || 'EVENT',
                triggerConfigJson,
                data.channel || 'SYSTEM',
                recipientsJson,
                data.message_template,
                data.max_executions,
                data.expires_at
            );
            return (results as any[])[0];
        } catch (error: any) {
            this.logger.error(`Failed to create notification rule: ${error.message}`, error.stack);
            throw error;
        }
    }

    async update(tenantId: string, id: string, data: Partial<CreateNotificationRuleDto>) {
        // First verify existence
        await this.findOne(tenantId, id);

        this.logger.log(`Updating rule ${id} for tenant ${tenantId}. Data: ${JSON.stringify(data)}`);

        if (!data || Object.keys(data).length === 0) {
            return this.findOne(tenantId, id);
        }

        const fields = [];
        const values = [];
        let placeholderIndex = 1;

        // Mapeamento de campos do DTO para campos do banco
        const dbMapping: Record<string, string> = {
            title: 'title',
            description: 'description',
            enabled: 'enabled',
            trigger_type: 'trigger_type',
            triggerConfig: 'trigger_config',
            trigger_config: 'trigger_config',
            channel: 'channel',
            recipients: 'recipients',
            messageTemplate: 'message_template',
            message_template: 'message_template',
            maxExecutions: 'max_executions',
            max_executions: 'max_executions',
            expiresAt: 'expires_at',
            expires_at: 'expires_at',
            expiresIn: 'expires_at',
            expires_in: 'expires_at'
        };

        values.push(tenantId, id);
        placeholderIndex = 3;

        // Usar set para prevenir duplicatas
        const processedCols = new Set<string>();

        // Processar chaves do payload validado
        for (const key of Object.keys(data)) {
            const dbField = dbMapping[key];

            // Pular se não mapeado
            if (!dbField) continue;

            // Pular se já processado
            if (processedCols.has(dbField)) {
                this.logger.debug(`Skipping duplicate field: ${dbField}`);
                continue;
            }

            let value = (data as any)[key];

            // Tratar campos JSON
            if (dbField === 'trigger_config' || dbField === 'recipients') {
                if (value === null || value === undefined) {
                    value = dbField === 'recipients' ? '[]' : '{}';
                } else if (typeof value === 'string') {
                    // Já é string JSON, usar diretamente após validar
                    try {
                        JSON.parse(value);
                    } catch {
                        // Se inválido, stringify o valor original
                        value = JSON.stringify(value);
                    }
                } else {
                    value = JSON.stringify(value);
                }
            }
            // Tratar timestamp
            else if (dbField === 'expires_at') {
                if (value === null || value === undefined) {
                    value = null;
                } else if (typeof value === 'string') {
                    const parsed = Date.parse(value);
                    value = isNaN(parsed) ? null : new Date(parsed);
                }
            }

            fields.push(`${dbField} = $${placeholderIndex++}`);
            values.push(value);
            processedCols.add(dbField);
        }

        if (fields.length === 0) return this.findOne(tenantId, id);

        fields.push(`updated_at = CURRENT_TIMESTAMP`);

        const query = `UPDATE mod_ordem_servico_notif_rules SET ${fields.join(', ')} 
                       WHERE tenant_id = $1 AND id = $2 RETURNING *`;

        try {
            const results = await this.prisma.$queryRawUnsafe(query, ...values);
            return (results as any[])[0];
        } catch (error: any) {
            this.logger.error(`Failed to update notification rule ${id}: ${error.message}`, error.stack);
            throw error;
        }
    }

    async remove(tenantId: string, id: string) {
        await this.findOne(tenantId, id);
        try {
            await this.prisma.$queryRawUnsafe(
                `DELETE FROM mod_ordem_servico_notif_rules WHERE tenant_id = $1 AND id = $2`,
                tenantId,
                id
            );
            return { success: true };
        } catch (error: any) {
            this.logger.error(`Failed to delete rule ${id}: ${error.message}`, error.stack);
            throw error;
        }
    }
}
