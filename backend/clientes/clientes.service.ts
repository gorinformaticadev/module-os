import { BadGatewayException, BadRequestException, Injectable, Logger } from '@nestjs/common';
import { AuditService } from '@core/audit/audit.service';
import { RequestSecurityContextService } from '@common/services/request-security-context.service';
import { ModuleOsPrismaService } from '../prisma/module-os-prisma.service';

@Injectable()
export class ClientesService {
    private readonly logger = new Logger(ClientesService.name);

    constructor(
        private readonly prisma: ModuleOsPrismaService,
        private readonly auditService: AuditService,
        private readonly requestSecurityContext: RequestSecurityContextService,
    ) { }

    async findAll(filters: { search?: string; status?: string | boolean } = {}) {
        const { search, status } = filters;
        const safeSearch = typeof search === 'string' ? search.trim() : '';
        const statusFilter =
            status === '' || status === undefined || status === null
                ? undefined
                : status === true || status === 'true';

        if (safeSearch.length > 0 && safeSearch.length < 2) {
            return [];
        }

        if (safeSearch.length >= 2) {
            const clients = await (this.prisma as any).mod_ordem_servico_clients.findMany({
                where: {
                    deletedAt: null,
                    ...(statusFilter !== undefined ? { isActive: statusFilter } : {}),
                    OR: [
                        { name: { contains: safeSearch, mode: 'insensitive' } },
                        { phonePrimary: { contains: safeSearch } },
                        { email: { contains: safeSearch, mode: 'insensitive' } },
                    ],
                },
                orderBy: { name: 'asc' },
                take: 20,
            });

            return clients.map((client: any) => this.serializeClient(client));
        }

        const clients = await (this.prisma as any).mod_ordem_servico_clients.findMany({
            where: {
                deletedAt: null,
                ...(statusFilter !== undefined ? { isActive: statusFilter } : {}),
            },
            orderBy: { name: 'asc' },
            take: 50,
        });

        return clients.map((client: any) => this.serializeClient(client));
    }

    async findById(id: string) {
        const client = await (this.prisma as any).mod_ordem_servico_clients.findFirst({
            where: {
                id,
                deletedAt: null,
            },
        });

        return client ? this.serializeClient(client) : null;
    }

    async lookupCep(cep: string) {
        const cleanCep = String(cep || '').replace(/\D/g, '');

        if (cleanCep.length !== 8) {
            throw new BadRequestException('CEP invalido.');
        }

        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
            },
        });

        if (!response.ok) {
            this.logger.warn(`ViaCEP respondeu ${response.status} para o CEP ${cleanCep}`);
            throw new BadGatewayException('Falha ao consultar o CEP.');
        }

        const data = await response.json() as {
            erro?: boolean;
            logradouro?: string;
            bairro?: string;
            localidade?: string;
            uf?: string;
            cep?: string;
        };

        if (data.erro) {
            return { success: false };
        }

        return {
            success: true,
            cep: data.cep ?? cleanCep,
            logradouro: data.logradouro ?? '',
            bairro: data.bairro ?? '',
            localidade: data.localidade ?? '',
            uf: data.uf ?? '',
        };
    }

    async create(data: any) {
        if (!data.name || !data.phone_primary) {
            throw new Error('Nome e Telefone principal sao obrigatorios');
        }

        try {
            const actor = this.getActorContext();
            const createdClient = await (this.prisma as any).mod_ordem_servico_clients.create({
                data: {
                    tenantId: actor.tenantId,
                    name: data.name,
                    document: data.document || null,
                    phonePrimary: data.phone_primary,
                    phoneSecondary: data.phone_secondary || null,
                    address: data.address || null,
                    isActive: data.is_active ?? true,
                    addressZip: data.address_zip || null,
                    addressStreet: data.address_street || null,
                    addressNumber: data.address_number || null,
                    addressComplement: data.address_complement || null,
                    addressNeighborhood: data.address_neighborhood || null,
                    addressCity: data.address_city || null,
                    addressState: data.address_state || null,
                    observations: data.observations || null,
                    imageUrl: data.image_url || null,
                    email: data.email || null,
                },
            });

            await this.auditService.log({
                action: 'CREATE_CLIENT',
                userId: actor.userId,
                tenantId: actor.tenantId,
                details: { clientId: createdClient.id, name: data.name },
            });

            return this.serializeClient(createdClient);
        } catch (error) {
            this.logger.error('Erro ao criar cliente:', error);
            throw new Error('Erro ao salvar no banco de dados. Verifique os dados e tente novamente.');
        }
    }

    async update(id: string, data: any) {
        if (!data.name || !data.phone_primary) {
            throw new Error('Nome e Telefone principal sao obrigatorios');
        }

        try {
            const updated = await (this.prisma as any).mod_ordem_servico_clients.updateMany({
                where: { id, deletedAt: null },
                data: {
                    name: data.name,
                    document: data.document || null,
                    phonePrimary: data.phone_primary,
                    phoneSecondary: data.phone_secondary || null,
                    address: data.address || null,
                    isActive: data.is_active ?? true,
                    addressZip: data.address_zip || null,
                    addressStreet: data.address_street || null,
                    addressNumber: data.address_number || null,
                    addressComplement: data.address_complement || null,
                    addressNeighborhood: data.address_neighborhood || null,
                    addressCity: data.address_city || null,
                    addressState: data.address_state || null,
                    observations: data.observations || null,
                    imageUrl: data.image_url || null,
                    email: data.email || null,
                    updatedAt: new Date(),
                },
            });

            if (updated.count === 0) {
                throw new Error('Cliente nao encontrado');
            }

            const actor = this.getActorContext();

            await this.auditService.log({
                action: 'UPDATE_CLIENT',
                userId: actor.userId,
                tenantId: actor.tenantId,
                details: { clientId: id, updates: data },
            });

            return this.findById(id);
        } catch (error) {
            this.logger.error('Erro ao atualizar cliente:', error);
            throw error;
        }
    }

    async delete(id: string) {
        const osCount = await (this.prisma as any).mod_ordem_servico_ordens.count({
            where: { clienteId: id },
        });

        if (osCount > 0) {
            throw new Error('Nao e possivel excluir o cliente pois existem Ordens de Servico associadas a ele.');
        }

        await (this.prisma as any).mod_ordem_servico_clients.updateMany({
            where: { id, deletedAt: null },
            data: {
                deletedAt: new Date(),
                updatedAt: new Date(),
            },
        });

        const actor = this.getActorContext();

        await this.auditService.log({
            action: 'DELETE_CLIENT',
            userId: actor.userId,
            tenantId: actor.tenantId,
            details: { clientId: id },
        });

        return { success: true };
    }

    private getActorContext() {
        const actor = this.requestSecurityContext.getActor();
        const tenantId = actor?.tenantId || this.requestSecurityContext.getTenantId();

        if (!tenantId) {
            throw new Error('Tenant ID nao identificado no contexto atual.');
        }

        return {
            tenantId,
            userId: actor?.id || undefined,
        };
    }

    private serializeClient(client: any) {
        return {
            id: client.id,
            name: client.name,
            document: client.document,
            phone_primary: client.phonePrimary,
            phone_secondary: client.phoneSecondary,
            email: client.email,
            address: client.address,
            address_zip: client.addressZip,
            address_street: client.addressStreet,
            address_number: client.addressNumber,
            address_complement: client.addressComplement,
            address_neighborhood: client.addressNeighborhood,
            address_city: client.addressCity,
            address_state: client.addressState,
            observations: client.observations,
            image_url: client.imageUrl,
            is_active: client.isActive ?? true,
            created_at: client.createdAt?.toISOString?.() ?? client.createdAt ?? null,
            updated_at: client.updatedAt?.toISOString?.() ?? client.updatedAt ?? null,
            deleted_at: client.deletedAt?.toISOString?.() ?? client.deletedAt ?? null,
        };
    }
}
