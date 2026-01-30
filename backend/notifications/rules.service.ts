import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';

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

    async create(tenantId: string, data: any) {
        this.logger.log(`Creating rule for tenant ${tenantId}. Data payload keys: ${Object.keys(data).join(', ')}`);

        const title = data.title;
        const description = data.description;
        const enabled = data.enabled;
        const triggerType = data.triggerType || data.trigger_type;
        const triggerConfig = data.triggerConfig || data.trigger_config;
        const channel = data.channel;
        const recipients = data.recipients;
        const messageTemplate = data.messageTemplate || data.message_template;
        const maxExecutions = data.maxExecutions || data.max_executions;
        const expiresAt = data.expiresAt || data.expires_at;

        // Ensure JSON fields are strings if they aren't already, or Objects if Prisma handles it (for raw, stringify is safer provided it's not double)
        const outputConfig = typeof triggerConfig === 'string' ? triggerConfig : JSON.stringify(triggerConfig || {});
        const outputRecipients = typeof recipients === 'string' ? recipients : JSON.stringify(recipients || []);

        this.logger.log(`Parsed Values: triggerType=${triggerType}, config=${outputConfig}, recipients=${outputRecipients}`);

        try {
            const results = await this.prisma.$queryRawUnsafe(
                `INSERT INTO mod_ordem_servico_notif_rules (
                    tenant_id, title, description, enabled, trigger_type, 
                    trigger_config, channel, recipients, message_template, 
                    max_executions, expires_at
                ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8::jsonb, $9, $10, $11)
                RETURNING *`,
                tenantId, title, description, enabled ?? true, triggerType,
                outputConfig, channel, outputRecipients,
                messageTemplate, maxExecutions, expiresAt
            );
            return (results as any[])[0];
        } catch (error: any) {
            this.logger.error(`Failed to create notification rule: ${error.message}`, error.stack);
            throw error;
        }
    }

    async update(tenantId: string, id: string, data: any) {
        // First verify existence
        await this.findOne(tenantId, id);

        this.logger.log(`Updating rule ${id} for tenant ${tenantId}. Payload keys: ${Object.keys(data).join(', ')}`);

        const fields = [];
        const values = [];
        let placeholderIndex = 1;

        // Dynamic update builder for raw SQL
        const dbMapping: any = {
            title: 'title',
            description: 'description',
            enabled: 'enabled',
            triggerType: 'trigger_type',
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

        // Use a set to prevent duplicate column assignments
        const processedCols = new Set<string>();

        // Process keys
        for (const key of Object.keys(data)) {
            const dbField = dbMapping[key];

            // Skip if not mapped
            if (!dbField) continue;

            // Skip if this column was already added to the update sets (last one wins in map logic, but here we take first or last? iterating object keys order is reliable-ish but best to just take first or merge)
            // Actually, if we have duplicate keys (e.g. trigger_type and triggerType), we should probably pick one. 
            // In a loop, if we skip subsequent ones, we take the value of the first key encountered. 
            // If data has both, usually the intent is they are same.
            if (processedCols.has(dbField)) {
                this.logger.debug(`Skipping duplicate field update for ${dbField} (key: ${key})`);
                continue;
            }

            let value = data[key];

            // Handle JSON fields
            if (dbField === 'trigger_config' || dbField === 'recipients') {
                // If value is null/undefined, use empty defaults to avoid SQL errors if column non-nullable
                if (value === null || value === undefined) {
                    if (dbField === 'recipients') value = '[]';
                    else value = '{}';
                } else if (typeof value === 'string') {
                    // Already a string JSON, validate and use as-is
                    try {
                        JSON.parse(value);
                    } catch {
                        // If invalid JSON, stringify the original value
                        value = JSON.stringify(value);
                    }
                } else {
                    // It's an object, stringify it
                    value = JSON.stringify(value);
                }
            } else if (dbField === 'expires_at') {
                // Handle timestamp fields - convert to valid PostgreSQL timestamp or null
                if (value === null || value === undefined) {
                    value = null;
                } else if (typeof value === 'string') {
                    // Parse string to timestamp, if invalid keep as null
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
            this.logger.error(`Failed to update notification rule ${id}: ${error.message} \nQuery: ${query} \nValues: ${JSON.stringify(values)}`, error.stack);
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
