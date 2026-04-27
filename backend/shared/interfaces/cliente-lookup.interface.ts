export interface ClienteMinimal {
  id: string;
  tenantId: string;
  name: string;
  email?: string;
  phonePrimary: string;
  is_active: boolean;
}

export interface IClienteLookup {
  findById(id: string): Promise<ClienteMinimal | null>;
}
