// Contrato completo do Cliente - alinhado com o módulo clientes

export interface Cliente {
  id: string;
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
  customerGroupId?: string;
  birthDate?: Date;
  registrationStatus?: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  observations?: string;
  imageUrl?: string;
  isActive: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface ClienteListFilters {
  search?: string;
  status?: boolean | 'active' | 'inactive' | 'blocked';
  page?: number;
  limit?: number;
}

export interface PaginatedClientesResult {
  items: Record<string, any>[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}

export interface ClienteAPI {
  findById(id: string): Promise<Cliente | null>;
  findAll(filters?: ClienteListFilters): Promise<PaginatedClientesResult>;
  findByDocument(document: string): Promise<Cliente | null>;
  create(data: any): Promise<Cliente>;
  update(id: string, data: any): Promise<Cliente>;
  delete(id: string): Promise<void>;
}
