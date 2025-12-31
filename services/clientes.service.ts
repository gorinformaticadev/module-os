import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { AuditService } from '@core/audit/audit.service';
import { randomUUID } from 'crypto';

@Injectable()
export class ClientesService {
    private readonly logger = new Logger(ClientesService.name);

    constructor(
        private prisma: PrismaService,
        private auditService: AuditService
    ) { }

    async findAll(tenantId: string, filters: any = {}) {
        const { search, status } = filters;

        let query = `SELECT * FROM mod_ordemServico_clients WHERE tenant_id = $1 AND deleted_at IS NULL`;
        const params: any[] = [tenantId];

        if (search) {
            query += ` AND (name ILIKE $${params.length + 1} OR document ILIKE $${params.length + 1} OR phone_primary ILIKE $${params.length + 1})`;
            params.push(`%${search}%`);
        }

        if (status !== undefined && status !== '') {
            query += ` AND is_active = $${params.length + 1}`;
            params.push(status === 'true');
        }

        query += ` ORDER BY name ASC`;

        return this.prisma.$queryRawUnsafe(query, ...params);
    }

    async findById(tenantId: string, id: string) {
        const result = await this.prisma.$queryRawUnsafe<any[]>(
            `SELECT * FROM mod_ordemServico_clients WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL LIMIT 1`,
            tenantId, id
        );
        return result[0];
    }

    async create(tenantId: string, data: any, userId: string) {
        if (!data.name || !data.phone_primary) {
            throw new Error('Nome e Telefone principal são obrigatórios');
        }
        if (!tenantId) {
            this.logger.error('Tentativa de criação sem Tenant ID');
            throw new Error('Erro interno: Tenant ID não identificado. Faça login novamente.');
        }

        const id = randomUUID();

        try {
            await this.prisma.$executeRawUnsafe(
                `INSERT INTO mod_ordemServico_clients 
                (id, tenant_id, name, document, phone_primary, phone_secondary, address, is_active)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                id,
                tenantId,
                data.name,
                data.document || null,
                data.phone_primary,
                data.phone_secondary || null,
                data.address || null,
                data.is_active ?? true
            );

            await this.auditService.log({
                action: 'CREATE_CLIENT',
                userId,
                tenantId,
                details: { clientId: id, name: data.name }
            });

            return { id, ...data };
        } catch (error) {
            this.logger.error('Erro ao criar cliente:', error);
            throw new Error('Erro ao salvar no banco de dados. Verifique os dados e tente novamente.');
        }
    }

    async update(tenantId: string, id: string, data: any, userId: string) {
        if (!data.name || !data.phone_primary) {
            throw new Error('Nome e Telefone principal são obrigatórios');
        }

        try {
            await this.prisma.$executeRawUnsafe(
                `UPDATE mod_ordemServico_clients
                SET 
                    name = $3,
                    document = $4,
                    phone_primary = $5,
                    phone_secondary = $6,
                    address = $7,
                    is_active = $8,
                    updated_at = NOW()
                WHERE id = $1 AND tenant_id = $2`,
                id,
                tenantId,
                data.name,
                data.document || null,
                data.phone_primary,
                data.phone_secondary || null,
                data.address || null,
                data.is_active ?? true
            );

            await this.auditService.log({
                action: 'UPDATE_CLIENT',
                userId,
                tenantId,
                details: { clientId: id, updates: data }
            });

            return { id, ...data };
        } catch (error) {
            this.logger.error('Erro ao atualizar cliente:', error);
            throw error;
        }
    }

    async delete(tenantId: string, id: string, userId: string) {
        await this.prisma.$executeRawUnsafe(
            `UPDATE mod_ordemServico_clients SET deleted_at = NOW() WHERE id = $1 AND tenant_id = $2`,
            id, tenantId
        );

        await this.auditService.log({
            action: 'DELETE_CLIENT',
            userId,
            tenantId,
            details: { clientId: id }
        });

        return { success: true };
    }
}
