// Contrato mínimo da Ordem de Serviço

export interface OrdemServico {
  id: string;
  tenantId: string;
  numero: string;
  clienteId: string;
  tipoServico: string;
  descricao: string;
  valorServico: number;
  status: number;
  prioridade: string;
  dataAbertura: Date;
}

export interface OrdemAPI {
  findById(id: string): Promise<OrdemServico | null>;
  findAll(filters?: { search?: string; status?: number; clienteId?: string }): Promise<OrdemServico[]>;
  findByCliente(clienteId: string): Promise<OrdemServico[]>;
  create(data: any): Promise<OrdemServico>;
  update(id: string, data: any): Promise<OrdemServico>;
  delete(id: string): Promise<void>;
}
