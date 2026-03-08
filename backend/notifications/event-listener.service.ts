import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { NotificationDispatcherService } from './dispatcher.service';

@Injectable()
export class NotificationEventListenerService {
    private readonly logger = new Logger(NotificationEventListenerService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly dispatcher: NotificationDispatcherService
    ) { }

    @OnEvent('os.created')
    async handleOsCreated(payload: { tenantId: string; osId: string; data: any }) {
        this.logger.log(`Evento os.created recebido para OS: ${payload.osId}`);
        await this.processEventRules(payload.tenantId, 'CREATED', payload.osId, payload.data);
    }

    @OnEvent('os.status_changed')
    async handleOsStatusChanged(payload: { tenantId: string; osId: string; oldStatus: string; newStatus: string; data: any }) {
        this.logger.log(`Evento os.status_changed recebido para OS: ${payload.osId} (${payload.oldStatus} -> ${payload.newStatus})`);
        await this.processEventRules(payload.tenantId, 'STATUS_CHANGED', payload.osId, payload.data);
    }

    private async processEventRules(tenantId: string, eventType: string, osId: string, osData: any) {
        try {
            const rules: any[] = await this.prisma.$queryRawUnsafe(
                `SELECT * FROM mod_ordem_servico_notif_rules
                 WHERE tenant_id = $1 AND enabled = true AND trigger_type = 'EVENT'`,
                tenantId
            );

            for (const rule of rules) {
                const config = typeof rule.trigger_config === 'string' ? JSON.parse(rule.trigger_config) : rule.trigger_config;

                if (config.events && config.events.includes(eventType)) {
                    this.logger.log(`Regra [${rule.title}] disparada para evento ${eventType}. Canal: ${rule.channel}`);

                    const recipients = await this.resolveRecipients(tenantId, osData, rule.recipients, rule.channel);
                    this.logger.log(`Disparando regra [${rule.title}] para evento ${eventType} (Recipients: ${recipients.length}, Raw: ${JSON.stringify(rule.recipients)})`);

                    for (const recipient of recipients) {
                        await this.dispatcher.dispatch({
                            tenantId,
                            ruleId: rule.id,
                            ordemServicoId: osId,
                            channel: rule.channel,
                            recipient,
                            content: this.formatMessage(rule.message_template, osData),
                            fingerprint: `event-${eventType}-${osId}-${rule.id}-${recipient}`,
                        });
                    }
                }
            }
        } catch (error: any) {
            this.logger.error(`Erro ao processar regras de evento: ${error.message}`);
        }
    }

    private async resolveRecipients(tenantId: string, os: any, recipients: any, channel: string): Promise<string[]> {
        const parsedRecipients = typeof recipients === 'string' ? JSON.parse(recipients) : recipients;
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
            '{{valor}}': os.valor_servico || '0,00',
        };

        for (const key in map) {
            msg = msg.replace(new RegExp(key, 'g'), map[key]);
        }
        return msg;
    }
}
