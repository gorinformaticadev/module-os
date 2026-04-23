export interface IClienteDeletionGuard {
  canDelete(clienteId: string): Promise<{ allowed: boolean; reason?: string }>;
}