import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  Optional,
} from '@nestjs/common';
import { AuditService } from '@core/audit/audit.service';
import { ModuleDatabaseExecutorService } from '@core/services/module-database-executor.service';
import { RequestSecurityContextService } from '@common/services/request-security-context.service';
import { ClienteRepository } from './repositories/cliente.repository';
import { Cliente, ClienteListFilters, PaginatedClientesResult } from './contracts/cliente.api';
import { IClienteLookup, ClienteMinimal } from '../../shared/interfaces/cliente-lookup.interface';
import { IClienteDeletionGuard } from '../../shared/interfaces/cliente-deletion-guard.interface';
import { CLIENTE_DELETION_GUARD } from '../../shared/constants/injection-tokens';

type RegistrationStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

@Injectable()
export class ClientesService implements IClienteLookup {
  private readonly logger = new Logger(ClientesService.name);

  constructor(
    private readonly repository: ClienteRepository,
    private readonly auditService: AuditService,
    private readonly moduleDatabaseExecutor: ModuleDatabaseExecutorService,
    private readonly requestSecurityContext: RequestSecurityContextService,
    @Inject(CLIENTE_DELETION_GUARD)
    @Optional()
    private readonly deletionGuard?: IClienteDeletionGuard,
  ) {}

  async findAll(
    filters: { search?: string; status?: string | boolean; page?: string | number; limit?: string | number } = {},
  ): Promise<PaginatedClientesResult> {
    const { search, status, page, limit } = filters;
    const safeSearch = typeof search === 'string' ? search.trim() : '';
    let statusFilter: boolean | 'active' | 'inactive' | 'blocked' | undefined;

    if (status === '' || status === undefined || status === null) {
      statusFilter = undefined;
    } else if (status === 'blocked') {
      statusFilter = 'blocked';
    } else if (status === 'active') {
      statusFilter = 'active';
    } else if (status === 'inactive') {
      statusFilter = 'inactive';
    } else {
      statusFilter = status === true || status === 'true';
    }

    const pageNumber = this.parsePositiveInteger(page, 1);
    const limitNumber = this.parsePositiveInteger(limit, 20);

    if (safeSearch.length > 0 && safeSearch.length < 2) {
      return {
        items: [],
        meta: {
          page: pageNumber,
          limit: limitNumber,
          total: 0,
          totalPages: 0,
          hasPreviousPage: false,
          hasNextPage: false,
        },
      };
    }

    const result = await this.repository.findAll({
      search: safeSearch.length >= 2 ? safeSearch : undefined,
      status: statusFilter,
      page: pageNumber,
      limit: limitNumber,
    });

    const serializedItems = (result.items as Cliente[]).map((client) => this.serializeClient(client));

    return {
      items: serializedItems,
      meta: result.meta,
    };
  }

  async findById(id: string): Promise<ClienteMinimal | null> {
    const client = await this.repository.findById(id);
    return client
      ? {
          id: client.id,
          tenantId: client.tenantId,
          name: client.name,
          email: client.email,
          phonePrimary: client.phonePrimary,
          is_active: client.isActive ?? true,
        }
      : null;
  }

  async findByIdForApi(id: string) {
    const client = await this.repository.findById(id);
    return client ? this.serializeClient(client) : null;
  }

  async lookupCep(cep: string) {
    const cleanCep = String(cep || '').replace(/\D/g, '');

    if (cleanCep.length !== 8) {
      throw new BadRequestException('CEP invalido.');
    }

    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      this.logger.warn(`ViaCEP respondeu ${response.status} para o CEP ${cleanCep}`);
      throw new BadGatewayException('Falha ao consultar o CEP.');
    }

    const data = (await response.json()) as {
      erro?: boolean;
      logradouro?: string;
      bairro?: string;
      localidade?: string;
      uf?: string;
      cep?: string;
    };

    if (data.erro) return { success: false };

    return {
      success: true,
      cep: data.cep ?? cleanCep,
      logradouro: data.logradouro ?? '',
      bairro: data.bairro ?? '',
      localidade: data.localidade ?? '',
      uf: data.uf ?? '',
    };
  }

  async create(data: Partial<Cliente> & { [key: string]: any }) {
    if (!data.name || !data.phone_primary) {
      throw new Error('Nome e Telefone principal sao obrigatorios');
    }

    try {
      const actor = this.getActorContext();
      const registrationStatus = this.normalizeRegistrationStatus(data.registration_status, data.is_active);

      const createdClient = await this.moduleDatabaseExecutor.withClient((client) =>
        this.moduleDatabaseExecutor.executeInTransactionWithClient(client, async (transactionClient) => {
          return this.repository.create(
            {
              tenantId: actor.tenantId,
              name: data.name,
              document: data.document,
              personType: data.person_type,
              tradeName: data.trade_name,
              rg: data.rg,
              stateRegistration: data.state_registration,
              gender: data.gender,
              phonePrimary: data.phone_primary,
              phoneSecondary: data.phone_secondary,
              email: data.email,
              address: data.address,
              addressZip: data.address_zip,
              addressStreet: data.address_street,
              addressNumber: data.address_number,
              addressComplement: data.address_complement,
              addressNeighborhood: data.address_neighborhood,
              addressCity: data.address_city,
              addressState: data.address_state,
              creditLimit: this.normalizeDecimal(data.credit_limit),
              settlementDay: this.normalizeSettlementDay(data.settlement_day),
              customerGroup: data.customer_group,
              customerGroupId: data.customer_group_id ?? null,
              birthDate: this.normalizeDate(data.birth_date),
              registrationStatus,
              observations: data.observations,
              imageUrl: data.image_url,
              isActive: this.isActiveFromRegistrationStatus(registrationStatus),
              createdBy: actor.userId,
              updatedBy: actor.userId,
            },
            transactionClient,
          );
        }),
      );

      await this.auditService.log({
        action: 'CREATE_CLIENT',
        userId: actor.userId,
        tenantId: actor.tenantId,
        details: { clientId: createdClient.id, name: data.name },
      });

      return this.serializeClient(createdClient);
    } catch (error) {
      this.logger.error('Erro ao criar cliente:', error);
      if (error instanceof BadRequestException) throw error;
      throw new Error('Erro ao salvar no banco de dados. Verifique os dados e tente novamente.');
    }
  }

  async update(id: string, data: Partial<Cliente> & { [key: string]: any }) {
    if (!data.name || !data.phone_primary) {
      throw new Error('Nome e Telefone principal sao obrigatorios');
    }

    try {
      const existing = await this.repository.findById(id);
      if (!existing) throw new Error('Cliente nao encontrado');

      const actor = this.getActorContext();
      const registrationStatus = this.normalizeRegistrationStatus(
        data.registration_status,
        data.is_active ?? existing.isActive,
      );

      await this.moduleDatabaseExecutor.withClient((client) =>
        this.moduleDatabaseExecutor.executeInTransactionWithClient(client, async (transactionClient) => {
          await this.repository.update(
            id,
            {
              name: data.name,
              document: data.document,
              personType: data.person_type,
              tradeName: data.trade_name,
              rg: data.rg,
              stateRegistration: data.state_registration,
              gender: data.gender,
              phonePrimary: data.phone_primary,
              phoneSecondary: data.phone_secondary,
              email: data.email,
              address: data.address,
              addressZip: data.address_zip,
              addressStreet: data.address_street,
              addressNumber: data.address_number,
              addressComplement: data.address_complement,
              addressNeighborhood: data.address_neighborhood,
              addressCity: data.address_city,
              addressState: data.address_state,
              creditLimit: this.normalizeDecimal(data.credit_limit),
              settlementDay: this.normalizeSettlementDay(data.settlement_day),
              customerGroup: data.customer_group,
              customerGroupId: data.customer_group_id ?? null,
              birthDate: this.normalizeNullableDate(data.birth_date),
              registrationStatus,
              observations: data.observations,
              imageUrl: data.image_url,
              isActive: this.isActiveFromRegistrationStatus(registrationStatus),
              updatedBy: actor.userId,
            },
            transactionClient,
          );
        }),
      );

      await this.auditService.log({
        action: 'UPDATE_CLIENT',
        userId: actor.userId,
        tenantId: actor.tenantId,
        details: { clientId: id, updates: data },
      });

      return this.findByIdForApi(id);
    } catch (error) {
      this.logger.error('Erro ao atualizar cliente:', error);
      throw error;
    }
  }

  async delete(id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) throw new Error('Cliente nao encontrado');

    if (this.deletionGuard) {
      const result = await this.deletionGuard.canDelete(id);
      if (!result.allowed) {
        throw new Error(result.reason || 'Cliente nao pode ser excluido.');
      }
    }

    const actor = this.getActorContext();

    await this.auditService.log({
      action: 'DELETE_CLIENT',
      userId: actor.userId,
      tenantId: actor.tenantId,
      details: { clientId: id },
    });

    await this.repository.delete(id);
    return { success: true };
  }

  private getActorContext() {
    const actor = this.requestSecurityContext.getActor();
    const request = this.requestSecurityContext.getRequest<{
      body?: Record<string, unknown>;
      query?: Record<string, unknown>;
      params?: Record<string, unknown>;
      tenantId?: unknown;
    }>();
    const requestedTenantId = this.normalizeTenantId(
      request?.body?.tenantId
      ?? request?.body?.tenant_id
      ?? request?.query?.tenantId
      ?? request?.query?.tenant_id
      ?? request?.params?.tenantId
      ?? request?.tenantId,
    );
    const isSuperAdmin = String(actor?.role || '').toUpperCase() === 'SUPER_ADMIN';
    const tenantId = isSuperAdmin
      ? requestedTenantId || '1'
      : actor?.tenantId || this.requestSecurityContext.getTenantId();

    if (!tenantId) throw new Error('Tenant ID nao identificado no contexto atual.');

    return { tenantId, userId: actor?.id || undefined };
  }

  private normalizeTenantId(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
  }

  private serializeClient(client: Cliente) {
    return {
      id: client.id,
      tenant_id: client.tenantId,
      name: client.name,
      document: client.document,
      person_type: client.personType,
      trade_name: client.tradeName,
      rg: client.rg,
      state_registration: client.stateRegistration,
      gender: client.gender,
      phone_primary: client.phonePrimary,
      phone_secondary: client.phoneSecondary,
      email: client.email,
      address: client.address,
      address_zip: client.addressZip,
      address_street: client.addressStreet,
      address_number: client.addressNumber,
      address_complement: client.addressComplement,
      address_neighborhood: client.addressNeighborhood,
      address_city: client.addressCity,
      address_state: client.addressState,
      credit_limit: client.creditLimit,
      settlement_day: client.settlementDay,
      customer_group: client.customerGroup,
      customer_group_id: client.customerGroupId ?? null,
      birth_date: client.birthDate?.toISOString?.().slice(0, 10) ?? client.birthDate ?? null,
      registration_status: client.registrationStatus ?? (client.isActive ? 'ACTIVE' : 'INACTIVE'),
      observations: client.observations,
      image_url: client.imageUrl,
      is_active: client.isActive ?? true,
      created_by: client.createdBy ?? null,
      updated_by: client.updatedBy ?? null,
      created_at: client.createdAt?.toISOString?.() ?? client.createdAt ?? null,
      updated_at: client.updatedAt?.toISOString?.() ?? client.updatedAt ?? null,
      deleted_at: client.deletedAt?.toISOString?.() ?? client.deletedAt ?? null,
    };
  }

  private normalizeRegistrationStatus(
    rawStatus: unknown,
    fallbackIsActive?: boolean,
  ): RegistrationStatus {
    const normalized = String(rawStatus || '').trim().toUpperCase();
    if (normalized === 'BLOCKED' || normalized === 'INACTIVE' || normalized === 'ACTIVE') {
      return normalized as RegistrationStatus;
    }
    return fallbackIsActive === false ? 'INACTIVE' : 'ACTIVE';
  }

  private isActiveFromRegistrationStatus(status: RegistrationStatus): boolean {
    return status === 'ACTIVE';
  }

  private normalizeDecimal(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const normalized = Number(String(value).replace(',', '.'));
    return Number.isFinite(normalized) ? normalized : undefined;
  }

  private normalizeSettlementDay(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const normalized = Number(value);
    if (!Number.isInteger(normalized) || normalized < 1 || normalized > 31) return undefined;
    return normalized;
  }

  private normalizeDate(value: unknown): string | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    return String(value);
  }

  private normalizeNullableDate(value: unknown): string | null | undefined {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    return String(value);
  }

  private parsePositiveInteger(value: string | number | undefined, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(1, Math.trunc(parsed));
  }
}
