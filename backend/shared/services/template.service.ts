import { Injectable, Logger } from '@nestjs/common';
import { RequestSecurityContextService } from '@common/services/request-security-context.service';
import { ModuleOsPrismaService } from '../../prisma/module-os-prisma.service';

@Injectable()
export class TemplateService {
    // tenantId e aplicado pelo ALS + ModuleOsPrismaService.
    private readonly logger = new Logger(TemplateService.name);

    constructor(
        private readonly prisma: ModuleOsPrismaService,
        private readonly requestSecurityContext: RequestSecurityContextService,
    ) {}

    async findAll() {
        try {
            const templates = await this.prisma.mod_ordem_servico_templates.findMany({
                orderBy: { name: 'asc' },
            });

            this.logger.log(`${templates.length} templates encontrados`);
            return templates;
        } catch (error) {
            this.logger.error('Erro ao buscar templates:', error);
            return [];
        }
    }

    async findById(id: string) {
        try {
            return await this.prisma.mod_ordem_servico_templates.findFirst({
                where: { id },
            });
        } catch (error) {
            this.logger.error(`Erro ao buscar template ${id}:`, error);
            return null;
        }
    }

    async create(data: any) {
        try {
            const actor = this.requestSecurityContext.getActor();
            const created = await this.prisma.mod_ordem_servico_templates.create({
                data: {
                    name: data.name,
                    content: data.content,
                    type: data.type || 'GENERAL',
                    createdBy: actor?.id || null,
                },
            });

            this.logger.log('Template criado com sucesso');
            return created;
        } catch (error) {
            this.logger.error('Erro ao criar template:', error);
            throw error;
        }
    }

    async update(id: string, data: any) {
        try {
            const result = await this.prisma.mod_ordem_servico_templates.updateMany({
                where: { id },
                data: {
                    name: data.name,
                    content: data.content,
                    type: data.type || 'GENERAL',
                    updatedAt: new Date(),
                },
            });

            if (result.count === 0) {
                return null;
            }

            this.logger.log('Template atualizado com sucesso');
            return this.findById(id);
        } catch (error) {
            this.logger.error(`Erro ao atualizar template ${id}:`, error);
            throw error;
        }
    }

    async delete(id: string) {
        try {
            await this.prisma.mod_ordem_servico_templates.deleteMany({
                where: { id },
            });

            this.logger.log('Template excluido com sucesso');
            return { success: true };
        } catch (error) {
            this.logger.error(`Erro ao excluir template ${id}:`, error);
            throw error;
        }
    }
}
