import { Injectable, Logger } from "@nestjs/common";
import { ModuleOsPrismaService } from "../../../prisma/module-os-prisma.service";
import { Produto } from "../contracts/produto.api";

interface CreateProdutoDTO {
  tenantId: string;
  code: string;
  name: string;
  type?: "PRODUCT" | "SERVICE";
  price: number;
  costPrice?: number;
  description?: string;
  imageUrl?: string;
}

interface UpdateProdutoDTO {
  code?: string;
  name?: string;
  type?: "PRODUCT" | "SERVICE";
  price?: number;
  costPrice?: number;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
}

interface ProdutoFilters {
  search?: string;
  isActive?: boolean;
  type?: string;
}

@Injectable()
export class ProdutoRepository {
  private readonly logger = new Logger(ProdutoRepository.name);

  constructor(private readonly prisma: ModuleOsPrismaService) {}

  async findById(id: string): Promise<Produto | null> {
    const data = await this.prisma.mod_ordem_servico_products.findUnique({
      where: { id },
    });

    if (!data || data.deletedAt) return null;

    return this.mapToDomain(data);
  }

  async findByCode(code: string): Promise<Produto | null> {
    const data = await this.prisma.mod_ordem_servico_products.findFirst({
      where: { code, deletedAt: null },
    });

    if (!data) return null;

    return this.mapToDomain(data);
  }

  async findAll(filters: ProdutoFilters = {}): Promise<Produto[]> {
    const { search, isActive, type } = filters;

    const where: any = { deletedAt: null };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (type) {
      where.type = type;
    }

    if (search && search.length >= 2) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }

    const results = await this.prisma.mod_ordem_servico_products.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return results.map(this.mapToDomain);
  }

  async create(data: CreateProdutoDTO): Promise<Produto> {
    const created = await this.prisma.mod_ordem_servico_products.create({
      data: {
        tenantId: data.tenantId,
        code: data.code,
        name: data.name,
        type: data.type || "PRODUCT",
        price: data.price,
        costPrice: data.costPrice,
        description: data.description,
        imageUrl: data.imageUrl,
      },
    });

    return this.mapToDomain(created);
  }

  async update(id: string, data: UpdateProdutoDTO): Promise<Produto> {
    const updateData: any = {};

    if (data.code !== undefined) updateData.code = data.code;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.costPrice !== undefined) updateData.costPrice = data.costPrice;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updated = await this.prisma.mod_ordem_servico_products.update({
      where: { id },
      data: updateData,
    });

    return this.mapToDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.mod_ordem_servico_products.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private mapToDomain(data: any): Produto {
    return {
      id: data.id,
      tenantId: data.tenantId,
      code: data.code,
      name: data.name,
      type: data.type as "PRODUCT" | "SERVICE",
      price: Number(data.price),
      costPrice: data.costPrice ? Number(data.costPrice) : undefined,
      description: data.description ?? undefined,
      imageUrl: data.imageUrl ?? undefined,
      isActive: data.isActive ?? true,
      createdAt: data.createdAt ?? new Date(),
      updatedAt: data.updatedAt ?? new Date(),
    };
  }
}
