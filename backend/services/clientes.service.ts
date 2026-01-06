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
        this.logger.log(`findAll chamado. Tenant: ${tenantId}, Filters: ${JSON.stringify(filters)}`);

        // Primeiro, vamos testar se a tabela existe
        try {
            const testQuery = `SELECT COUNT(*)::int as total FROM mod_ordem_servico_clients WHERE tenant_id = $1`;
            const testResult = await this.prisma.$queryRawUnsafe(testQuery, tenantId);
            this.logger.log(`Teste de conexão bem-sucedido. Total de registros: ${(testResult as any[])[0]?.total || 0}`);
        } catch (error) {
            this.logger.error('Erro no teste de conexão:', error);
            throw new Error('Tabela de clientes não encontrada. Verifique se o módulo foi instalado corretamente.');
        }

        let query = `SELECT * FROM mod_ordem_servico_clients WHERE tenant_id = $1 AND deleted_at IS NULL`;
        const params: any[] = [tenantId];

        if (search) {
            query += ` AND (name ILIKE ${params.length + 1} OR document ILIKE ${params.length + 1} OR phone_primary ILIKE ${params.length + 1})`;
            params.push(`%${search}%`);
        }

        if (status !== undefined && status !== '') {
            query += ` AND is_active = ${params.length + 1}`;
            params.push(status === 'true');
        }

        query += ` ORDER BY name ASC`;

        this.logger.log(`Executando query: ${query}`);
        this.logger.log(`Parâmetros: ${JSON.stringify(params)}`);

        try {
            const result = await this.prisma.$queryRawUnsafe(query, ...params);
            this.logger.log(`Query executada com sucesso. Retornando ${(result as any[]).length} registros`);
            return result;
        } catch (error) {
            this.logger.error('Erro na query de clientes:', error);
            throw error;
        }
    }

    async findById(tenantId: string, id: string) {
        const result = await this.prisma.$queryRawUnsafe<any[]>(
            `SELECT * FROM mod_ordem_servico_clients WHERE tenant_id = $1 AND id = $2::uuid AND deleted_at IS NULL LIMIT 1`,
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

        // const id = randomUUID(); // Let database generate it
        const id = randomUUID(); // Generate UUID manually since table doesn't have DEFAULT

        try {
            const result = await this.prisma.$queryRawUnsafe<any[]>(
                `INSERT INTO mod_ordem_servico_clients 
                (id, tenant_id, name, document, phone_primary, phone_secondary, address, is_active,
                 address_zip, address_street, address_number, address_complement, address_neighborhood, address_city, address_state,
                 observations, image_url)
                VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                RETURNING id`,
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

            const newId = result[0].id;

            await this.auditService.log({
                action: 'CREATE_CLIENT',
                userId,
                tenantId,
                details: { clientId: newId, name: data.name }
            });

            return { id: newId, ...data };
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
                `UPDATE mod_ordem_servico_clients
                SET 
                    name = $3,
                document = $4,
                phone_primary = $5,
                phone_secondary = $6,
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
                WHERE id = $1::uuid AND tenant_id = $2`,
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
                `SELECT COUNT(*) as count FROM mod_ordem_servico_os WHERE client_id = $1:: uuid AND tenant_id = $2 AND deleted_at IS NULL`,
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
                this.logger.warn(`Tabela de OS não encontrada ao excluir cliente ${id}.Ignorando verificação.`);
            } else {
                this.logger.error(`Erro ao verificar OS do cliente: ${error.message}(Code: ${error.code})`);
                throw error;
            }
        }

        await this.prisma.$executeRawUnsafe(
            `UPDATE mod_ordem_servico_clients SET deleted_at = NOW() WHERE id = $1::uuid AND tenant_id = $2`,
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