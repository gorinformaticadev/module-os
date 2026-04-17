import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { RequestSecurityContextService, type SecurityActor } from '@common/services/request-security-context.service';
import { ModuleOsPrismaService } from '../prisma/module-os-prisma.service';
import { NotificationDispatcherService } from './dispatcher.service';

type EventTriggerConfig = {
    events?: string[];
    [key: string]: unknown;
};

@Injectable()
export class NotificationEventListenerService {
    private readonly logger = new Logger(NotificationEventListenerService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly modulePrisma: ModuleOsPrismaService,
        private readonly dispatcher: NotificationDispatcherService,
        private readonly requestSecurityContext: RequestSecurityContextService,
    ) { }

    @OnEvent('os.created')
    async handleOsCreated(payload: { tenantId: string; osId: string; data: any }) {
        this.logger.log(`Evento os.created recebido para OS: ${payload.osId}`);
        await this.runForTenant(payload.tenantId, () => this.processEventRules('CREATED', payload.osId, payload.data));
    }

    @OnEvent('os.status_changed')
    async handleOsStatusChanged(payload: { tenantId: string; osId: string; oldStatus: string; newStatus: string; data: any }) {
        this.logger.log(`Evento os.status_changed recebido para OS: ${payload.osId} (${payload.oldStatus} -> ${payload.newStatus})`);
        await this.runForTenant(payload.tenantId, () => this.processEventRules('STATUS_CHANGED', payload.osId, payload.data));
    }

    private async processEventRules(eventType: string, osId: string, osData: any) {
        try {
            const rules = await this.modulePrisma.mod_ordem_servico_notif_rules.findMany({
                where: {
                    enabled: true,
                    triggerType: 'EVENT',
                },
            });

            for (const rule of rules) {
                const config = this.normalizeJson<EventTriggerConfig>(rule.triggerConfig, {} as any);
                if (!Array.isArray(config.events) || !config.events.includes(eventType)) {
                    continue;
                }

                this.logger.log(`Regra [${rule.title}] disparada para evento ${eventType}. Canal: ${rule.channel}`);
                const recipients = await this.resolveRecipients(osData, rule.recipients, rule.channel, rule.tenantId);

                for (const recipient of recipients) {
                    await this.dispatcher.dispatch({
                        tenantId: rule.tenantId,
                        ruleId: rule.id,
                        ordemServicoId: osId,
                        channel: rule.channel,
                        recipient,
                        content: this.formatMessage(rule.messageTemplate, osData),
                        fingerprint: `event-${eventType}-${osId}-${rule.id}-${recipient}`,
                    });
                }
            }
        } catch (error: any) {
            this.logger.error(`Erro ao processar regras de evento: ${error.message}`);
        }
    }

    private async resolveRecipients(os: any, recipients: any, channel: string, tenantId: string): Promise<string[]> {
        const parsedRecipients = this.normalizeJson(recipients, []);
        if (!Array.isArray(parsedRecipients)) {
            return [];
        }

        const targets = new Set<string>();
        const internalDelivery = this.usesInternalDelivery(channel);

        for (const recipient of parsedRecipients) {
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
        let clientEmail = os?.cliente?.email || os?.cliente_email || null;

        if (!clientEmail && os?.cliente_id) {
            const client = await this.modulePrisma.mod_clientes_clients.findFirst({
                where: { id: os.cliente_id },
                select: { email: true },
            });
            clientEmail = client?.email || null;
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
        const responsibleId = os?.usuario_responsavel_id || os?.usuarioResponsavelId;
        if (!responsibleId) {
            return;
        }

        const user = await this.prisma.user.findFirst({
            where: {
                id: responsibleId,
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
        const map: Record<string, string | number> = {
            '{{id}}': os.id,
            '{{numero}}': os.numero || String(os.id).split('-')[0],
            '{{cliente}}': os?.cliente?.name || os?.cliente_nome || 'Cliente',
            '{{status}}': os.status,
            '{{data_previsao}}': os.data_previsao ? new Date(os.data_previsao).toLocaleDateString() : 'N/A',
            '{{valor}}': os.valor_servico || '0,00',
        };

        for (const [key, value] of Object.entries(map)) {
            msg = msg.replace(new RegExp(key, 'g'), String(value));
        }
        return msg;
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
            email: 'module-os-events@local',
            name: 'module-os event-listener',
            id: `module-os-event-listener:${tenantId}`,
        };

        return this.requestSecurityContext.runWithActor(actor, callback);
    }
}
