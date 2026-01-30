import { Injectable, Logger } from '@nestjs/common';
import { NotificationHistoryService } from './history.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../core/prisma/prisma.service';

// Interfaces para as estratégias
export interface NotificationStrategy {
    send(data: {
        tenantId: string;
        recipient: string;
        content: string;
        metadata?: any;
    }): Promise<{ success: boolean; error?: string }>;
}

import { NotificationGateway } from '../../../notifications/notification.gateway';

@Injectable()
export class SystemStrategy implements NotificationStrategy {
    private readonly logger = new Logger(SystemStrategy.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly gateway: NotificationGateway
    ) { }

    async send(data: {
        tenantId: string;
        recipient: string;
        content: string;
        metadata?: any;
    }) {
        // Resolver Email para ID de Usuário se necessário (para garantir entrega no Socket que usa ID)
        let recipientId = data.recipient;
        if (recipientId.includes('@')) {
            try {
                // Tenta buscar na tabela de usuários do sistema (core)
                // Nota: Assumindo que o PrismaService injetado tem acesso ao modelo User (do schema global)
                // Se o PrismaService for o do módulo OS, pode não ter. Mas SystemStrategy geralmente usa Prisma global.
                // O Prisma injetado é o do Core (importado).
                const user = await this.prisma.user.findUnique({
                    where: { email: recipientId },
                    select: { id: true }
                });
                if (user) {
                    this.logger.log(`[System] Email ${recipientId} resolvido para User ID ${user.id}`);
                    recipientId = user.id;
                }
            } catch (e) {
                // Ignora erro de resolução e usa o email mesmo
            }
        }

        this.logger.log(`[System] Criando notificação interna para ${recipientId}...`);

        try {
            const notification = await this.prisma.notification.create({
                data: {
                    tenantId: data.tenantId,
                    userId: recipientId,
                    title: data.metadata?.title || 'Atualização OS',
                    message: data.content,
                    severity: 'info',
                    audience: 'user',
                    source: 'module',
                    module: 'ordem_servico',
                    context: data.metadata?.context || null,
                    data: data.metadata || {},
                    read: false
                }
            });

            // Emitir notificação em tempo real via WebSocket
            // Mapear campos do Prisma (message, severity) para Entidade (description, type)
            const gatewayNotification: any = {
                ...notification,
                description: notification.message,
                type: notification.severity as any,
                metadata: notification.data as any
            };

            await this.gateway.emitNewNotification(gatewayNotification);

            return { success: true };
        } catch (error: any) {
            this.logger.error(`Erro ao criar notificação interna: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
}

@Injectable()
export class EmailStrategy implements NotificationStrategy {
    private readonly logger = new Logger(EmailStrategy.name);
    // Aqui injetaríamos um MailerService real do Core se disponível
    async send(data: any) {
        this.logger.log(`[Email] Enviando para ${data.recipient}...`);
        // Simulação de sucesso
        return { success: true };
    }
}

@Injectable()
export class WhatsAppStrategy implements NotificationStrategy {
    private readonly logger = new Logger(WhatsAppStrategy.name);
    constructor(private readonly eventEmitter: EventEmitter2) { }

    async send(data: any) {
        this.logger.log(`[WhatsApp] Emitindo evento para CRM: ${data.recipient}...`);

        // Emite evento para que o módulo de integração WhatsApp do sistema (CRM) processe
        this.eventEmitter.emit('whatsapp.send_message', {
            tenantId: data.tenantId,
            to: data.recipient,
            message: data.content,
            metadata: {
                ...data.metadata,
                origin: 'ordem-servico-notification-system'
            }
        });

        return { success: true };
    }
}

@Injectable()
export class NotificationDispatcherService {
    private readonly logger = new Logger(NotificationDispatcherService.name);
    private strategies: Record<string, NotificationStrategy> = {};

    constructor(
        private readonly history: NotificationHistoryService,
        private readonly emailStrategy: EmailStrategy,
        private readonly whatsappStrategy: WhatsAppStrategy,
        private readonly systemStrategy: SystemStrategy,
    ) {
        this.strategies['EMAIL'] = emailStrategy;
        this.strategies['WHATSAPP'] = whatsappStrategy;
        this.strategies['SYSTEM'] = systemStrategy;
    }

    async dispatch(params: {
        tenantId: string;
        ruleId: string;
        ordemServicoId?: string;
        channel: string;
        recipient: string;
        content: string;
        fingerprint?: string;
    }) {
        const strategy = this.strategies[params.channel.toUpperCase()];

        if (!strategy) {
            const error = `Canal ${params.channel} não suportado`;
            this.logger.error(error);
            await this.history.log({
                ...params,
                status: 'ERROR',
                errorMessage: error
            });
            return { success: false, error };
        }

        try {
            const result = await strategy.send({
                tenantId: params.tenantId,
                recipient: params.recipient,
                content: params.content,
                metadata: {
                    ruleId: params.ruleId,
                    ordemServicoId: params.ordemServicoId
                }
            });

            await this.history.log({
                ...params,
                status: result.success ? 'SUCCESS' : 'ERROR',
                errorMessage: result.error
            });

            return result;
        } catch (error: any) {
            this.logger.error(`Falha no dispatch: ${error.message}`);
            await this.history.log({
                ...params,
                status: 'ERROR',
                errorMessage: error.message
            });
            return { success: false, error: error.message };
        }
    }
}
