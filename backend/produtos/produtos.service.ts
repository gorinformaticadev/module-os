import { Injectable, Logger } from '@nestjs/common';
import { AuditService } from '@core/audit/audit.service';
import { RequestSecurityContextService } from '@common/services/request-security-context.service';
import { ModuleOsPrismaService } from '../prisma/module-os-prisma.service';

@Injectable()
export class ProdutosService {
    private readonly logger = new Logger(ProdutosService.name);

    constructor(
        private readonly prisma: ModuleOsPrismaService,
        private readonly auditService: AuditService,
        private readonly requestSecurityContext: RequestSecurityContextService,
    ) {
        this.logger.log('PRODUTOS SERVICE INICIADO');
    }

    async findAll(filters: any = {}) {
        const { search, status } = filters;
        this.logger.log(`findAll chamado. Filters: ${JSON.stringify(filters)}`);

        return this.prisma.mod_ordem_servico_products.findMany({
            where: {
                deletedAt: null,
                ...(search
                    ? {
                        OR: [
                            { name: { contains: search, mode: 'insensitive' } },
                            { code: { contains: search, mode: 'insensitive' } },
                        ],
                    }
                    : {}),
                ...(status !== undefined && status !== ''
                    ? { isActive: status === 'true' || status === true }
                    : {}),
            },
            orderBy: { name: 'asc' },
        });
    }

    async findById(id: string) {
        return this.prisma.mod_ordem_servico_products.findFirst({
            where: { id, deletedAt: null },
        });
    }

    async findByCode(code: string) {
        return this.prisma.mod_ordem_servico_products.findFirst({
            where: { code, deletedAt: null },
        });
    }

    async create(data: any) {
        if (!data.name || !data.code || data.price === undefined) {
            throw new Error('Codigo, Nome e Preco sao obrigatorios');
        }

        const existing = await this.findByCode(data.code);
        if (existing) {
            throw new Error(`O codigo "${data.code}" ja esta em uso por outro produto.`);
        }

        try {
            const actor = this.getActorContext();
            const createdProduct = await this.prisma.mod_ordem_servico_products.create({
                data: {
                    tenantId: actor.tenantId,
                    code: data.code,
                    name: data.name,
                    price: data.price,
                    costPrice: data.cost_price || 0,
                    description: data.description || null,
                    type: data.type || 'PRODUCT',
                    imageUrl: data.image_url || null,
                    isActive: data.is_active ?? true,
                },
            });

            await this.auditService.log({
                action: 'CREATE_PRODUCT',
                userId: actor.userId,
                tenantId: actor.tenantId,
                details: { productId: createdProduct.id, code: data.code, name: data.name },
            });

            return createdProduct;
        } catch (error) {
            this.logger.error('Erro ao criar produto:', error);
            throw new Error('Erro ao salvar produto. Verifique os dados.');
        }
    }

    async update(id: string, data: any) {
        if (!data.name || !data.code || data.price === undefined) {
            throw new Error('Codigo, Nome e Preco sao obrigatorios');
        }

        const existingCode = await this.findByCode(data.code);
        if (existingCode && existingCode.id !== id) {
            throw new Error(`O codigo "${data.code}" ja esta em uso por outro produto.`);
        }

        try {
            const updated = await this.prisma.mod_ordem_servico_products.updateMany({
                where: { id, deletedAt: null },
                data: {
                    code: data.code,
                    name: data.name,
                    price: data.price,
                    costPrice: data.cost_price || 0,
                    description: data.description || null,
                    type: data.type || 'PRODUCT',
                    imageUrl: data.image_url || null,
                    isActive: data.is_active ?? true,
                    updatedAt: new Date(),
                },
            });

            if (updated.count === 0) {
                throw new Error('Produto nao encontrado');
            }

            const actor = this.getActorContext();

            await this.auditService.log({
                action: 'UPDATE_PRODUCT',
                userId: actor.userId,
                tenantId: actor.tenantId,
                details: { productId: id, updates: data },
            });

            return this.findById(id);
        } catch (error) {
            this.logger.error('Erro ao atualizar produto:', error);
            throw error;
        }
    }

    async delete(id: string) {
        await this.prisma.mod_ordem_servico_products.updateMany({
            where: { id, deletedAt: null },
            data: {
                deletedAt: new Date(),
                updatedAt: new Date(),
            },
        });

        const actor = this.getActorContext();

        await this.auditService.log({
            action: 'DELETE_PRODUCT',
            userId: actor.userId,
            tenantId: actor.tenantId,
            details: { productId: id },
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
}
