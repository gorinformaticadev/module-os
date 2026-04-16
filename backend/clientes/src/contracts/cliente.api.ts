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
  isActive: boolean;
}

export interface ClienteAPI {
  findById(id: string): Promise<Cliente | null>;
  findAll(filters?: { search?: string; status?: boolean }): Promise<Cliente[]>;
  findByDocument(document: string): Promise<Cliente | null>;
  create(data: any): Promise<Cliente>;
  update(id: string, data: any): Promise<Cliente>;
  delete(id: string): Promise<void>;
}
