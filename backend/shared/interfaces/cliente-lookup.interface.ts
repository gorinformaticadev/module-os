export interface ClienteMinimal {
  id: string;
  name: string;
  email?: string;
  phone_primary: string;
  is_active: boolean;
}

export interface IClienteLookup {
  findById(id: string): Promise<ClienteMinimal | null>;
}
