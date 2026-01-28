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
                    this.logger.log(`Regra [${rule.title}] disparada para evento ${eventType}`);

                    await this.dispatcher.dispatch({
                        tenantId: tenantId,
                        ruleId: rule.id,
                        ordemServicoId: osId,
                        channel: rule.channel,
                        recipient: this.resolveRecipient(osData, rule.recipients),
                        content: this.formatMessage(rule.message_template, osData),
                        fingerprint: `event-${eventType}-${osId}-${rule.id}`
                    });
                }
            }
        } catch (error: any) {
            this.logger.error(`Erro ao processar regras de evento: ${error.message}`);
        }
    }

    private resolveRecipient(os: any, recipients: any): string {
        // Implementar lógica real baseada no config de recipients
        return 'destinatario@teste.com';
    }

    private formatMessage(template: string, os: any): string {
        return template.replace(/{{id}}/g, os.id).replace(/{{cliente}}/g, os.cliente_nome || 'Cliente');
    }
}
