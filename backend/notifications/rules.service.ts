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
        const {
            title,
            description,
            enabled,
            triggerType,
            triggerConfig,
            channel,
            recipients,
            messageTemplate,
            maxExecutions,
            expiresAt
        } = data;

        const results = await this.prisma.$queryRawUnsafe(
            `INSERT INTO mod_ordem_servico_notif_rules (
                tenant_id, title, description, enabled, trigger_type, 
                trigger_config, channel, recipients, message_template, 
                max_executions, expires_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *`,
            tenantId, title, description, enabled ?? true, triggerType,
            JSON.stringify(triggerConfig), channel, JSON.stringify(recipients),
            messageTemplate, maxExecutions, expiresAt
        );

        return (results as any[])[0];
    }

    async update(tenantId: string, id: string, data: any) {
        // First verify existence
        await this.findOne(tenantId, id);

        const fields = [];
        const values = [];
        let placeholderIndex = 1;

        // Dynamic update builder for raw SQL
        const updatableFields = [
            'title', 'description', 'enabled', 'triggerType',
            'triggerConfig', 'channel', 'recipients', 'messageTemplate',
            'maxExecutions', 'expiresAt'
        ];

        values.push(tenantId, id);
        placeholderIndex = 3;

        for (const field of updatableFields) {
            if (data[field] !== undefined) {
                const dbField = field === 'triggerType' ? 'trigger_type' :
                    field === 'triggerConfig' ? 'trigger_config' :
                        field === 'messageTemplate' ? 'message_template' :
                            field === 'maxExecutions' ? 'max_executions' :
                                field === 'expiresAt' ? 'expires_at' : field;

                fields.push(`${dbField} = $${placeholderIndex++}`);
                values.push(
                    (field === 'triggerConfig' || field === 'recipients')
                        ? JSON.stringify(data[field])
                        : data[field]
                );
            }
        }

        if (fields.length === 0) return this.findOne(tenantId, id);

        fields.push(`updated_at = CURRENT_TIMESTAMP`);

        const query = `UPDATE mod_ordem_servico_notif_rules SET ${fields.join(', ')} 
                       WHERE tenant_id = $1 AND id = $2 RETURNING *`;

        const results = await this.prisma.$queryRawUnsafe(query, ...values);
        return (results as any[])[0];
    }

    async remove(tenantId: string, id: string) {
        await this.findOne(tenantId, id);
        await this.prisma.$queryRawUnsafe(
            `DELETE FROM mod_ordem_servico_notif_rules WHERE tenant_id = $1 AND id = $2`,
            tenantId,
            id
        );
        return { success: true };
    }
}
