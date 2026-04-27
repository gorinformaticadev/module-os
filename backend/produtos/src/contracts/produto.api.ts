// Contrato mínimo do Produto

export interface Produto {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  type: "PRODUCT" | "SERVICE";
  price: number;
  costPrice?: number;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProdutoAPI {
  findById(id: string): Promise<Produto | null>;
  findByCode(code: string): Promise<Produto | null>;
  findAll(filters?: {
    search?: string;
    isActive?: boolean;
  }): Promise<Produto[]>;
  create(data: any): Promise<Produto>;
  update(id: string, data: any): Promise<Produto>;
  delete(id: string): Promise<void>;
}
