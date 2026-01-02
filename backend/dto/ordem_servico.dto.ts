export class CreateOrdemServicoDto {
  name: string;
  description?: string;
}

export class UpdateOrdemServicoDto {
  name?: string;
  description?: string;
}

export class FilterOrdemServicoDto {
  limit?: number;
  offset?: number;
}
