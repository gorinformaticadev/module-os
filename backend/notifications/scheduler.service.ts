import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
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
                    name: 'Ordem de Serviço: Worker de Notificações',
                    description: 'Busca OSs atrasadas ou que atingiram prazos configurados e realiza os disparos automáticos.',
                    settingsUrl: '/modules/ordem_servico/pages/configuracoes'
                }
            );
        } catch (e) {
            this.logger.error('Falha ao registrar worker no CronService:', e);
        }
    }

    @Cron(CronExpression.EVERY_MINUTE)
    async handleCron() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            // this.logger.log('Starting OS Notification Worker...');

            // 1. Get all active CRON/CONDITION rules
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
            // Basic CRON
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
                        lastState: { notified_at: new Date() }
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

        // Silence Window Check
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
                this.logger.log(`Regra [${rule.title}] silenciada pela Janela de Silêncio`);
                return false;
            }
        }

        const recipientsList = await this.resolveRecipients(os, rule.recipients);
        let atLeastOneSuccess = false;

        for (const recipient of recipientsList) {
            const result = await this.dispatcher.dispatch({
                tenantId: rule.tenant_id,
                ruleId: rule.id,
                ordemServicoId: os.id,
                channel: rule.channel,
                recipient,
                content: this.formatMessage(rule.message_template, os),
                fingerprint: `${fingerprint}-${recipient}`
            });
            if (result.success) atLeastOneSuccess = true;
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
                        lastState: { status: os.status, notified_at: new Date() }
                    });
                }
            }
        }
    }

    private async resolveRecipients(os: any, recipients: any): Promise<string[]> {
        const config = typeof recipients === 'string' ? JSON.parse(recipients) : recipients;
        if (!Array.isArray(config)) return [];

        const targets: string[] = [];
        for (const r of config) {
            if (r.type === 'CLIENT') {
                if (os.cliente_email) targets.push(os.cliente_email);
                else {
                    // Busca profunda no banco se necessário
                    const client = await this.prisma.$queryRawUnsafe<any[]>(
                        `SELECT email FROM mod_ordem_servico_clients WHERE id = $1`, os.cliente_id
                    );
                    if (client[0]?.email) targets.push(client[0].email);
                }
            } else if (r.type === 'TECHNICIAN' && os.usuario_responsavel_id) {
                const user = await this.prisma.user.findUnique({ where: { id: os.usuario_responsavel_id }, select: { email: true, id: true } });
                if (user?.email) targets.push(user.email);
            } else if (r.type === 'CUSTOM' && r.value) {
                targets.push(r.value);
            }
        }
        return targets;
    }

    private formatMessage(template: string, os: any): string {
        let msg = template;
        const map: any = {
            '{{id}}': os.id,
            '{{numero}}': os.numero || os.id.split('-')[0],
            '{{cliente}}': os.cliente_nome || 'Cliente',
            '{{status}}': os.status,
            '{{data_previsao}}': os.data_previsao ? new Date(os.data_previsao).toLocaleDateString() : 'N/A'
        };

        for (const key in map) {
            msg = msg.replace(new RegExp(key, 'g'), map[key]);
        }
        return msg;
    }
}
