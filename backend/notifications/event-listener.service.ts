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
            // Buscar regras do tipo EVENT que reagem a este evento específico
            const rules: any[] = await this.prisma.$queryRawUnsafe(
                `SELECT * FROM mod_ordem_servico_notif_rules 
                 WHERE tenant_id = $1 AND enabled = true AND trigger_type = 'EVENT'`,
                tenantId
            );

            for (const rule of rules) {
                const config = typeof rule.trigger_config === 'string' ? JSON.parse(rule.trigger_config) : rule.trigger_config;

                if (config.events && config.events.includes(eventType)) {
                    this.logger.log(`Regra [${rule.title}] disparada para evento ${eventType}. Canal: ${rule.channel}`);

                    const recipients = await this.resolveRecipient(osData, rule.recipients, rule.channel);
                    this.logger.log(`Disparando regra [${rule.title}] para evento ${eventType} (Recipients: ${recipients.length}, Raw: ${JSON.stringify(rule.recipients)})`);

                    for (const recipient of recipients) {
                        await this.dispatcher.dispatch({
                            tenantId: tenantId,
                            ruleId: rule.id,
                            ordemServicoId: osId,
                            channel: rule.channel,
                            recipient: recipient,
                            content: this.formatMessage(rule.message_template, osData),
                            fingerprint: `event-${eventType}-${osId}-${rule.id}-${recipient}`
                        });
                    }
                }
            }
        } catch (error: any) {
            this.logger.error(`Erro ao processar regras de evento: ${error.message}`);
        }
    }

    private async resolveRecipient(os: any, recipients: any[], channel: string): Promise<string[]> {
        const targets: Set<string> = new Set(); // Usar Set para evitar duplicatas

        if (!Array.isArray(recipients)) return Array.from(targets);

        for (const r of recipients) {
            if (r.type === 'CLIENT') {
                // Tenta buscar do payload ou banco
                if (os.cliente_email) targets.add(os.cliente_email);
                else if (os.cliente_id) {
                    const client = await this.prisma.$queryRawUnsafe<any[]>(
                        `SELECT email FROM mod_ordem_servico_clients WHERE id = $1::uuid`, os.cliente_id
                    );
                    if (client[0]?.email) targets.add(client[0].email);
                }

                // SMART LOGIC: Se for notificação de SISTEMA (In-App) e o destino for CLIENTE,
                // adicionamos também o Técnico Responsável (se houver), pois provavelmente é um alerta interno sobre o cliente.
                // O cliente (externo) muitas vezes não tem acesso ao painel.
                if (channel === 'SYSTEM' && os.usuario_responsavel_id) {
                    targets.add(os.usuario_responsavel_id);
                }

            } else if (r.type === 'TECHNICIAN') {
                if (os.usuario_responsavel_id) {
                    const user = await this.prisma.user.findUnique({
                        where: { id: os.usuario_responsavel_id },
                        select: { email: true, id: true }
                    });

                    if (channel === 'SYSTEM' && user?.id) {
                        targets.add(user.id);
                    } else if (user?.email) {
                        targets.add(user.email);
                    }
                }
            } else if (r.type === 'ADMIN') {
                // Notificar administradores do tenant
                const admins = await this.prisma.user.findMany({
                    where: {
                        tenantId: os.tenant_id,
                        role: 'ADMIN'
                    },
                    select: { id: true, email: true }
                });
                for (const admin of admins) {
                    if (channel === 'SYSTEM') targets.add(admin.id);
                    else if (admin.email) targets.add(admin.email);
                }
            } else if (r.type === 'SUPER_ADMIN') {
                // Notificar Super Admins (Global)
                const superAdmins = await this.prisma.user.findMany({
                    where: { role: 'SUPER_ADMIN' },
                    select: { id: true, email: true }
                });
                for (const sa of superAdmins) {
                    if (channel === 'SYSTEM') targets.add(sa.id);
                    else if (sa.email) targets.add(sa.email);
                }
            } else if (r.type === 'CUSTOM') {
                targets.add(r.value);
            }
        }
        return Array.from(targets);
    }

    private formatMessage(template: string, os: any): string {
        let msg = template;
        const map: any = {
            '{{id}}': os.id,
            '{{numero}}': os.numero || os.id.split('-')[0],
            '{{cliente}}': os.cliente_nome || 'Cliente',
            '{{status}}': os.status,
            '{{data_previsao}}': os.data_previsao ? new Date(os.data_previsao).toLocaleDateString() : 'N/A',
            '{{valor}}': os.valor_servico || '0,00'
        };

        for (const key in map) {
            msg = msg.replace(new RegExp(key, 'g'), map[key]);
        }
        return msg;
    }
}
