import { Injectable, Logger } from '@nestjs/common';
import { PoolClient } from 'pg';
import { RequestSecurityContextService } from '@common/services/request-security-context.service';
import { ModuleDatabaseExecutorService, QueryParam } from '@core/services/module-database-executor.service';
import { Cliente, ClienteListFilters, PaginatedClientesResult } from '../contracts/cliente.api';

interface CreateClienteDTO {
  tenantId: string;
  name: string;
  document?: string;
  personType?: 'PERSON' | 'COMPANY';
  tradeName?: string;
  rg?: string;
  stateRegistration?: string;
  gender?: string;
  phonePrimary: string;
  phoneSecondary?: string;
  email?: string;
  address?: string;
  addressZip?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressCity?: string;
  addressState?: string;
  creditLimit?: number;
  settlementDay?: number;
  customerGroup?: string;
  customerGroupId?: string | null;
  birthDate?: string;
  registrationStatus?: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  observations?: string;
  imageUrl?: string;
  isActive?: boolean;
  createdBy?: string;
  updatedBy?: string;
}

interface UpdateClienteDTO {
  name?: string;
  document?: string;
  personType?: 'PERSON' | 'COMPANY';
  tradeName?: string;
  rg?: string;
  stateRegistration?: string;
  gender?: string;
  phonePrimary?: string;
  phoneSecondary?: string;
  email?: string;
  address?: string;
  addressZip?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressCity?: string;
  addressState?: string;
  creditLimit?: number | null;
  settlementDay?: number | null;
  customerGroup?: string;
  customerGroupId?: string | null;
  birthDate?: string | null;
  registrationStatus?: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  observations?: string;
  imageUrl?: string;
  isActive?: boolean;
  updatedBy?: string;
}

interface ClienteRow {
  id: string;
  tenant_id: string;
  name: string;
  document: string | null;
  person_type: 'PERSON' | 'COMPANY' | null;
  trade_name: string | null;
  rg: string | null;
  state_registration: string | null;
  gender: string | null;
  phone_primary: string;
  phone_secondary: string | null;
  email: string | null;
  address: string | null;
  address_zip: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  credit_limit: number | string | null;
  settlement_day: number | null;
  customer_group: string | null;
  customer_group_id: string | null;
  birth_date: Date | string | null;
  registration_status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | null;
  observations: string | null;
  image_url: string | null;
  is_active: boolean | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
  deleted_at?: Date | string | null;
}

interface CountRow {
  total: number | string;
}

const CLIENT_SELECT_COLUMNS = `
  id,
  tenant_id,
  name,
  document,
  person_type,
  trade_name,
  rg,
  state_registration,
  gender,
  phone_primary,
  phone_secondary,
  email,
  address,
  address_zip,
  address_street,
  address_number,
  address_complement,
  address_neighborhood,
  address_city,
  address_state,
  credit_limit,
  settlement_day,
  customer_group,
  customer_group_id,
  birth_date,
  registration_status,
  observations,
  image_url,
  is_active,
  created_by,
  updated_by,
  created_at,
  updated_at,
  deleted_at
`;

@Injectable()
export class ClienteRepository {
  private readonly logger = new Logger(ClienteRepository.name);

  constructor(
    private readonly moduleDatabaseExecutor: ModuleDatabaseExecutorService,
    private readonly requestSecurityContext: RequestSecurityContextService,
  ) {}

  async findById(id: string, client?: PoolClient): Promise<Cliente | null> {
    const tenantId = this.getTenantIdOrThrow();
    const rows = await this.executeQuery<ClienteRow>(
      `
        SELECT ${CLIENT_SELECT_COLUMNS}
        FROM mod_clientes_clients
        WHERE id = $1
          AND tenant_id = $2
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [id, tenantId],
      client,
    );

    const [data] = rows;
    return data ? this.mapToDomain(data) : null;
  }

  async findAll(filters: ClienteListFilters = {}): Promise<PaginatedClientesResult> {
    const tenantId = this.getTenantIdOrThrow();
    const params: QueryParam[] = [tenantId];
    const conditions = ['tenant_id = $1', 'deleted_at IS NULL'];

    if (typeof filters.status === 'boolean') {
      params.push(filters.status);
      conditions.push(`is_active = $${params.length}`);
    } else if (filters.status === 'active') {
      params.push('ACTIVE');
      conditions.push(`registration_status = $${params.length}`);
    } else if (filters.status === 'inactive') {
      params.push('INACTIVE');
      conditions.push(`registration_status = $${params.length}`);
    } else if (filters.status === 'blocked') {
      params.push('BLOCKED');
      conditions.push(`registration_status = $${params.length}`);
    }

    if (filters.search && filters.search.length >= 2) {
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm);
      const searchParamIndex = params.length;
      conditions.push(
        `(name ILIKE $${searchParamIndex} OR phone_primary ILIKE $${searchParamIndex} OR email ILIKE $${searchParamIndex})`,
      );
    }

    const limit = this.normalizeLimit(filters.limit);
    const requestedPage = this.normalizePage(filters.page);

    const [countRow] = await this.moduleDatabaseExecutor.executeQuery<CountRow>(
      `
        SELECT COUNT(*)::int AS total
        FROM mod_clientes_clients
        WHERE ${conditions.join(' AND ')}
      `,
      params,
    );

    const total = Number(countRow?.total ?? 0);
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    const page = totalPages === 0 ? 1 : Math.min(requestedPage, totalPages);
    const offset = (page - 1) * limit;

    const queryParams = [...params, limit, offset];
    const limitParamIndex = queryParams.length - 1;
    const offsetParamIndex = queryParams.length;

    const rows = await this.moduleDatabaseExecutor.executeQuery<ClienteRow>(
      `
        SELECT ${CLIENT_SELECT_COLUMNS}
        FROM mod_clientes_clients
        WHERE ${conditions.join(' AND ')}
        ORDER BY name ASC
        LIMIT $${limitParamIndex}
        OFFSET $${offsetParamIndex}
      `,
      queryParams,
    );

    return {
      items: rows.map((row) => this.mapToDomain(row)),
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasPreviousPage: totalPages > 0 && page > 1,
        hasNextPage: totalPages > 0 && page < totalPages,
      },
    };
  }

  async create(data: CreateClienteDTO, client?: PoolClient): Promise<Cliente> {
    const rows = await this.executeQuery<ClienteRow>(
      `
        INSERT INTO mod_clientes_clients (
          tenant_id,
          name,
          document,
          person_type,
          trade_name,
          rg,
          state_registration,
          gender,
          phone_primary,
          phone_secondary,
          email,
          address,
          address_zip,
          address_street,
          address_number,
          address_complement,
          address_neighborhood,
          address_city,
          address_state,
          credit_limit,
          settlement_day,
          customer_group,
          customer_group_id,
          birth_date,
          registration_status,
          observations,
          image_url,
          created_by,
          updated_by
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22, $23, $24,
          $25, $26, $27, $28, $29
        )
        RETURNING ${CLIENT_SELECT_COLUMNS}
      `,
      [
        data.tenantId,
        data.name,
        data.document ?? null,
        data.personType ?? null,
        data.tradeName ?? null,
        data.rg ?? null,
        data.stateRegistration ?? null,
        data.gender ?? null,
        data.phonePrimary,
        data.phoneSecondary ?? null,
        data.email ?? null,
        data.address ?? null,
        data.addressZip ?? null,
        data.addressStreet ?? null,
        data.addressNumber ?? null,
        data.addressComplement ?? null,
        data.addressNeighborhood ?? null,
        data.addressCity ?? null,
        data.addressState ?? null,
        data.creditLimit ?? null,
        data.settlementDay ?? null,
        data.customerGroup ?? null,
        data.customerGroupId ?? null,
        data.birthDate ?? null,
        data.registrationStatus ?? this.resolveRegistrationStatus(data.isActive),
        data.observations ?? null,
        data.imageUrl ?? null,
        data.createdBy ?? null,
        data.updatedBy ?? data.createdBy ?? null,
      ],
      client,
    );

    const [created] = rows;
    if (!created) {
      throw new Error('Nao foi possivel criar o cliente.');
    }

    return this.mapToDomain(created);
  }

  async update(id: string, data: UpdateClienteDTO, client?: PoolClient): Promise<Cliente> {
    const tenantId = this.getTenantIdOrThrow();
    const assignments: string[] = [];
    const params: QueryParam[] = [];

    this.pushUpdate(assignments, params, 'name', data.name);
    this.pushUpdate(assignments, params, 'document', data.document);
    this.pushUpdate(assignments, params, 'person_type', data.personType);
    this.pushUpdate(assignments, params, 'trade_name', data.tradeName);
    this.pushUpdate(assignments, params, 'rg', data.rg);
    this.pushUpdate(assignments, params, 'state_registration', data.stateRegistration);
    this.pushUpdate(assignments, params, 'gender', data.gender);
    this.pushUpdate(assignments, params, 'phone_primary', data.phonePrimary);
    this.pushUpdate(assignments, params, 'phone_secondary', data.phoneSecondary);
    this.pushUpdate(assignments, params, 'email', data.email);
    this.pushUpdate(assignments, params, 'address', data.address);
    this.pushUpdate(assignments, params, 'address_zip', data.addressZip);
    this.pushUpdate(assignments, params, 'address_street', data.addressStreet);
    this.pushUpdate(assignments, params, 'address_number', data.addressNumber);
    this.pushUpdate(assignments, params, 'address_complement', data.addressComplement);
    this.pushUpdate(assignments, params, 'address_neighborhood', data.addressNeighborhood);
    this.pushUpdate(assignments, params, 'address_city', data.addressCity);
    this.pushUpdate(assignments, params, 'address_state', data.addressState);
    this.pushUpdate(assignments, params, 'credit_limit', data.creditLimit);
    this.pushUpdate(assignments, params, 'settlement_day', data.settlementDay);
    this.pushUpdate(assignments, params, 'customer_group', data.customerGroup);
    this.pushUpdate(assignments, params, 'customer_group_id', data.customerGroupId);
    this.pushUpdate(assignments, params, 'birth_date', data.birthDate);
    this.pushUpdate(assignments, params, 'registration_status', data.registrationStatus);
    this.pushUpdate(assignments, params, 'observations', data.observations);
    this.pushUpdate(assignments, params, 'image_url', data.imageUrl);
    this.pushUpdate(assignments, params, 'is_active', data.isActive);
    this.pushUpdate(assignments, params, 'updated_by', data.updatedBy);

    if (assignments.length === 0) {
      const existing = await this.findById(id, client);
      if (!existing) throw new Error('Cliente nao encontrado');
      return existing;
    }

    params.push(id);
    const idParamIndex = params.length;
    params.push(tenantId);
    const tenantParamIndex = params.length;

    const rows = await this.executeQuery<ClienteRow>(
      `
        UPDATE mod_clientes_clients
        SET ${assignments.join(', ')},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $${idParamIndex}
          AND tenant_id = $${tenantParamIndex}
          AND deleted_at IS NULL
        RETURNING ${CLIENT_SELECT_COLUMNS}
      `,
      params,
      client,
    );

    const [updated] = rows;
    if (!updated) throw new Error('Cliente nao encontrado');

    return this.mapToDomain(updated);
  }

  async delete(id: string): Promise<void> {
    const tenantId = this.getTenantIdOrThrow();
    await this.moduleDatabaseExecutor.executeQuery<{ id: string }>(
      `
        UPDATE mod_clientes_clients
        SET deleted_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND tenant_id = $2
          AND deleted_at IS NULL
        RETURNING id
      `,
      [id, tenantId],
    );
  }

  async findByDocument(document: string): Promise<Cliente | null> {
    const tenantId = this.getTenantIdOrThrow();
    const rows = await this.executeQuery<ClienteRow>(
      `
        SELECT ${CLIENT_SELECT_COLUMNS}
        FROM mod_clientes_clients
        WHERE document = $1
          AND tenant_id = $2
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [document, tenantId],
    );

    const [data] = rows;
    return data ? this.mapToDomain(data) : null;
  }

  private getTenantIdOrThrow(): string {
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

    if (!tenantId) {
      throw new Error('Tenant ID nao identificado no contexto atual.');
    }

    return tenantId;
  }

  private normalizeTenantId(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
  }

  private pushUpdate(
    assignments: string[],
    params: QueryParam[],
    column: string,
    value: string | number | boolean | null | undefined,
  ) {
    if (value === undefined) return;
    params.push(value);
    assignments.push(`${column} = $${params.length}`);
  }

  private async executeQuery<T>(
    sql: string,
    params: QueryParam[] = [],
    client?: PoolClient,
  ): Promise<T[]> {
    if (client) {
      return this.moduleDatabaseExecutor.executeQueryWithClient<T>(client, sql, params);
    }
    return this.moduleDatabaseExecutor.executeQuery<T>(sql, params);
  }

  private mapToDomain(data: ClienteRow): Cliente {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      name: data.name,
      document: data.document ?? undefined,
      personType: data.person_type ?? undefined,
      tradeName: data.trade_name ?? undefined,
      rg: data.rg ?? undefined,
      stateRegistration: data.state_registration ?? undefined,
      gender: data.gender ?? undefined,
      phonePrimary: data.phone_primary,
      phoneSecondary: data.phone_secondary ?? undefined,
      email: data.email ?? undefined,
      address: data.address ?? undefined,
      addressZip: data.address_zip ?? undefined,
      addressStreet: data.address_street ?? undefined,
      addressNumber: data.address_number ?? undefined,
      addressComplement: data.address_complement ?? undefined,
      addressNeighborhood: data.address_neighborhood ?? undefined,
      addressCity: data.address_city ?? undefined,
      addressState: data.address_state ?? undefined,
      creditLimit: data.credit_limit !== null && data.credit_limit !== undefined
        ? Number(data.credit_limit) : undefined,
      settlementDay: data.settlement_day ?? undefined,
      customerGroup: data.customer_group ?? undefined,
      customerGroupId: data.customer_group_id ?? undefined,
      birthDate: data.birth_date ? new Date(data.birth_date) : undefined,
      registrationStatus: data.registration_status ?? this.resolveRegistrationStatus(data.is_active),
      observations: data.observations ?? undefined,
      imageUrl: data.image_url ?? undefined,
      isActive: data.is_active ?? true,
      createdBy: data.created_by ?? undefined,
      updatedBy: data.updated_by ?? undefined,
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
    };
  }

  private resolveRegistrationStatus(isActive?: boolean | null): 'ACTIVE' | 'INACTIVE' | 'BLOCKED' {
    return isActive === false ? 'INACTIVE' : 'ACTIVE';
  }

  private normalizePage(value?: number): number {
    if (!Number.isFinite(value)) return 1;
    return Math.max(1, Math.trunc(Number(value)));
  }

  private normalizeLimit(value?: number): number {
    if (!Number.isFinite(value)) return 20;
    return Math.min(100, Math.max(1, Math.trunc(Number(value))));
  }
}
