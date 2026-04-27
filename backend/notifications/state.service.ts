import { Injectable, Logger } from "@nestjs/common";
import { RequestSecurityContextService } from "@common/services/request-security-context.service";
import { ModuleOsPrismaService } from "../prisma/module-os-prisma.service";

@Injectable()
export class NotificationStateService {
  // tenantId e aplicado pelo ALS + ModuleOsPrismaService.
  private readonly logger = new Logger(NotificationStateService.name);

  constructor(
    private readonly modulePrisma: ModuleOsPrismaService,
    private readonly requestSecurityContext: RequestSecurityContextService,
  ) {}

  async getState(ruleId: string, ordemServicoId: string) {
    return this.modulePrisma.mod_ordem_servico_notif_states.findFirst({
      where: {
        ruleId,
        ordemServicoId,
      },
    });
  }

  async saveState(data: {
    ruleId: string;
    ordemServicoId: string;
    lastState: any;
  }) {
    const now = new Date();
    const updateResult =
      await this.modulePrisma.mod_ordem_servico_notif_states.updateMany({
        where: {
          ruleId: data.ruleId,
          ordemServicoId: data.ordemServicoId,
        },
        data: {
          lastState: data.lastState,
          updatedAt: now,
        },
      });

    if (updateResult.count === 0) {
      await this.modulePrisma.mod_ordem_servico_notif_states.create({
        data: {
          tenantId: this.getTenantIdOrThrow(),
          ruleId: data.ruleId,
          ordemServicoId: data.ordemServicoId,
          lastState: data.lastState,
          lastNotifiedAt: now,
          updatedAt: now,
        },
      });
    }
  }

  async updateLastNotified(ruleId: string, ordemServicoId: string) {
    const count =
      await this.modulePrisma.mod_ordem_servico_notif_states.updateMany({
        where: {
          ruleId,
          ordemServicoId,
        },
        data: {
          lastNotifiedAt: new Date(),
          updatedAt: new Date(),
        },
      });

    if (count.count === 0) {
      this.logger.warn(
        `Estado de notificacao nao encontrado para rule=${ruleId}, ordem=${ordemServicoId}`,
      );
    }
  }

  private getTenantIdOrThrow(): string {
    const tenantId = this.requestSecurityContext.getTenantId();
    if (!tenantId) {
      throw new Error("Tenant ID nao identificado no contexto atual.");
    }
    return tenantId;
  }
}
