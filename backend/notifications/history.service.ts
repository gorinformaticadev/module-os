import { Injectable, Logger } from "@nestjs/common";
import { RequestSecurityContextService } from "@common/services/request-security-context.service";
import { ModuleOsPrismaService } from "../prisma/module-os-prisma.service";

@Injectable()
export class NotificationHistoryService {
  // tenantId e aplicado pelo ALS + ModuleOsPrismaService.
  private readonly logger = new Logger(NotificationHistoryService.name);

  constructor(
    private readonly modulePrisma: ModuleOsPrismaService,
    private readonly requestSecurityContext: RequestSecurityContextService,
  ) {}

  async findAll(filters?: any) {
    const { ruleId, ordemServicoId, status } = filters || {};

    return this.modulePrisma.mod_ordem_servico_notif_history.findMany({
      where: {
        ...(ruleId ? { ruleId } : {}),
        ...(ordemServicoId ? { ordemServicoId } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { sentAt: "desc" },
      take: 100,
    });
  }

  async log(data: {
    ruleId: string;
    ordemServicoId?: string;
    channel: string;
    recipient: string;
    content: string;
    status: "SUCCESS" | "ERROR" | "PAUSED" | "EXPIRED";
    errorMessage?: string;
    fingerprint?: string;
  }) {
    try {
      await this.modulePrisma.mod_ordem_servico_notif_history.create({
        data: {
          tenantId: this.getTenantIdOrThrow(),
          ruleId: data.ruleId,
          ordemServicoId: data.ordemServicoId || null,
          channel: data.channel,
          recipient: data.recipient,
          content: data.content,
          status: data.status,
          errorMessage: data.errorMessage || null,
          fingerprint: data.fingerprint || null,
        },
      });
    } catch (error) {
      this.logger.error("Erro ao logar historico de notificacao:", error);
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
