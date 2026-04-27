import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { CronService } from "@core/cron/cron.service";
import { PrismaService } from "@core/prisma/prisma.service";
import {
  RequestSecurityContextService,
  type SecurityActor,
} from "@common/services/request-security-context.service";
import { NotificationGateway } from "@notifications/notification.gateway";
import { NotificationService } from "@notifications/notification.service";
import { ModuleOsPrismaService } from "../prisma/module-os-prisma.service";

@Injectable()
export class OrdemServicoCronService implements OnModuleInit {
  private readonly logger = new Logger(OrdemServicoCronService.name);

  constructor(
    private readonly cronService: CronService,
    private readonly prisma: PrismaService,
    private readonly modulePrisma: ModuleOsPrismaService,
    private readonly notificationService: NotificationService,
    private readonly notificationGateway: NotificationGateway,
    private readonly requestSecurityContext: RequestSecurityContextService,
  ) {}

  async onModuleInit() {
    this.logger.log("Inicializando OrdemServico Cron Service");
    await this.registerNotificationJob();
  }

  async registerNotificationJob() {
    try {
      const schedules =
        await this.requestSecurityContext.runWithoutTenantEnforcement(
          "module-os notification schedules sweep",
          () =>
            this.modulePrisma.mod_ordem_servico_notification_schedules.findMany(),
        );

      const activeKeys = new Set<string>();

      for (const config of schedules) {
        const key = `ordemServico.auto_notification.${config.id}`;

        if (config.enabled) {
          await this.cronService.register(
            key,
            config.cronExpression,
            async () => {
              await this.runForTenant(config.tenantId, () =>
                this.executeNotificationJob(config),
              );
            },
            {
              name: "Notif: " + config.title,
              description: "Notificacao automatica do Ordem de Servico",
              settingsUrl: "/modules/ordem_servico/pages/configuracoes",
            },
          );
          activeKeys.add(key);
        } else {
          this.cronService.delete(key);
        }
      }

      this.cronService.delete("ordemServico.auto_notification");

      const allJobs = await this.cronService.listJobs();
      for (const job of allJobs) {
        if (
          job.key.startsWith("ordemServico.auto_notification.") &&
          !activeKeys.has(job.key)
        ) {
          this.cronService.delete(job.key);
        }
      }
    } catch (e) {
      this.logger.error("Erro ao registrar jobs:", e);
    }
  }

  private async executeNotificationJob(config: any) {
    this.logger.log(`Executando Notificacao automatica: ${config.title}`);

    try {
      const recipients = await this.resolveScheduleRecipients(config);
      if (recipients.length === 0) {
        this.logger.warn(
          `Nenhum destinatario valido encontrado para a notificacao agendada ${config.id}`,
        );
        return;
      }

      let createdCount = 0;
      for (const userId of recipients) {
        const notification =
          await this.notificationService.createSystemNotificationEntity({
            severity: "info",
            title: config.title,
            body: config.content,
            data: {
              scheduleId: config.id,
              audience: config.audience || "all",
            },
            source: "module",
            module: "ordem_servico",
            tenantId: config.tenantId,
            userId,
            targetUserId: userId,
            targetRole: null,
            type: "SYSTEM_ALERT",
          });

        if (!notification) {
          continue;
        }

        createdCount += 1;
        await this.notificationGateway.emitNewNotification(notification);
      }

      this.logger.log(
        `Notificacoes criadas com sucesso para ${createdCount} usuario(s).`,
      );
    } catch (e) {
      this.logger.error("Erro ao criar notificacao:", e);
    }
  }

  private async resolveScheduleRecipients(config: any): Promise<string[]> {
    const audience = String(config?.audience || "all")
      .trim()
      .toLowerCase();
    const tenantId = String(config?.tenantId || "").trim();
    if (!tenantId) {
      return [];
    }

    if (audience.startsWith("user:")) {
      const userId = audience.slice(5).trim();
      return userId ? this.resolveExplicitUserIds([userId], tenantId) : [];
    }

    if (audience.startsWith("email:")) {
      const email = audience.slice(6).trim();
      if (!email) {
        return [];
      }
      const userId = await this.resolveUserIdByEmail(email, tenantId);
      return userId ? [userId] : [];
    }

    switch (audience) {
      case "admin":
      case "admins":
        return this.getTenantUserIdsByRoles(tenantId, ["ADMIN"]);
      case "technician":
      case "technicians":
        return this.getTechnicianUserIds(tenantId);
      case "super_admin":
      case "super_admins":
        return this.getGlobalUserIdsByRoles(["SUPER_ADMIN"]);
      case "all":
      default:
        return this.getTenantUserIdsByRoles(tenantId, ["ADMIN", "USER"]);
    }
  }

  private async getTenantUserIdsByRoles(
    tenantId: string,
    roles: string[],
  ): Promise<string[]> {
    const users = await this.prisma.user.findMany({
      where: {
        tenantId,
        role: { in: roles as any },
        isLocked: false,
      },
      select: { id: true },
    });

    return users.map((user) => user.id);
  }

  private async getGlobalUserIdsByRoles(roles: string[]): Promise<string[]> {
    const users = await this.prisma.user.findMany({
      where: {
        role: { in: roles as any },
        isLocked: false,
      },
      select: { id: true },
    });

    return users.map((user) => user.id);
  }

  private async getTechnicianUserIds(tenantId: string): Promise<string[]> {
    const technicians =
      await this.modulePrisma.mod_ordem_servico_user_roles.findMany({
        where: {
          isTechnician: true,
        },
        select: { userId: true },
      });

    if (technicians.length === 0) {
      return [];
    }

    const users = await this.prisma.user.findMany({
      where: {
        id: { in: technicians.map((item) => item.userId) },
        tenantId,
        isLocked: false,
      },
      select: { id: true },
    });

    return users.map((user) => user.id);
  }

  private async resolveExplicitUserIds(
    userIds: string[],
    tenantId: string,
  ): Promise<string[]> {
    const users = await this.prisma.user.findMany({
      where: {
        id: { in: userIds },
        tenantId,
        isLocked: false,
      },
      select: { id: true },
    });

    return users.map((user) => user.id);
  }

  private async resolveUserIdByEmail(
    email: string,
    tenantId: string,
  ): Promise<string | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        tenantId,
        isLocked: false,
      },
      select: { id: true },
    });

    return user?.id ?? null;
  }

  private runForTenant<T>(
    tenantId: string,
    callback: () => Promise<T>,
  ): Promise<T> {
    const actor: SecurityActor = {
      tenantId,
      role: "ADMIN",
      email: "module-os-cron@local",
      name: "module-os cron",
      id: `module-os-cron:${tenantId}`,
    };

    return this.requestSecurityContext.runWithActor(actor, callback);
  }
}
