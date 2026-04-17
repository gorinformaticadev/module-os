// Contrato mínimo do Cliente
// Usado por outros módulos para dependência

export interface Cliente {
  id: string;
  tenantId: string;
  name: string;
  document?: string;
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
  observations?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ClienteAPI {
  findById(id: string): Promise<Cliente | null>;
  findAll(filters?: { search?: string; status?: boolean }): Promise<Cliente[]>;
  findByDocument(document: string): Promise<Cliente | null>;
  create(data: any): Promise<Cliente>;
  update(id: string, data: any): Promise<Cliente>;
  delete(id: string): Promise<void>;
}
