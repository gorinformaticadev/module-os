import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';

@Injectable()
export class TemplateService {
    private readonly logger = new Logger(TemplateService.name);

    constructor(private readonly prisma: PrismaService) {}

    async findAll(tenantId: string) {
        try {
            this.logger.log(`Buscando templates para tenant ${tenantId}`);
            
            const templates = await this.prisma.$queryRawUnsafe<any[]>(
                `SELECT * FROM mod_ordem_servico_templates WHERE tenant_id = $1 ORDER BY name ASC`,
                tenantId
            );

            this.logger.log(`✅ ${templates.length} templates encontrados`);
            return templates;
        } catch (error) {
            this.logger.error(`❌ Erro ao buscar templates:`, error);
            // Se a tabela não existir, retornar array vazio
            return [];
        }
    }

    async findById(tenantId: string, id: string) {
        try {
            const result = await this.prisma.$queryRawUnsafe<any[]>(
                `SELECT * FROM mod_ordem_servico_templates WHERE tenant_id = $1 AND id = $2 LIMIT 1`,
                tenantId, id
            );
            return result[0];
        } catch (error) {
            this.logger.error(`❌ Erro ao buscar template ${id}:`, error);
            return null;
        }
    }

    async create(tenantId: string, data: any, userId: string) {
        try {
            this.logger.log(`Criando template para tenant ${tenantId}`);
            
            const result = await this.prisma.$executeRawUnsafe(
                `INSERT INTO mod_ordem_servico_templates 
                (tenant_id, name, content, type, created_by)
                VALUES ($1, $2, $3, $4, $5)`,
                tenantId,
                data.name,
                data.content,
                data.type || 'GENERAL',
                userId
            );

            this.logger.log(`✅ Template criado com sucesso`);
            return { success: true, result };
        } catch (error) {
            this.logger.error(`❌ Erro ao criar template:`, error);
            throw error;
        }
    }

    async update(tenantId: string, id: string, data: any, userId: string) {
        try {
            this.logger.log(`Atualizando template ${id} para tenant ${tenantId}`);
            
            const result = await this.prisma.$executeRawUnsafe(
                `UPDATE mod_ordem_servico_templates 
                SET name = $3, content = $4, type = $5, updated_at = NOW()
                WHERE tenant_id = $1 AND id = $2`,
                tenantId,
                id,
                data.name,
                data.content,
                data.type || 'GENERAL'
            );

            this.logger.log(`✅ Template atualizado com sucesso`);
            return { success: true, result };
        } catch (error) {
            this.logger.error(`❌ Erro ao atualizar template:`, error);
            throw error;
        }
    }

    async delete(tenantId: string, id: string, userId: string) {
        try {
            this.logger.log(`Excluindo template ${id} para tenant ${tenantId}`);
            
            const result = await this.prisma.$executeRawUnsafe(
                `DELETE FROM mod_ordem_servico_templates WHERE tenant_id = $1 AND id = $2`,
                tenantId,
                id
            );

            this.logger.log(`✅ Template excluído com sucesso`);
            return { success: true };
        } catch (error) {
            this.logger.error(`❌ Erro ao excluir template:`, error);
            throw error;
        }
    }
}