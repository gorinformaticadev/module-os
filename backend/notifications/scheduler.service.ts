import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CronService } from '../../../core/cron/cron.service';
import { RequestSecurityContextService, type SecurityActor } from '@common/services/request-security-context.service';
import { ModuleOsPrismaService } from '../prisma/module-os-prisma.service';
import { NotificationDispatcherService } from './dispatcher.service';
import { NotificationStateService } from './state.service';

type RuntimeRule = {
    id: string;
    tenantId: string;
    title: string;
    channel: string;
    triggerType: string;
    triggerConfig: any;
    recipients: any;
    messageTemplate: string;
    currentExecutions?: number | null;
    maxExecutions?: number | null;
};

@Injectable()
export class NotificationSchedulerService implements OnModuleInit {
    private readonly logger = new Logger(NotificationSchedulerService.name);
    private isProcessing = false;

    constructor(
        private readonly prisma: PrismaService,
        private readonly modulePrisma: ModuleOsPrismaService,
        private readonly dispatcher: NotificationDispatcherService,
        private readonly states: NotificationStateService,
        private readonly cronService: CronService,
        private readonly requestSecurityContext: RequestSecurityContextService,
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
            const now = new Date();
            const activeRules = await this.requestSecurityContext.runWithoutTenantEnforcement(
                'module-os notification scheduler sweep',
                () => this.modulePrisma.mod_ordem_servico_notif_rules.findMany({
                    where: {
                        enabled: true,
                        triggerType: { in: ['CRON', 'CONDITION', 'OFFSET'] },
                        OR: [
                            { nextExecutionAt: null },
                            { nextExecutionAt: { lte: now } },
                        ],
                        AND: [
                            {
                                OR: [
                                    { expiresAt: null },
                                    { expiresAt: { gt: now } },
                                ],
                            },
                        ],
                    },
                    orderBy: { createdAt: 'desc' },
                }),
            );

            for (const rule of activeRules) {
                await this.runForTenant(rule.tenantId, () => this.processRule(rule as RuntimeRule));
            }
        } catch (error: any) {
            this.logger.error(`Worker error: ${error.message}`);
        } finally {
            this.isProcessing = false;
        }
    }

    private async processRule(rule: RuntimeRule) {
        if (rule.maxExecutions && (rule.currentExecutions || 0) >= rule.maxExecutions) {
            return;
        }

        if (rule.triggerType === 'CONDITION') {
            await this.processConditionRule(rule);
            return;
        }

        if (rule.triggerType === 'OFFSET') {
            await this.processOffsetRule(rule);
        }
    }

    private async processOffsetRule(rule: RuntimeRule) {
        const config = this.normalizeJson(rule.triggerConfig, {});

        if (config.reference === 'BEFORE_DEADLINE' || config.reference === 'AFTER_DEADLINE') {
            await this.processRelativeDeadline(rule, config);
        }
    }

    private async processRelativeDeadline(rule: RuntimeRule, config: any) {
        const orders = await this.modulePrisma.mod_ordem_servico_ordens.findMany({
            where: {
                status: { notIn: [3, 4, 6] },
                dataPrevisao: { not: null },
            },
            include: {
                cliente: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });

        for (const ordem of orders) {
            if (!this.matchesOffsetRule(ordem.dataPrevisao, config)) {
                continue;
            }

            const fingerprint = `offset-${rule.id}-${ordem.id}`;
            const alreadySent = await this.states.getState(rule.id, ordem.id);

            if (!alreadySent) {
                const success = await this.dispatchNotification(rule, ordem, fingerprint);
                if (success) {
                    await this.states.saveState({
                        ruleId: rule.id,
                        ordemServicoId: ordem.id,
                        lastState: { notified_at: new Date().toISOString() },
                    });
                }
            }
        }
    }

    private async processConditionRule(rule: RuntimeRule) {
        const config = this.normalizeJson(rule.triggerConfig, {});

        if (config.condition === 'OVERDUE') {
            await this.processOverdueOS(rule, config);
        }
    }

    private async processOverdueOS(rule: RuntimeRule, config: any) {
        const overdueOrders = await this.modulePrisma.mod_ordem_servico_ordens.findMany({
            where: {
                status: { notIn: [3, 4, 6] },
                dataPrevisao: { lt: new Date() },
            },
            include: {
                cliente: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });

        for (const ordem of overdueOrders) {
            const state = await this.states.getState(rule.id, ordem.id);
            const lastNotifiedAt = state?.updatedAt ? new Date(state.updatedAt) : null;

            let shouldNotify = false;
            if (!state) {
                shouldNotify = true;
            } else if (config.frequency) {
                const ms = ((config.frequency.days || 0) * 86400 + (config.frequency.hours || 0) * 3600 + (config.frequency.minutes || 0) * 60 + (config.frequency.seconds || 0)) * 1000;
                if (ms > 0 && lastNotifiedAt && Date.now() >= lastNotifiedAt.getTime() + ms) {
                    shouldNotify = true;
                }
            }

            if (!shouldNotify) {
                continue;
            }

            const success = await this.dispatchNotification(rule, ordem, `overdue-${ordem.id}-${Date.now()}`);
            if (success) {
                await this.states.saveState({
                    ruleId: rule.id,
                    ordemServicoId: ordem.id,
                    lastState: { status: ordem.status, notified_at: new Date().toISOString() },
                });
            }
        }
    }

    private async dispatchNotification(rule: RuntimeRule, ordem: any, fingerprint: string): Promise<boolean> {
        const config = this.normalizeJson(rule.triggerConfig, {});

        if (this.isInSilenceWindow(config.silence_window)) {
            this.logger.log(`Regra [${rule.title}] silenciada pela Janela de Silencio`);
            return false;
        }

        const recipientsList = await this.resolveRecipients(ordem, rule.recipients, rule.channel, rule.tenantId);
        let atLeastOneSuccess = false;

        for (const recipient of recipientsList) {
            const result = await this.dispatcher.dispatch({
                tenantId: rule.tenantId,
                ruleId: rule.id,
                ordemServicoId: ordem.id,
                channel: rule.channel,
                recipient,
                content: this.formatMessage(rule.messageTemplate, ordem),
                fingerprint: `${fingerprint}-${recipient}`,
            });
            if (result.success) {
                atLeastOneSuccess = true;
            }
        }

        if (atLeastOneSuccess) {
            await this.modulePrisma.mod_ordem_servico_notif_rules.updateMany({
                where: { id: rule.id },
                data: {
                    currentExecutions: { increment: 1 },
                    lastExecutionAt: new Date(),
                    updatedAt: new Date(),
                },
            });
        }

        return atLeastOneSuccess;
    }

    private async resolveRecipients(ordem: any, recipients: any, channel: string, tenantId: string): Promise<string[]> {
        const config = this.normalizeJson(recipients, []);
        if (!Array.isArray(config)) return [];

        const targets = new Set<string>();
        const internalDelivery = this.usesInternalDelivery(channel);

        for (const recipient of config) {
            switch (recipient.type) {
                case 'CLIENT':
                    await this.appendClientTargets(targets, ordem, tenantId, internalDelivery);
                    break;
                case 'TECHNICIAN':
                    await this.appendTechnicianTargets(targets, ordem, tenantId, internalDelivery);
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

    private async appendClientTargets(targets: Set<string>, ordem: any, tenantId: string, internalDelivery: boolean) {
        const clientEmail = ordem?.cliente?.email || null;
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

    private async appendTechnicianTargets(targets: Set<string>, ordem: any, tenantId: string, internalDelivery: boolean) {
        if (!ordem.usuarioResponsavelId) {
            return;
        }

        const user = await this.prisma.user.findFirst({
            where: {
                id: ordem.usuarioResponsavelId,
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

    private formatMessage(template: string, ordem: any): string {
        let msg = template;
        const map: Record<string, string | number> = {
            '{{id}}': ordem.id,
            '{{numero}}': ordem.numero || String(ordem.id).split('-')[0],
            '{{cliente}}': ordem?.cliente?.name || 'Cliente',
            '{{status}}': ordem.status,
            '{{data_previsao}}': ordem.dataPrevisao ? new Date(ordem.dataPrevisao).toLocaleDateString() : 'N/A',
        };

        for (const [key, value] of Object.entries(map)) {
            msg = msg.replace(new RegExp(key, 'g'), String(value));
        }
        return msg;
    }

    private matchesOffsetRule(dataPrevisao: Date | null, config: any): boolean {
        if (!dataPrevisao) {
            return false;
        }

        const duration = config.offset_duration || { value: config.value, unit: config.unit };
        const offsetMs = this.durationToMs(duration);
        const now = Date.now();
        const target = new Date(dataPrevisao).getTime();

        if (config.reference === 'BEFORE_DEADLINE') {
            return target - offsetMs <= now;
        }

        if (config.reference === 'AFTER_DEADLINE') {
            return target + offsetMs <= now;
        }

        return false;
    }

    private durationToMs(duration: any): number {
        if (!duration) {
            return 0;
        }

        if (duration.value && duration.unit) {
            const value = Number(duration.value) || 0;
            switch (String(duration.unit).toLowerCase()) {
                case 'day':
                case 'days':
                    return value * 86400000;
                case 'hour':
                case 'hours':
                    return value * 3600000;
                case 'minute':
                case 'minutes':
                    return value * 60000;
                case 'second':
                case 'seconds':
                    return value * 1000;
                default:
                    return 0;
            }
        }

        return ((duration.days || 0) * 86400 + (duration.hours || 0) * 3600 + (duration.minutes || 0) * 60 + (duration.seconds || 0)) * 1000;
    }

    private isInSilenceWindow(windowConfig: any): boolean {
        if (!windowConfig?.start || !windowConfig?.end) {
            return false;
        }

        const now = new Date();
        const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
        const [startH, startM] = String(windowConfig.start).split(':').map(Number);
        const [endH, endM] = String(windowConfig.end).split(':').map(Number);
        const startTotal = startH * 60 + startM;
        const endTotal = endH * 60 + endM;

        return startTotal <= endTotal
            ? currentTotalMinutes >= startTotal && currentTotalMinutes <= endTotal
            : currentTotalMinutes >= startTotal || currentTotalMinutes <= endTotal;
    }

    private normalizeJson<T>(value: unknown, fallback: T): T {
        if (value == null) {
            return fallback;
        }

        if (typeof value === 'string') {
            try {
                return JSON.parse(value) as T;
            } catch {
                return fallback;
            }
        }

        return value as T;
    }

    private runForTenant<T>(tenantId: string, callback: () => Promise<T>): Promise<T> {
        const actor: SecurityActor = {
            tenantId,
            role: 'ADMIN',
            email: 'module-os-scheduler@local',
            name: 'module-os scheduler',
            id: `module-os-scheduler:${tenantId}`,
        };

        return this.requestSecurityContext.runWithActor(actor, callback);
    }
}
