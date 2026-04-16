import { Injectable, Logger } from '@nestjs/common';
import { AuditService } from '@core/audit/audit.service';
import { RequestSecurityContextService } from '@common/services/request-security-context.service';
import { ProdutoRepository } from './repositories/produto.repository';

@Injectable()
export class ProdutosService {
    private readonly logger = new Logger(ProdutosService.name);

    constructor(
        private readonly repository: ProdutoRepository,
        private readonly auditService: AuditService,
        private readonly requestSecurityContext: RequestSecurityContextService,
    ) {
        this.logger.log('PRODUTOS SERVICE INICIADO');
    }

    async findAll(filters: any = {}) {
        const { search, status } = filters;
        this.logger.log(`findAll chamado. Filters: ${JSON.stringify(filters)}`);

        const products = await this.repository.findAll({
            search,
            isActive: status !== undefined && status !== '' ? status === 'true' || status === true : undefined,
        });

        return products.map((product) => this.serializeProduct(product));
    }

    async findById(id: string) {
        const product = await this.repository.findById(id);
        return product ? this.serializeProduct(product) : null;
    }

    async findByCode(code: string) {
        const product = await this.repository.findByCode(code);
        if (!product) return null;
        return {
            id: product.id,
            tenant_id: product.tenantId,
            code: product.code,
            name: product.name,
            type: product.type,
            price: product.price,
            cost_price: product.costPrice,
            description: product.description,
            image_url: product.imageUrl,
            is_active: product.isActive,
            created_at: product.createdAt?.toISOString?.() ?? null,
            updated_at: product.updatedAt?.toISOString?.() ?? null,
            deleted_at: null,
        };
    }

    async create(data: any) {
        if (!data.name || !data.code || data.price === undefined) {
            throw new Error('Codigo, Nome e Preco sao obrigatorios');
        }

        const existing = await this.repository.findByCode(data.code);
        if (existing) {
            throw new Error(`O codigo "${data.code}" ja esta em uso por outro produto.`);
        }

        try {
            const actor = this.getActorContext();
            const createdProduct = await this.repository.create({
                tenantId: actor.tenantId,
                code: data.code,
                name: data.name,
                price: data.price,
                costPrice: data.cost_price,
                description: data.description,
                type: data.type || 'PRODUCT',
                imageUrl: data.image_url,
            });

            await this.auditService.log({
                action: 'CREATE_PRODUCT',
                userId: actor.userId,
                tenantId: actor.tenantId,
                details: { productId: createdProduct.id, code: data.code, name: data.name },
            });

            return this.serializeProduct(createdProduct);
        } catch (error) {
            this.logger.error('Erro ao criar produto:', error);
            throw new Error('Erro ao salvar produto. Verifique os dados.');
        }
    }

    async update(id: string, data: any) {
        if (!data.name || !data.code || data.price === undefined) {
            throw new Error('Codigo, Nome e Preco sao obrigatorios');
        }

        const existingCode = await this.repository.findByCode(data.code);
        if (existingCode && existingCode.id !== id) {
            throw new Error(`O codigo "${data.code}" ja esta em uso por outro produto.`);
        }

        const existing = await this.repository.findById(id);
        if (!existing) {
            throw new Error('Produto nao encontrado');
        }

        try {
            await this.repository.update(id, {
                code: data.code,
                name: data.name,
                price: data.price,
                costPrice: data.cost_price,
                description: data.description,
                type: data.type || 'PRODUCT',
                imageUrl: data.image_url,
                isActive: data.is_active,
            });

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
        const existing = await this.repository.findById(id);
        if (!existing) {
            throw new Error('Produto nao encontrado');
        }

        const actor = this.getActorContext();

        await this.auditService.log({
            action: 'DELETE_PRODUCT',
            userId: actor.userId,
            tenantId: actor.tenantId,
            details: { productId: id },
        });

        await this.repository.delete(id);

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

    private serializeProduct(product: any) {
        return {
            id: product.id,
            tenant_id: product.tenantId,
            code: product.code,
            name: product.name,
            type: product.type,
            price: Number(product.price || 0),
            cost_price: Number(product.costPrice || 0),
            description: product.description,
            image_url: product.imageUrl,
            is_active: product.isActive ?? true,
            created_at: product.createdAt?.toISOString?.() ?? product.createdAt ?? null,
            updated_at: product.updatedAt?.toISOString?.() ?? product.updatedAt ?? null,
            deleted_at: product.deletedAt?.toISOString?.() ?? product.deletedAt ?? null,
        };
    }
}
