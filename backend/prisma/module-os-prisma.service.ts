import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { RequestSecurityContextService } from '@common/services/request-security-context.service';
import { PrismaClient } from '../generated/prisma-client';

const WRITE_OPERATIONS = new Set(['create', 'createMany', 'updateMany', 'deleteMany']);
const READ_OPERATIONS = new Set([
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
]);

@Injectable()
export class ModuleOsPrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ModuleOsPrismaService.name);

  constructor(private readonly requestSecurityContext: RequestSecurityContextService) {
    super();
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.setupExtensions();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  private setupExtensions(): void {
    const requestSecurityContext = this.requestSecurityContext;

    const extended = this.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            if (!model) {
              return query(args);
            }

            if (['queryRaw', 'executeRaw', 'queryRawUnsafe', 'executeRawUnsafe'].includes(operation)) {
              throw new Error(`[Security] RAW Query (${operation}) bloqueada no module-os.`);
            }

            if (!requestSecurityContext.shouldEnforceTenantScope()) {
              return query(args);
            }

            const tenantId = requestSecurityContext.getTenantId();
            if (!tenantId) {
              throw new Error(`Contexto de tenant ausente para ${model}.${operation}`);
            }

            const nextArgs = args ?? {};

            if (READ_OPERATIONS.has(operation) || operation === 'updateMany' || operation === 'deleteMany') {
              nextArgs.where = ModuleOsPrismaService.mergeTenantScope(nextArgs.where, tenantId);
            }

            if (WRITE_OPERATIONS.has(operation)) {
              nextArgs.data = ModuleOsPrismaService.applyTenantData(nextArgs.data, tenantId);
            }

            return query(nextArgs);
          },
        },
      },
    });

    Object.assign(this, extended);
    this.logger.log('Prisma local do module-os iniciado com escopo ALS.');
  }

  private static mergeTenantScope(where: any, tenantId: string) {
    if (!where) {
      return { tenantId };
    }

    ModuleOsPrismaService.assertTenantValue(where, tenantId);
    return { AND: [where, { tenantId }] };
  }

  private static applyTenantData(data: any, tenantId: string) {
    if (Array.isArray(data)) {
      return data.map((entry) => ModuleOsPrismaService.applyTenantData(entry, tenantId));
    }

    if (!data || typeof data !== 'object') {
      return data;
    }

    if ('tenantId' in data && data.tenantId && data.tenantId !== tenantId) {
      throw new Error('Tentativa de sobrescrever tenantId manualmente no module-os.');
    }

    return {
      ...data,
      tenantId,
    };
  }

  private static assertTenantValue(value: any, tenantId: string): void {
    if (!value || typeof value !== 'object') {
      return;
    }

    if ('tenantId' in value && value.tenantId && value.tenantId !== tenantId) {
      throw new Error('Tenant mismatch detectado em query do module-os.');
    }

    for (const nestedValue of Object.values(value)) {
      if (Array.isArray(nestedValue)) {
        nestedValue.forEach((item) => ModuleOsPrismaService.assertTenantValue(item, tenantId));
        continue;
      }

      if (nestedValue && typeof nestedValue === 'object') {
        ModuleOsPrismaService.assertTenantValue(nestedValue, tenantId);
      }
    }
  }
}
