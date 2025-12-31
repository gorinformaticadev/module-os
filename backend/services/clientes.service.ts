import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { AuditService } from '@core/audit/audit.service';

@Injectable()
export class ClientesService {
    private readonly logger = new Logger(ClientesService.name);

    constructor(
        private prisma: PrismaService,
        private auditService: AuditService
    ) { }

    async findAll(tenantId: string, filters: any = {}) {
        const { search, status } = filters;
        let query = `
            SELECT * FROM mod_ordemServico_clients 
            WHERE tenant_id = '${tenantId}' 
            AND deleted_at IS NULL
        `;

        if (search) {
            const safeSearch = search.replace(/'/g, "''");
            query += ` AND (name ILIKE '%${safeSearch}%' OR document ILIKE '%${safeSearch}%' OR phone_primary ILIKE '%${safeSearch}%')`;
        }

        if (status !== undefined && status !== '') {
            query += ` AND is_active = ${status === 'true'}`;
        }

        query += ` ORDER BY name ASC`;

        return this.prisma.$queryRawUnsafe(query);
    }

    async findById(tenantId: string, id: string) {
        const result = await this.prisma.$queryRawUnsafe<any[]>(`
            SELECT * FROM mod_ordemServico_clients 
            WHERE tenant_id = '${tenantId}' 
            AND id = '${id}'
            AND deleted_at IS NULL
            LIMIT 1
        `);
        return result[0];
    }

    async create(tenantId: string, data: any, userId: string) {
        // Validation
        if (!data.name || !data.phone_primary) {
            throw new Error('Nome e Telefone principal são obrigatórios');
        }

        const id = crypto.randomUUID();

        await this.prisma.$executeRawUnsafe(`
            INSERT INTO mod_ordemServico_clients 
            (id, tenant_id, name, document, phone_primary, phone_secondary, address, is_active)
            VALUES 
            ('${id}', '${tenantId}', '${data.name.replace(/'/g, "''")}', ${data.document ? `'${data.document.replace(/'/g, "''")}'` : 'NULL'}, '${data.phone_primary.replace(/'/g, "''")}', ${data.phone_secondary ? `'${data.phone_secondary.replace(/'/g, "''")}'` : 'NULL'}, ${data.address ? `'${data.address.replace(/'/g, "''")}'` : 'NULL'}, ${data.is_active ?? true})
        `);

        await this.auditService.log({
            action: 'CREATE_CLIENT',
            userId,
            tenantId,
            details: { clientId: id, name: data.name }
        });

        return { id, ...data };
    }

    async update(tenantId: string, id: string, data: any, userId: string) {
        if (!data.name || !data.phone_primary) {
            throw new Error('Nome e Telefone principal são obrigatórios');
        }

        await this.prisma.$executeRawUnsafe(`
            UPDATE mod_ordemServico_clients
            SET 
                name = '${data.name.replace(/'/g, "''")}',
                document = ${data.document ? `'${data.document.replace(/'/g, "''")}'` : 'NULL'},
                phone_primary = '${data.phone_primary.replace(/'/g, "''")}',
                phone_secondary = ${data.phone_secondary ? `'${data.phone_secondary.replace(/'/g, "''")}'` : 'NULL'},
                address = ${data.address ? `'${data.address.replace(/'/g, "''")}'` : 'NULL'},
                is_active = ${data.is_active ?? true},
                updated_at = NOW()
            WHERE id = '${id}' AND tenant_id = '${tenantId}'
        `);

        await this.auditService.log({
            action: 'UPDATE_CLIENT',
            userId,
            tenantId,
            details: { clientId: id, updates: data }
        });

        return { id, ...data };
    }

    async delete(tenantId: string, id: string, userId: string) {
        await this.prisma.$executeRawUnsafe(`
            UPDATE mod_ordemServico_clients
            SET deleted_at = NOW()
            WHERE id = '${id}' AND tenant_id = '${tenantId}'
        `);

        await this.auditService.log({
            action: 'DELETE_CLIENT',
            userId,
            tenantId,
            details: { clientId: id }
        });

        return { success: true };
    }
}
