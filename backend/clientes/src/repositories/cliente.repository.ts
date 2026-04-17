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
    const data = await this.prisma.mod_clientes_clients.findFirst({
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

    const results = await this.prisma.mod_clientes_clients.findMany({
      where,
      orderBy: { name: 'asc' },
      take: 20,
    });

    return results.map(this.mapToDomain);
  }

  async create(data: CreateClienteDTO): Promise<Cliente> {
    const created = await this.prisma.mod_clientes_clients.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        document: data.document,
        phonePrimary: data.phonePrimary,
        phoneSecondary: data.phoneSecondary,
        email: data.email,
        address: data.address,
        addressZip: data.addressZip,
        addressStreet: data.addressStreet,
        addressNumber: data.addressNumber,
        addressComplement: data.addressComplement,
        addressNeighborhood: data.addressNeighborhood,
        addressCity: data.addressCity,
        addressState: data.addressState,
        observations: data.observations,
        imageUrl: data.imageUrl,
      },
    });

    return this.mapToDomain(created);
  }

  async update(id: string, data: UpdateClienteDTO): Promise<Cliente> {
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.document !== undefined) updateData.document = data.document;
    if (data.phonePrimary !== undefined) updateData.phonePrimary = data.phonePrimary;
    if (data.phoneSecondary !== undefined) updateData.phoneSecondary = data.phoneSecondary;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.addressZip !== undefined) updateData.addressZip = data.addressZip;
    if (data.addressStreet !== undefined) updateData.addressStreet = data.addressStreet;
    if (data.addressNumber !== undefined) updateData.addressNumber = data.addressNumber;
    if (data.addressComplement !== undefined) updateData.addressComplement = data.addressComplement;
    if (data.addressNeighborhood !== undefined) updateData.addressNeighborhood = data.addressNeighborhood;
    if (data.addressCity !== undefined) updateData.addressCity = data.addressCity;
    if (data.addressState !== undefined) updateData.addressState = data.addressState;
    if (data.observations !== undefined) updateData.observations = data.observations;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updated = await this.prisma.mod_clientes_clients.update({
      where: { id },
      data: updateData,
    });

    return this.mapToDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.mod_clientes_clients.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findByDocument(document: string): Promise<Cliente | null> {
    const data = await this.prisma.mod_clientes_clients.findFirst({
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
      tenantId: data.tenantId,
      name: data.name,
      document: data.document ?? undefined,
      phonePrimary: data.phonePrimary,
      phoneSecondary: data.phoneSecondary ?? undefined,
      email: data.email ?? undefined,
      address: data.address ?? undefined,
      addressZip: data.addressZip ?? undefined,
      addressStreet: data.addressStreet ?? undefined,
      addressNumber: data.addressNumber ?? undefined,
      addressComplement: data.addressComplement ?? undefined,
      addressNeighborhood: data.addressNeighborhood ?? undefined,
      addressCity: data.addressCity ?? undefined,
      addressState: data.addressState ?? undefined,
      observations: data.observations ?? undefined,
      imageUrl: data.imageUrl ?? undefined,
      isActive: data.isActive ?? true,
      createdAt: data.createdAt ?? new Date(),
      updatedAt: data.updatedAt ?? new Date(),
    };
  }
}
