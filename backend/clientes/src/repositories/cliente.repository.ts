import { Injectable, Logger } from '@nestjs/common';
import { ModuleOsPrismaService } from '../../../prisma/module-os-prisma.service';
import { Cliente } from '../contracts/cliente.api';

interface CreateClienteDTO {
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
}

interface UpdateClienteDTO {
  name?: string;
  document?: string;
  phonePrimary?: string;
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
  isActive?: boolean;
}

interface ClienteFilters {
  search?: string;
  status?: boolean;
}

@Injectable()
export class ClienteRepository {
  private readonly logger = new Logger(ClienteRepository.name);

  constructor(private readonly prisma: ModuleOsPrismaService) {}

  async findById(id: string): Promise<Cliente | null> {
    const data = await this.prisma.mod_ordem_servico_clients.findFirst({
      where: { id, deletedAt: null },
    });

    if (!data) return null;

    return this.mapToDomain(data);
  }

  async findAll(filters: ClienteFilters = {}): Promise<Cliente[]> {
    const { search, status } = filters;

    const where: any = { deletedAt: null };

    if (status !== undefined) {
      where.isActive = status;
    }

    if (search && search.length >= 2) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phonePrimary: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const results = await this.prisma.mod_ordem_servico_clients.findMany({
      where,
      orderBy: { name: 'asc' },
      take: 20,
    });

    return results.map(this.mapToDomain);
  }

  async create(data: CreateClienteDTO): Promise<Cliente> {
    const created = await this.prisma.mod_ordem_servico_clients.create({
      data: {
        tenant_id: data.tenantId,
        name: data.name,
        document: data.document,
        phone_primary: data.phonePrimary,
        phone_secondary: data.phoneSecondary,
        email: data.email,
        address: data.address,
        address_zip: data.addressZip,
        address_street: data.addressStreet,
        address_number: data.addressNumber,
        address_complement: data.addressComplement,
        address_neighborhood: data.addressNeighborhood,
        address_city: data.addressCity,
        address_state: data.addressState,
        observations: data.observations,
        image_url: data.imageUrl,
      },
    });

    return this.mapToDomain(created);
  }

  async update(id: string, data: UpdateClienteDTO): Promise<Cliente> {
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.document !== undefined) updateData.document = data.document;
    if (data.phonePrimary !== undefined) updateData.phone_primary = data.phonePrimary;
    if (data.phoneSecondary !== undefined) updateData.phone_secondary = data.phoneSecondary;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.addressZip !== undefined) updateData.address_zip = data.addressZip;
    if (data.addressStreet !== undefined) updateData.address_street = data.addressStreet;
    if (data.addressNumber !== undefined) updateData.address_number = data.addressNumber;
    if (data.addressComplement !== undefined) updateData.address_complement = data.addressComplement;
    if (data.addressNeighborhood !== undefined) updateData.address_neighborhood = data.addressNeighborhood;
    if (data.addressCity !== undefined) updateData.address_city = data.addressCity;
    if (data.addressState !== undefined) updateData.address_state = data.addressState;
    if (data.observations !== undefined) updateData.observations = data.observations;
    if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;

    const updated = await this.prisma.mod_ordem_servico_clients.update({
      where: { id },
      data: updateData,
    });

    return this.mapToDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.mod_ordem_servico_clients.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findByDocument(document: string): Promise<Cliente | null> {
    const data = await this.prisma.mod_ordem_servico_clients.findFirst({
      where: { document },
    });

    if (!data) return null;

    return this.mapToDomain(data);
  }

  async countOrdensByClienteId(clienteId: string): Promise<number> {
    return this.prisma.mod_ordem_servico_ordens.count({
      where: { clienteId },
    });
  }

  private mapToDomain(data: any): Cliente {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      name: data.name,
      document: data.document ?? undefined,
      phonePrimary: data.phone_primary,
      phoneSecondary: data.phone_secondary ?? undefined,
      email: data.email ?? undefined,
      address: data.address ?? undefined,
      addressZip: data.address_zip ?? undefined,
      addressStreet: data.address_street ?? undefined,
      addressNumber: data.address_number ?? undefined,
      addressComplement: data.address_complement ?? undefined,
      addressNeighborhood: data.address_neighborhood ?? undefined,
      addressCity: data.address_city ?? undefined,
      addressState: data.address_state ?? undefined,
      observations: data.observations ?? undefined,
      imageUrl: data.image_url ?? undefined,
      isActive: data.is_active ?? true,
      createdAt: data.created_at ?? new Date(),
      updatedAt: data.updated_at ?? new Date(),
    };
  }
}
