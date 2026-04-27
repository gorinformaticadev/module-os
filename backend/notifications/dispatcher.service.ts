import { Injectable, Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { PrismaService } from "@core/prisma/prisma.service";
import { NotificationGateway } from "@notifications/notification.gateway";
import { NotificationService } from "@notifications/notification.service";
import { NotificationHistoryService } from "./history.service";

export interface NotificationStrategy {
  send(data: {
    tenantId: string;
    recipient: string;
    content: string;
    metadata?: any;
  }): Promise<{ success: boolean; error?: string }>;
}

@Injectable()
export class SystemStrategy implements NotificationStrategy {
  private readonly logger = new Logger(SystemStrategy.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly gateway: NotificationGateway,
  ) {}

  async send(data: {
    tenantId: string;
    recipient: string;
    content: string;
    metadata?: any;
  }) {
    const recipientId = await this.resolveRecipientUserId(
      data.tenantId,
      data.recipient,
    );
    if (!recipientId) {
      const error = `Destinatario interno nao encontrado para ${data.recipient}`;
      this.logger.warn(`[System] ${error}`);
      return { success: false, error };
    }

    this.logger.log(
      `[System] Criando notificacao interna para ${recipientId}...`,
    );

    try {
      const notification =
        await this.notificationService.createSystemNotificationEntity({
          severity: "info",
          title: data.metadata?.title || "Atualizacao OS",
          body: data.content,
          data: data.metadata || {},
          source: "module",
          module: "ordem_servico",
          tenantId: data.tenantId,
          userId: recipientId,
          targetUserId: recipientId,
          targetRole: null,
          type: "SYSTEM_ALERT",
        });

      if (!notification) {
        return {
          success: false,
          error: "Falha ao persistir notificacao interna",
        };
      }

      await this.gateway.emitNewNotification(notification);
      return { success: true };
    } catch (error: any) {
      this.logger.error(`Erro ao criar notificacao interna: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  private async resolveRecipientUserId(
    tenantId: string,
    recipient: string,
  ): Promise<string | null> {
    const normalizedRecipient = String(recipient || "").trim();
    if (!normalizedRecipient) {
      return null;
    }

    const lookupField = normalizedRecipient.includes("@")
      ? { email: normalizedRecipient }
      : { id: normalizedRecipient };

    const user = await this.prisma.user.findFirst({
      where: {
        ...lookupField,
        isLocked: false,
        OR: [{ tenantId }, { role: "SUPER_ADMIN" }],
      },
      select: { id: true },
    });

    return user?.id ?? null;
  }
}

@Injectable()
export class EmailStrategy implements NotificationStrategy {
  private readonly logger = new Logger(EmailStrategy.name);

  async send(data: any) {
    this.logger.log(`[Email] Enviando para ${data.recipient}...`);
    return { success: true };
  }
}

@Injectable()
export class WhatsAppStrategy implements NotificationStrategy {
  private readonly logger = new Logger(WhatsAppStrategy.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  async send(data: any) {
    this.logger.log(
      `[WhatsApp] Emitindo evento para CRM: ${data.recipient}...`,
    );

    this.eventEmitter.emit("whatsapp.send_message", {
      tenantId: data.tenantId,
      to: data.recipient,
      message: data.content,
      metadata: {
        ...data.metadata,
        origin: "ordem-servico-notification-system",
      },
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
    this.strategies["EMAIL"] = emailStrategy;
    this.strategies["WHATSAPP"] = whatsappStrategy;
    this.strategies["SYSTEM"] = systemStrategy;
    this.strategies["PUSH"] = systemStrategy;
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
      const error = `Canal ${params.channel} nao suportado`;
      this.logger.error(error);
      await this.history.log({
        ruleId: params.ruleId,
        ordemServicoId: params.ordemServicoId,
        channel: params.channel,
        recipient: params.recipient,
        content: params.content,
        fingerprint: params.fingerprint,
        status: "ERROR",
        errorMessage: error,
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
          ordemServicoId: params.ordemServicoId,
        },
      });

      await this.history.log({
        ruleId: params.ruleId,
        ordemServicoId: params.ordemServicoId,
        channel: params.channel,
        recipient: params.recipient,
        content: params.content,
        fingerprint: params.fingerprint,
        status: result.success ? "SUCCESS" : "ERROR",
        errorMessage: result.error,
      });

      return result;
    } catch (error: any) {
      this.logger.error(`Falha no dispatch: ${error.message}`);
      await this.history.log({
        ruleId: params.ruleId,
        ordemServicoId: params.ordemServicoId,
        channel: params.channel,
        recipient: params.recipient,
        content: params.content,
        fingerprint: params.fingerprint,
        status: "ERROR",
        errorMessage: error.message,
      });
      return { success: false, error: error.message };
    }
  }
}
