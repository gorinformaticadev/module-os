import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { NotificationDispatcherService } from './dispatcher.service';
import { NotificationRuleService } from './rules.service';
import { NotificationStateService } from './state.service';
import { CronService } from '../../../core/cron/cron.service';

@Injectable()
export class NotificationSchedulerService implements OnModuleInit {
    private readonly logger = new Logger(NotificationSchedulerService.name);
    private isProcessing = false;

    constructor(
        private readonly prisma: PrismaService,
        private readonly rules: NotificationRuleService,
        private readonly dispatcher: NotificationDispatcherService,
        private readonly states: NotificationStateService,
        private readonly cronService: CronService
    ) { }

    async onModuleInit() {
        this.logger.log('Registrando Notification Worker no Core...');
        try {
            await this.cronService.register(
                'ordem_servico.notification_worker',
                '* * * * *',
                () => this.handleCron(),
                {
                    name: 'Ordem de Servico: Worker de Notificacoes',
                    description: 'Busca OSs atrasadas ou que atingiram prazos configurados e realiza os disparos automaticos.',
                    settingsUrl: '/modules/ordem_servico/pages/configuracoes',
                }
            );
        } catch (e) {
            this.logger.error('Falha ao registrar worker no CronService:', e);
        }
    }

    async handleCron() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            const activeRules: any[] = await this.prisma.$queryRawUnsafe(
                `SELECT * FROM mod_ordem_servico_notif_rules
                 WHERE enabled = true
                 AND (trigger_type = 'CRON' OR trigger_type = 'CONDITION' OR trigger_type = 'OFFSET')
                 AND (next_execution_at IS NULL OR next_execution_at <= CURRENT_TIMESTAMP)
                 AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
                 AND (max_executions IS NULL OR current_executions < max_executions)`
            );

            for (const rule of activeRules) {
                await this.processRule(rule);
            }
        } catch (error: any) {
            this.logger.error(`Worker error: ${error.message}`);
        } finally {
            this.isProcessing = false;
        }
    }

    private async processRule(rule: any) {
        if (rule.trigger_type === 'CONDITION') {
            await this.processConditionRule(rule);
        } else if (rule.trigger_type === 'CRON') {
            return;
        } else if (rule.trigger_type === 'OFFSET') {
            await this.processOffsetRule(rule);
        }
    }

    private formatInterval(duration: any): string {
        if (!duration) return '0 minutes';
        if (duration.value && duration.unit) {
            return `${duration.value} ${duration.unit}`;
        }
        const parts = [];
        if (duration.days) parts.push(`${duration.days} days`);
        if (duration.hours) parts.push(`${duration.hours} hours`);
        if (duration.minutes) parts.push(`${duration.minutes} minutes`);
        if (duration.seconds) parts.push(`${duration.seconds} seconds`);

        return parts.length > 0 ? parts.join(' ') : '0 minutes';
    }

    private async processOffsetRule(rule: any) {
        const config = typeof rule.trigger_config === 'string' ? JSON.parse(rule.trigger_config) : rule.trigger_config;

        if (config.reference === 'BEFORE_DEADLINE' || config.reference === 'AFTER_DEADLINE') {
            await this.processRelativeDeadline(rule, config);
        }
    }

    private async processRelativeDeadline(rule: any, config: any) {
        const intervalStr = this.formatInterval(config.offset_duration || { value: config.value, unit: config.unit });
        const operator = config.reference === 'BEFORE_DEADLINE' ? '-' : '+';
        const comparison = config.reference === 'BEFORE_DEADLINE' ? '<=' : '>=';

        const query = `
            SELECT os.* FROM "mod_ordem_servico_ordens" os
            WHERE os.tenant_id = $1
            AND os.status NOT IN (3, 4, 6)
            AND os.data_previsao IS NOT NULL
            AND os.data_previsao ${operator} INTERVAL '${intervalStr}' ${comparison} CURRENT_TIMESTAMP
        `;

        const targetOrders: any[] = await this.prisma.$queryRawUnsafe(query, rule.tenant_id);

        for (const os of targetOrders) {
            const fingerprint = `offset-${rule.id}-${os.id}`;
            const alreadySent = await this.states.getState(rule.tenant_id, rule.id, os.id);

            if (!alreadySent) {
                const success = await this.dispatchNotification(rule, os, fingerprint);
                if (success) {
                    await this.states.saveState({
                        tenantId: rule.tenant_id,
                        ruleId: rule.id,
                        ordemServicoId: os.id,
                        lastState: { notified_at: new Date() },
                    });
                }
            }
        }
    }

    private async processConditionRule(rule: any) {
        const config = typeof rule.trigger_config === 'string' ? JSON.parse(rule.trigger_config) : rule.trigger_config;

        if (config.condition === 'OVERDUE') {
            await this.processOverdueOS(rule, config);
        }
    }

    private async dispatchNotification(rule: any, os: any, fingerprint: string): Promise<boolean> {
        const config = typeof rule.trigger_config === 'string' ? JSON.parse(rule.trigger_config) : rule.trigger_config;

        if (config.silence_window?.start && config.silence_window?.end) {
            const now = new Date();
            const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

            const [startH, startM] = config.silence_window.start.split(':').map(Number);
            const [endH, endM] = config.silence_window.end.split(':').map(Number);

            const startTotal = startH * 60 + startM;
            const endTotal = endH * 60 + endM;

            const isSilenced = startTotal <= endTotal
                ? (currentTotalMinutes >= startTotal && currentTotalMinutes <= endTotal)
                : (currentTotalMinutes >= startTotal || currentTotalMinutes <= endTotal);

            if (isSilenced) {
                this.logger.log(`Regra [${rule.title}] silenciada pela Janela de Silencio`);
                return false;
            }
        }

        const recipientsList = await this.resolveRecipients(os, rule.recipients, rule.channel, rule.tenant_id);
        let atLeastOneSuccess = false;

        for (const recipient of recipientsList) {
            const result = await this.dispatcher.dispatch({
                tenantId: rule.tenant_id,
                ruleId: rule.id,
                ordemServicoId: os.id,
                channel: rule.channel,
                recipient,
                content: this.formatMessage(rule.message_template, os),
                fingerprint: `${fingerprint}-${recipient}`,
            });
            if (result.success) {
                atLeastOneSuccess = true;
            }
        }

        if (atLeastOneSuccess) {
            await this.prisma.$queryRawUnsafe(
                `UPDATE mod_ordem_servico_notif_rules SET current_executions = current_executions + 1, last_execution_at = CURRENT_TIMESTAMP WHERE id = $1`,
                rule.id
            );
        }

        return atLeastOneSuccess;
    }

    private async processOverdueOS(rule: any, config: any) {
        const overdueOrders: any[] = await this.prisma.$queryRawUnsafe(
            `SELECT os.* FROM "mod_ordem_servico_ordens" os
             WHERE os.tenant_id = $1
             AND os.status NOT IN (3, 4, 6)
             AND os.data_previsao < CURRENT_TIMESTAMP`,
            rule.tenant_id
        );

        for (const os of overdueOrders) {
            const state = await this.states.getState(rule.tenant_id, rule.id, os.id);
            const lastNotifiedAt = state?.updated_at ? new Date(state.updated_at) : null;

            let shouldNotify = false;

            if (!state) {
                shouldNotify = true;
            } else if (config.frequency) {
                const ms = ((config.frequency.days || 0) * 86400 + (config.frequency.hours || 0) * 3600 + (config.frequency.minutes || 0) * 60 + (config.frequency.seconds || 0)) * 1000;

                if (ms > 0 && lastNotifiedAt) {
                    if (new Date().getTime() >= lastNotifiedAt.getTime() + ms) {
                        shouldNotify = true;
                    }
                }
            }

            if (shouldNotify) {
                this.logger.log(`Processando OS Atrasada: ${os.id}`);
                const success = await this.dispatchNotification(rule, os, `overdue-${os.id}-${Date.now()}`);

                if (success) {
                    await this.states.saveState({
                        tenantId: rule.tenant_id,
                        ruleId: rule.id,
                        ordemServicoId: os.id,
                        lastState: { status: os.status, notified_at: new Date() },
                    });
                }
            }
        }
    }

    private async resolveRecipients(os: any, recipients: any, channel: string, tenantId: string): Promise<string[]> {
        const config = typeof recipients === 'string' ? JSON.parse(recipients) : recipients;
        if (!Array.isArray(config)) return [];

        const targets = new Set<string>();
        const internalDelivery = this.usesInternalDelivery(channel);

        for (const recipient of config) {
            switch (recipient.type) {
                case 'CLIENT':
                    await this.appendClientTargets(targets, os, tenantId, internalDelivery);
                    break;
                case 'TECHNICIAN':
                    await this.appendTechnicianTargets(targets, os, tenantId, internalDelivery);
                    break;
                case 'ADMIN':
                    await this.appendTenantRoleTargets(targets, tenantId, ['ADMIN'], internalDelivery);
                    break;
                case 'SUPER_ADMIN':
                    await this.appendTenantRoleTargets(targets, tenantId, ['SUPER_ADMIN'], internalDelivery, true);
                    break;
                case 'CUSTOM':
                    await this.appendCustomTargets(targets, recipient, tenantId, internalDelivery);
                    break;
            }
        }

        return Array.from(targets);
    }

    private usesInternalDelivery(channel: string): boolean {
        const normalizedChannel = String(channel || '').toUpperCase();
        return normalizedChannel === 'SYSTEM' || normalizedChannel === 'PUSH';
    }

    private async appendClientTargets(targets: Set<string>, os: any, tenantId: string, internalDelivery: boolean) {
        let clientEmail = os.cliente_email;

        if (!clientEmail && os.cliente_id) {
            const client = await this.prisma.$queryRawUnsafe<any[]>(
                `SELECT email FROM mod_ordem_servico_clients WHERE id = $1::uuid AND tenant_id = $2`,
                os.cliente_id,
                tenantId
            );
            clientEmail = client[0]?.email;
        }

        if (!clientEmail) {
            return;
        }

        if (internalDelivery) {
            const userId = await this.resolveUserIdByEmail(clientEmail, tenantId);
            if (userId) {
                targets.add(userId);
            }
            return;
        }

        targets.add(clientEmail);
    }

    private async appendTechnicianTargets(targets: Set<string>, os: any, tenantId: string, internalDelivery: boolean) {
        if (!os.usuario_responsavel_id) {
            return;
        }

        const user = await this.prisma.user.findFirst({
            where: {
                id: os.usuario_responsavel_id,
                isLocked: false,
                OR: [
                    { tenantId },
                    { role: 'SUPER_ADMIN' },
                ],
            },
            select: { id: true, email: true },
        });

        if (!user) {
            return;
        }

        if (internalDelivery) {
            targets.add(user.id);
        } else if (user.email) {
            targets.add(user.email);
        }
    }

    private async appendTenantRoleTargets(
        targets: Set<string>,
        tenantId: string,
        roles: string[],
        internalDelivery: boolean,
        global = false
    ) {
        const users = await this.prisma.user.findMany({
            where: global
                ? {
                    role: { in: roles as any },
                    isLocked: false,
                }
                : {
                    tenantId,
                    role: { in: roles as any },
                    isLocked: false,
                },
            select: { id: true, email: true },
        });

        for (const user of users) {
            if (internalDelivery) {
                targets.add(user.id);
            } else if (user.email) {
                targets.add(user.email);
            }
        }
    }

    private async appendCustomTargets(targets: Set<string>, recipient: any, tenantId: string, internalDelivery: boolean) {
        const rawRecipient = String(
            recipient?.value ?? recipient?.identifier ?? recipient?.config?.value ?? ''
        ).trim();

        if (!rawRecipient) {
            return;
        }

        if (!internalDelivery) {
            targets.add(rawRecipient);
            return;
        }

        const userId = rawRecipient.includes('@')
            ? await this.resolveUserIdByEmail(rawRecipient, tenantId, true)
            : await this.resolveExplicitUserId(rawRecipient, tenantId, true);

        if (userId) {
            targets.add(userId);
        }
    }

    private async resolveUserIdByEmail(email: string, tenantId: string, allowSuperAdmin = false): Promise<string | null> {
        const user = await this.prisma.user.findFirst({
            where: allowSuperAdmin
                ? {
                    email,
                    isLocked: false,
                    OR: [
                        { tenantId },
                        { role: 'SUPER_ADMIN' },
                    ],
                }
                : {
                    email,
                    tenantId,
                    isLocked: false,
                },
            select: { id: true },
        });

        return user?.id ?? null;
    }

    private async resolveExplicitUserId(userId: string, tenantId: string, allowSuperAdmin = false): Promise<string | null> {
        const user = await this.prisma.user.findFirst({
            where: allowSuperAdmin
                ? {
                    id: userId,
                    isLocked: false,
                    OR: [
                        { tenantId },
                        { role: 'SUPER_ADMIN' },
                    ],
                }
                : {
                    id: userId,
                    tenantId,
                    isLocked: false,
                },
            select: { id: true },
        });

        return user?.id ?? null;
    }

    private formatMessage(template: string, os: any): string {
        let msg = template;
        const map: any = {
            '{{id}}': os.id,
            '{{numero}}': os.numero || os.id.split('-')[0],
            '{{cliente}}': os.cliente_nome || 'Cliente',
            '{{status}}': os.status,
            '{{data_previsao}}': os.data_previsao ? new Date(os.data_previsao).toLocaleDateString() : 'N/A',
        };

        for (const key in map) {
            msg = msg.replace(new RegExp(key, 'g'), map[key]);
        }
        return msg;
    }
}
