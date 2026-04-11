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

function createModuleOsPrismaAdapter() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL ausente para iniciar o Prisma local do module-os.');
  }

  try {
    // O adapter e carregado dinamicamente para manter o modulo distribuivel via ZIP.
    // A dependencia e declarada no module.json e sincronizada pelo instalador do host.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PrismaPg } = require('@prisma/adapter-pg');
    return new PrismaPg({ connectionString });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Falha ao carregar @prisma/adapter-pg no module-os: ${reason}`);
  }
}

@Injectable()
export class ModuleOsPrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ModuleOsPrismaService.name);

  constructor(private readonly requestSecurityContext: RequestSecurityContextService) {
    super({ adapter: createModuleOsPrismaAdapter() });
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

            const nextArgs = { ...(args ?? {}) } as any;

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
