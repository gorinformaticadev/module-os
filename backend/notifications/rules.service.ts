import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ModuleOsPrismaService } from '../prisma/module-os-prisma.service';
import { CreateNotificationRuleDto } from './dto/create-notification-rule.dto';

@Injectable()
export class NotificationRuleService {
    // tenantId e aplicado pelo ALS + ModuleOsPrismaService.
    private readonly logger = new Logger(NotificationRuleService.name);

    constructor(private readonly modulePrisma: ModuleOsPrismaService) { }

    async findAll() {
        return this.modulePrisma.mod_ordem_servico_notif_rules.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const rule = await this.modulePrisma.mod_ordem_servico_notif_rules.findFirst({
            where: { id },
        });

        if (!rule) {
            throw new NotFoundException(`Regra de notificacao ${id} nao encontrada`);
        }

        return rule;
    }

    async create(data: CreateNotificationRuleDto) {
        this.logger.log(`Creating notification rule. Data: ${JSON.stringify(data)}`);

        return this.modulePrisma.mod_ordem_servico_notif_rules.create({
            data: {
                title: data.title,
                description: data.description,
                enabled: data.enabled ?? true,
                triggerType: data.trigger_type || 'EVENT',
                triggerConfig: data.trigger_config || {},
                channel: data.channel || 'SYSTEM',
                recipients: data.recipients || [],
                messageTemplate: data.message_template,
                maxExecutions: data.max_executions ?? null,
                expiresAt: this.normalizeDate(data.expires_at),
            },
        });
    }

    async update(id: string, data: Partial<CreateNotificationRuleDto>) {
        await this.findOne(id);

        if (!data || Object.keys(data).length === 0) {
            return this.findOne(id);
        }

        const payload: Record<string, unknown> = {
            updatedAt: new Date(),
        };

        if ('title' in data) payload.title = data.title ?? null;
        if ('description' in data) payload.description = data.description ?? null;
        if ('enabled' in data) payload.enabled = data.enabled ?? true;
        if ('trigger_type' in data) payload.triggerType = data.trigger_type;
        if ('channel' in data) payload.channel = data.channel;
        if ('message_template' in data) payload.messageTemplate = data.message_template;
        if ('max_executions' in data) payload.maxExecutions = data.max_executions ?? null;
        if ('expires_at' in data || 'expiresAt' in (data as any)) {
            payload.expiresAt = this.normalizeDate((data as any).expires_at ?? (data as any).expiresAt);
        }
        if ('trigger_config' in data || 'triggerConfig' in (data as any)) {
            payload.triggerConfig = (data as any).trigger_config ?? (data as any).triggerConfig ?? {};
        }
        if ('recipients' in data) {
            payload.recipients = data.recipients ?? [];
        }

        await this.modulePrisma.mod_ordem_servico_notif_rules.updateMany({
            where: { id },
            data: payload,
        });

        return this.findOne(id);
    }

    async remove(id: string) {
        await this.findOne(id);
        await this.modulePrisma.mod_ordem_servico_notif_rules.deleteMany({
            where: { id },
        });
        return { success: true };
    }

    private normalizeDate(value: unknown): Date | null {
        if (!value) {
            return null;
        }

        const parsed = value instanceof Date ? value : new Date(String(value));
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
}
