import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../apps/backend/src/core/prisma/prisma.service';
import { AuditService } from '../../../apps/backend/src/core/audit/audit.service';
import { randomUUID } from 'crypto';

@Injectable()
export class ClientesService {
    private readonly logger = new Logger(ClientesService.name);

    constructor(
        private prisma: PrismaService,
        private auditService: AuditService
    ) {
        this.logger.log('✅✅✅ CLIENTES SERVICE INICIADO!!! ✅✅✅');
    }

    async findAll(tenantId: string, filters: any = {}) {
        const { search, status } = filters;
        this.logger.log(`findAll chamado. Tenant: ${tenantId}, Filters: ${JSON.stringify(filters)}`);

        try {
            // Base query
            let query = `SELECT * FROM mod_ordem_servico_clients WHERE tenant_id = $1 AND deleted_at IS NULL`;
            const params: any[] = [tenantId];

            // Search filter
            if (search) {
                query += ` AND (name ILIKE $${params.length + 1} OR document ILIKE $${params.length + 1})`;
                params.push(`%${search}%`);
            }

            // Status filter
            if (status !== undefined && status !== '') {
                this.logger.log(`🔍 Aplicando filtro de status: ${status} (tipo: ${typeof status})`);
                query += ` AND is_active = $${params.length + 1}`;
                params.push(status === 'true');
            }

            query += ` ORDER BY name ASC`;

            this.logger.log(`🔍 Query final: ${query}`);
            this.logger.log(`🔍 Parâmetros: ${JSON.stringify(params)}`);

            const result = await this.prisma.$queryRawUnsafe(query, ...params);
            this.logger.log(`🔍 Resultado da query: ${JSON.stringify(result)}`);
            return result;
        } catch (error) {
            this.logger.error(`❌ Erro na query findAll: ${error.message}`);
            this.logger.error(`❌ Stack trace: ${error.stack}`);
            throw error;
        }
    }

    async findById(tenantId: string, id: string) {
        const result = await this.prisma.$queryRawUnsafe<any[]>(
            `SELECT * FROM mod_ordem_servico_clients WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL LIMIT 1`,
            tenantId, id
        );
        return result[0];
    }

    async findByDocument(tenantId: string, document: string) {
        const result = await this.prisma.$queryRawUnsafe<any[]>(
            `SELECT * FROM mod_ordem_servico_clients WHERE tenant_id = $1 AND document = $2 AND deleted_at IS NULL LIMIT 1`,
            tenantId, document
        );
        return result[0];
    }

    async create(tenantId: string, data: any, userId: string) {
        // Validation
        if (!data.name || !data.phone_primary) {
            throw new Error('Nome e Telefone principal são obrigatórios');
        }

        if (!tenantId) {
            this.logger.error('Tentativa de criação sem Tenant ID');
            throw new Error('Erro interno: Tenant ID não identificado. Faça login novamente.');
        }

        // Check uniqueness if document provided
        if (data.document) {
            const existing = await this.findByDocument(tenantId, data.document);
            if (existing) {
                throw new Error(`O documento "${data.document}" já está em uso por outro cliente.`);
            }
        }

        const id = randomUUID();

        try {
            await this.prisma.$executeRawUnsafe(
                `INSERT INTO mod_ordem_servico_clients 
                (id, tenant_id, name, document, phone_primary, phone_secondary, address, is_active,
                 address_zip, address_street, address_number, address_complement, address_neighborhood, address_city, address_state,
                 observations, image_url)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
                id,
                tenantId,
                data.name,
                data.document || null,
                data.phone_primary,
                data.phone_secondary || null,
                data.address || null,
                data.is_active ?? true,
                data.address_zip || null,
                data.address_street || null,
                data.address_number || null,
                data.address_complement || null,
                data.address_neighborhood || null,
                data.address_city || null,
                data.address_state || null,
                data.observations || null,
                data.image_url || null
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
            throw new Error('Erro ao salvar cliente. Verifique os dados e tente novamente.');
        }
    }

    async update(tenantId: string, id: string, data: any, userId: string) {
        if (!data.name || !data.phone_primary) {
            throw new Error('Nome e Telefone principal são obrigatórios');
        }

        // Check uniqueness if document changed
        if (data.document) {
            const existingDocument = await this.findByDocument(tenantId, data.document);
            if (existingDocument && existingDocument.id !== id) {
                throw new Error(`O documento "${data.document}" já está em uso por outro cliente.`);
            }
        }

        try {
            await this.prisma.$executeRawUnsafe(
                `UPDATE mod_ordem_servico_clients
                SET 
                    name = $3,
                    document = $4,
                    phone_primary = $5,
                    phone_secondary = $6,
                    address = $7,
                    is_active = $8,
                    address_zip = $9,
                    address_street = $10,
                    address_number = $11,
                    address_complement = $12,
                    address_neighborhood = $13,
                    address_city = $14,
                    address_state = $15,
                    observations = $16,
                    image_url = $17,
                    updated_at = NOW()
                WHERE id = $1 AND tenant_id = $2`,
                id,
                tenantId,
                data.name,
                data.document || null,
                data.phone_primary,
                data.phone_secondary || null,
                data.address || null,
                data.is_active ?? true,
                data.address_zip || null,
                data.address_street || null,
                data.address_number || null,
                data.address_complement || null,
                data.address_neighborhood || null,
                data.address_city || null,
                data.address_state || null,
                data.observations || null,
                data.image_url || null
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
        // Verificar se existem OS associadas a este cliente
        try {
            const osCountResult = await this.prisma.$queryRawUnsafe<any[]>(
                `SELECT COUNT(*) as count FROM mod_ordem_servico_os WHERE client_id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
                id, tenantId
            );

            const osCount = parseInt(osCountResult[0]?.count || '0');

            if (osCount > 0) {
                throw new Error('Não é possível excluir o cliente pois existem Ordens de Serviço associadas a ele.');
            }
        } catch (error: any) {
            // Check for Postgres code 42P01 (undefined_table) or Prisma P2010 which wraps it
            const isTableNotFoundError =
                error.code === '42P01' ||
                (error.code === 'P2010' && (error.meta?.code === '42P01' || error.message?.includes('mod_ordem_servico_os')));

            if (isTableNotFoundError) {
                this.logger.warn(`Tabela de OS não encontrada ao excluir cliente ${id}. Ignorando verificação.`);
            } else {
                this.logger.error(`Erro ao verificar OS do cliente: ${error.message} (Code: ${error.code})`);
                throw error;
            }
        }

        await this.prisma.$executeRawUnsafe(
            `UPDATE mod_ordem_servico_clients SET deleted_at = NOW() WHERE id = $1 AND tenant_id = $2`,
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