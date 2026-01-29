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
        this.logger.log(`Processing rule: ${rule.title} (${rule.id})`);

        if (rule.trigger_type === 'CONDITION') {
            await this.processConditionRule(rule);
        } else if (rule.trigger_type === 'CRON') {
            // Basic CRON - not detailed here yet as focus is OS Fora do Prazo (Condition)
        } else if (rule.trigger_type === 'OFFSET') {
            await this.processOffsetRule(rule);
        }
    }

    private async processOffsetRule(rule: any) {
        const config = typeof rule.trigger_config === 'string' ? JSON.parse(rule.trigger_config) : rule.trigger_config;

        // Ex: { value: 24, unit: 'HOURS', reference: 'BEFORE_DEADLINE' }
        if (config.reference === 'BEFORE_DEADLINE') {
            await this.processBeforeDeadline(rule, config);
        }
    }

    private async processBeforeDeadline(rule: any, config: any) {
        // Calcular intervalo
        const interval = `${config.value} ${config.unit || 'HOURS'}`; // Postgres interval syntax

        // Buscar OSs onde (data_previsao - interval) <= NOW e status != Finalizado
        const query = `
            SELECT os.* FROM "mod_ordem_servico_ordens" os
            WHERE os.tenant_id = $1
            AND os.status NOT IN (3, 4, 6) -- Não Finalizada/Cancelada/Retirada (Check numeric status map)
            AND os.data_previsao IS NOT NULL
            AND os.data_previsao - INTERVAL '${config.value} ${config.unit || 'hours'}' <= CURRENT_TIMESTAMP
            AND os.data_previsao > CURRENT_TIMESTAMP -- Ainda não venceu (opcional, depende do caso de uso)
        `;

        const targetOrders: any[] = await this.prisma.$queryRawUnsafe(query, rule.tenant_id);

        for (const os of targetOrders) {
            // Verifica se já notificou usando State ou History?
            // History é mais seguro para "evento único" como Offset.
            const fingerprint = `offset-${rule.id}-${os.id}`;
            const alreadySent = await this.states.getState(rule.tenant_id, rule.id, os.id);

            if (!alreadySent) {
                this.logger.log(`Offset Trigger [${rule.title}] para OS ${os.id}`);

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

    // Helper unificado para dispatch e contador
    private async dispatchNotification(rule: any, os: any, fingerprint: string): Promise<boolean> {
        // Silence Window Check
        const config = typeof rule.trigger_config === 'string' ? JSON.parse(rule.trigger_config) : rule.trigger_config;
        if (config.silence_window?.start && config.silence_window?.end) {
            const now = new Date();
            const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

            const [startH, startM] = config.silence_window.start.split(':').map(Number);
            const [endH, endM] = config.silence_window.end.split(':').map(Number);

            const startTotal = startH * 60 + startM;
            const endTotal = endH * 60 + endM;

            // Lógica para janelas que cruzam a meia-noite (Ex: 22:00 as 06:00)
            const isSilenced = startTotal <= endTotal
                ? (currentTotalMinutes >= startTotal && currentTotalMinutes <= endTotal)
                : (currentTotalMinutes >= startTotal || currentTotalMinutes <= endTotal);

            if (isSilenced) {
                this.logger.log(`Regra [${rule.title}] silenciada pela Janela de Silêncio (${config.silence_window.start}-${config.silence_window.end})`);
                return false;
            }
        }

        const result = await this.dispatcher.dispatch({
            tenantId: rule.tenant_id,
            ruleId: rule.id,
            ordemServicoId: os.id,
            channel: rule.channel,
            recipient: this.resolveRecipient(os, rule.recipients),
            content: this.formatMessage(rule.message_template, os),
            fingerprint: fingerprint
        });

        if (result.success) {
            // Incrementar contador da regra
            await this.prisma.$queryRawUnsafe(
                `UPDATE mod_ordem_servico_notif_rules SET current_executions = current_executions + 1, last_execution_at = CURRENT_TIMESTAMP WHERE id = $1`,
                rule.id
            );
        }

        return result.success;
    }

    private async processOverdueOS(rule: any, config: any) {
        // Encontrar OS atrasadas que ainda não atingiram o limite desta regra
        const overdueOrders: any[] = await this.prisma.$queryRawUnsafe(
            `SELECT os.* FROM "mod_ordem_servico_ordens" os
             WHERE os.tenant_id = $1
             AND os.status NOT IN (3, 4, 6)
             AND os.data_previsao < CURRENT_TIMESTAMP`,
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

                await this.dispatchNotification(rule, os, `overdue-${os.id}-${rule.id}`);

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
