import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { NotificationDispatcherService } from './dispatcher.service';
import { NotificationRuleService } from './rules.service';
import { NotificationStateService } from './state.service';

@Injectable()
export class NotificationSchedulerService {
    private readonly logger = new Logger(NotificationSchedulerService.name);
    private isProcessing = false;

    constructor(
        private readonly prisma: PrismaService,
        private readonly rules: NotificationRuleService,
        private readonly dispatcher: NotificationDispatcherService,
        private readonly states: NotificationStateService
    ) { }

    @Cron(CronExpression.EVERY_MINUTE)
    async handleCron() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            this.logger.log('Starting OS Notification Worker...');

            // 1. Get all active CRON/CONDITION rules
            const activeRules: any[] = await this.prisma.$queryRawUnsafe(
                `SELECT * FROM mod_ordem_servico_notif_rules 
                 WHERE enabled = true 
                 AND (trigger_type = 'CRON' OR trigger_type = 'CONDITION')
                 AND (next_execution_at IS NULL OR next_execution_at <= CURRENT_TIMESTAMP)
                 AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`
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
        this.logger.log(`Processing rule: ${rule.title} (${rule.id})`);

        if (rule.trigger_type === 'CONDITION') {
            await this.processConditionRule(rule);
        } else if (rule.trigger_type === 'CRON') {
            // Basic CRON - not detailed here yet as focus is OS Fora do Prazo (Condition)
        }
    }

    private async processConditionRule(rule: any) {
        const config = typeof rule.trigger_config === 'string' ? JSON.parse(rule.trigger_config) : rule.trigger_config;

        if (config.condition === 'OVERDUE') {
            await this.processOverdueOS(rule, config);
        }
    }

    private async processOverdueOS(rule: any, config: any) {
        // Encontrar OS atrasadas que ainda não atingiram o limite desta regra
        const overdueOrders: any[] = await this.prisma.$queryRawUnsafe(
            `SELECT os.* FROM "OrdensService" os
             WHERE os."tenantId" = $1
             AND os.status NOT IN ('CONCLUIDO', 'CANCELADO')
             AND os.data_prevista < CURRENT_TIMESTAMP`,
            rule.tenant_id
        );

        for (const os of overdueOrders) {
            const state = await this.states.getState(rule.tenant_id, rule.id, os.id);
            const lastState = state?.last_state || {};

            // Verifica se houve mudança subjetiva (data mudou ou status mudou) ou se é a primeira vez
            const hasChanged = JSON.stringify({ status: os.status, data_prevista: os.data_prevista }) !== JSON.stringify(lastState);
            const shouldNotify = !state || hasChanged; // Simplificação para o MVP

            if (shouldNotify) {
                this.logger.log(`OS Atrasada detectada: ${os.id}. Notificando...`);

                await this.dispatcher.dispatch({
                    tenantId: rule.tenant_id,
                    ruleId: rule.id,
                    ordemServicoId: os.id,
                    channel: rule.channel,
                    recipient: this.resolveRecipient(os, rule.recipients),
                    content: this.formatMessage(rule.message_template, os),
                    fingerprint: `overdue-${os.id}-${rule.id}`
                });

                await this.states.saveState({
                    tenantId: rule.tenant_id,
                    ruleId: rule.id,
                    ordemServicoId: os.id,
                    lastState: { status: os.status, data_prevista: os.data_prevista }
                });
            }
        }
    }

    private resolveRecipient(os: any, recipients: any): string {
        // Lógica para resolver telefone/email do técnico ou cliente
        return 'destinatario@teste.com'; // Exemplo
    }

    private formatMessage(template: string, os: any): string {
        return template.replace(/{{id}}/g, os.id).replace(/{{cliente}}/g, os.cliente_nome || 'Cliente');
    }
}
