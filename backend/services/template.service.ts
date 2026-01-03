import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { 
  ITemplateService, 
  ProfileTemplate, 
  TemplatePermission, 
  TemplateWithPermissions 
} from '../interfaces/template.interface';
import { PermissionUpdate } from '../interfaces/permission.interface';
import { PermissionService } from './permission.service';

@Injectable()
export class TemplateService implements ITemplateService {
  private readonly logger = new Logger(TemplateService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionService: PermissionService
  ) {}

  async getAllTemplates(): Promise<ProfileTemplate[]> {
    try {
      this.logger.log('Buscando todos os templates de perfil');

      const templates = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT id, name, description, is_system, created_at, updated_at
         FROM mod_ordem_servico_profile_templates 
         ORDER BY is_system DESC, name ASC`
      );

      const profileTemplates: ProfileTemplate[] = templates.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        isSystem: t.is_system,
        createdAt: t.created_at,
        updatedAt: t.updated_at
      }));

      this.logger.log(`✅ ${profileTemplates.length} templates encontrados`);
      return profileTemplates;

    } catch (error) {
      this.logger.error('❌ Erro ao buscar templates:', error);
      throw error;
    }
  }

  async getTemplateWithPermissions(templateId: string): Promise<TemplateWithPermissions> {
    try {
      this.logger.log(`Buscando template ${templateId} com permissões`);

      // Buscar template
      const templateResult = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT id, name, description, is_system, created_at, updated_at
         FROM mod_ordem_servico_profile_templates 
         WHERE id = $1::uuid`,
        templateId
      );

      if (templateResult.length === 0) {
        throw new Error(`Template ${templateId} não encontrado`);
      }

      const template = templateResult[0];

      // Buscar permissões do template
      const permissions = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT id, template_id, resource, action, allowed, created_at
         FROM mod_ordem_servico_template_permissions 
         WHERE template_id = $1::uuid
         ORDER BY resource, action`,
        templateId
      );

      const templatePermissions: TemplatePermission[] = permissions.map(p => ({
        id: p.id,
        templateId: p.template_id,
        resource: p.resource,
        action: p.action,
        allowed: p.allowed,
        createdAt: p.created_at
      }));

      const permissionCount = {
        total: templatePermissions.length,
        allowed: templatePermissions.filter(p => p.allowed).length
      };

      const templateWithPermissions: TemplateWithPermissions = {
        id: template.id,
        name: template.name,
        description: template.description,
        isSystem: template.is_system,
        permissions: templatePermissions,
        permissionCount
      };

      this.logger.log(`✅ Template ${template.name} encontrado com ${templatePermissions.length} permissões`);
      return templateWithPermissions;

    } catch (error) {
      this.logger.error(`❌ Erro ao buscar template ${templateId}:`, error);
      throw error;
    }
  }

  async applyTemplateToUser(
    tenantId: string, 
    userId: string, 
    templateId: string, 
    appliedBy: string
  ): Promise<void> {
    try {
      this.logger.log(`Aplicando template ${templateId} ao usuário ${userId}`);

      // Buscar permissões do template
      const templateWithPermissions = await this.getTemplateWithPermissions(templateId);

      // Converter permissões do template para formato de atualização
      const permissionUpdates: PermissionUpdate[] = templateWithPermissions.permissions.map(p => ({
        resource: p.resource,
        action: p.action,
        allowed: p.allowed
      }));

      // Aplicar permissões usando o PermissionService
      await this.permissionService.updateUserPermissions(
        tenantId, 
        userId, 
        permissionUpdates, 
        appliedBy
      );

      this.logger.log(`✅ Template ${templateWithPermissions.name} aplicado com sucesso ao usuário ${userId}`);

    } catch (error) {
      this.logger.error(`❌ Erro ao aplicar template ${templateId} ao usuário ${userId}:`, error);
      throw error;
    }
  }

  async createCustomTemplate(
    name: string, 
    description: string, 
    permissions: TemplatePermission[]
  ): Promise<ProfileTemplate> {
    try {
      this.logger.log(`Criando template customizado: ${name}`);

      // Verificar se já existe template com esse nome
      const existing = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT id FROM mod_ordem_servico_profile_templates WHERE name = $1`,
        name
      );

      if (existing.length > 0) {
        throw new Error(`Já existe um template com o nome "${name}"`);
      }

      // Criar template
      const templateResult = await this.prisma.$queryRawUnsafe<any[]>(
        `INSERT INTO mod_ordem_servico_profile_templates (name, description, is_system)
         VALUES ($1, $2, false)
         RETURNING id, name, description, is_system, created_at, updated_at`,
        name, description
      );

      const newTemplate = templateResult[0];

      // Adicionar permissões
      for (const permission of permissions) {
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO mod_ordem_servico_template_permissions 
           (template_id, resource, action, allowed)
           VALUES ($1::uuid, $2, $3, $4)`,
          newTemplate.id, permission.resource, permission.action, permission.allowed
        );
      }

      const profileTemplate: ProfileTemplate = {
        id: newTemplate.id,
        name: newTemplate.name,
        description: newTemplate.description,
        isSystem: newTemplate.is_system,
        createdAt: newTemplate.created_at,
        updatedAt: newTemplate.updated_at
      };

      this.logger.log(`✅ Template customizado "${name}" criado com ${permissions.length} permissões`);
      return profileTemplate;

    } catch (error) {
      this.logger.error(`❌ Erro ao criar template customizado "${name}":`, error);
      throw error;
    }
  }

  async updateTemplate(templateId: string, permissions: TemplatePermission[]): Promise<void> {
    try {
      this.logger.log(`Atualizando template ${templateId}`);

      // Verificar se é template do sistema (não pode ser editado)
      const template = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT is_system FROM mod_ordem_servico_profile_templates WHERE id = $1::uuid`,
        templateId
      );

      if (template.length === 0) {
        throw new Error(`Template ${templateId} não encontrado`);
      }

      if (template[0].is_system) {
        throw new Error('Templates do sistema não podem ser editados');
      }

      // Remover permissões existentes
      await this.prisma.$executeRawUnsafe(
        `DELETE FROM mod_ordem_servico_template_permissions WHERE template_id = $1::uuid`,
        templateId
      );

      // Adicionar novas permissões
      for (const permission of permissions) {
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO mod_ordem_servico_template_permissions 
           (template_id, resource, action, allowed)
           VALUES ($1::uuid, $2, $3, $4)`,
          templateId, permission.resource, permission.action, permission.allowed
        );
      }

      this.logger.log(`✅ Template ${templateId} atualizado com ${permissions.length} permissões`);

    } catch (error) {
      this.logger.error(`❌ Erro ao atualizar template ${templateId}:`, error);
      throw error;
    }
  }

  async deleteTemplate(templateId: string): Promise<void> {
    try {
      this.logger.log(`Excluindo template ${templateId}`);

      // Verificar se é template do sistema (não pode ser excluído)
      const template = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT is_system, name FROM mod_ordem_servico_profile_templates WHERE id = $1::uuid`,
        templateId
      );

      if (template.length === 0) {
        throw new Error(`Template ${templateId} não encontrado`);
      }

      if (template[0].is_system) {
        throw new Error('Templates do sistema não podem ser excluídos');
      }

      // Excluir template (as permissões são excluídas automaticamente por CASCADE)
      await this.prisma.$executeRawUnsafe(
        `DELETE FROM mod_ordem_servico_profile_templates WHERE id = $1::uuid`,
        templateId
      );

      this.logger.log(`✅ Template "${template[0].name}" excluído com sucesso`);

    } catch (error) {
      this.logger.error(`❌ Erro ao excluir template ${templateId}:`, error);
      throw error;
    }
  }
}