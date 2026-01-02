export class CreatemoduloOsDto {
  name: string;
  description?: string;
}

export class UpdatemoduloOsDto {
  name?: string;
  description?: string;
}

export class FiltermoduloOsDto {
  limit?: number;
  offset?: number;
}
