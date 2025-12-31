import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { AuditService } from '@core/audit/audit.service';
import { randomUUID } from 'crypto';

@Injectable()
export class ProdutosService {
    private readonly logger = new Logger(ProdutosService.name);

    constructor(
        private prisma: PrismaService,
        private auditService: AuditService
    ) {
        this.logger.log('✅✅✅ PRODUTOS SERVICE INICIADO!!! ✅✅✅');
    }

    async findAll(tenantId: string, filters: any = {}) {
        const { search, status } = filters;
        this.logger.log(`findAll chamado. Tenant: ${tenantId}, Filters: ${JSON.stringify(filters)}`);

        // Base query
        let query = `SELECT * FROM mod_ordemServico_products WHERE tenant_id = $1 AND deleted_at IS NULL`;
        const params: any[] = [tenantId];

        // Search filter
        if (search) {
            query += ` AND (name ILIKE $${params.length + 1} OR code ILIKE $${params.length + 1})`;
            params.push(`%${search}%`);
        }

        // Status filter
        if (status !== undefined && status !== '') {
            query += ` AND is_active = $${params.length + 1}`;
            params.push(status === 'true');
        }

        query += ` ORDER BY name ASC`;

        return this.prisma.$queryRawUnsafe(query, ...params);
    }

    async findById(tenantId: string, id: string) {
        const result = await this.prisma.$queryRawUnsafe<any[]>(
            `SELECT * FROM mod_ordemServico_products WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL LIMIT 1`,
            tenantId, id
        );
        return result[0];
    }

    async findByCode(tenantId: string, code: string) {
        const result = await this.prisma.$queryRawUnsafe<any[]>(
            `SELECT * FROM mod_ordemServico_products WHERE tenant_id = $1 AND code = $2 AND deleted_at IS NULL LIMIT 1`,
            tenantId, code
        );
        return result[0];
    }

    async create(tenantId: string, data: any, userId: string) {
        // Validation
        if (!data.name || !data.code || data.price === undefined) {
            throw new Error('Código, Nome e Preço são obrigatórios');
        }

        // Check uniqueness
        const existing = await this.findByCode(tenantId, data.code);
        if (existing) {
            throw new Error(`O código "${data.code}" já está em uso por outro produto.`);
        }

        const id = randomUUID();

        try {
            await this.prisma.$executeRawUnsafe(
                `INSERT INTO mod_ordemServico_products 
                (id, tenant_id, code, name, price, description, is_active, type, cost_price, image_url)
                VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                id,
                tenantId,
                data.code,
                data.name,
                data.price,
                data.description || null,
                data.is_active ?? true,
                data.type || 'PRODUCT',
                data.cost_price || 0,
                data.image_url || null
            );

            await this.auditService.log({
                action: 'CREATE_PRODUCT',
                userId,
                tenantId,
                details: { productId: id, code: data.code, name: data.name }
            });

            return { id, ...data };
        } catch (error) {
            this.logger.error('Erro ao criar produto:', error);
            throw new Error('Erro ao salvar produto. Verifique os dados.');
        }
    }

    async update(tenantId: string, id: string, data: any, userId: string) {
        if (!data.name || !data.code || data.price === undefined) {
            throw new Error('Código, Nome e Preço são obrigatórios');
        }

        // Check uniqueness if code changed
        const existingCode = await this.findByCode(tenantId, data.code);
        if (existingCode && existingCode.id !== id) {
            throw new Error(`O código "${data.code}" já está em uso por outro produto.`);
        }

        try {
            await this.prisma.$executeRawUnsafe(
                `UPDATE mod_ordemServico_products
                SET 
                    code = $3,
                    name = $4,
                    price = $5,
                    description = $6,
                    is_active = $7,
                    type = $8,
                    cost_price = $9,
                    image_url = $10,
                    updated_at = NOW()
                WHERE id = $1::uuid AND tenant_id = $2`,
                id,
                tenantId,
                data.code,
                data.name,
                data.price,
                data.description || null,
                data.is_active ?? true,
                data.type || 'PRODUCT',
                data.cost_price || 0,
                data.image_url || null
            );

            await this.auditService.log({
                action: 'UPDATE_PRODUCT',
                userId,
                tenantId,
                details: { productId: id, updates: data }
            });

            return { id, ...data };
        } catch (error) {
            this.logger.error('Erro ao atualizar produto:', error);
            throw error;
        }
    }

    async delete(tenantId: string, id: string, userId: string) {
        await this.prisma.$executeRawUnsafe(
            `UPDATE mod_ordemServico_products SET deleted_at = NOW() WHERE id = $1::uuid AND tenant_id = $2`,
            id, tenantId
        );

        await this.auditService.log({
            action: 'DELETE_PRODUCT',
            userId,
            tenantId,
            details: { productId: id }
        });

        return { success: true };
    }
}
