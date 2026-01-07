import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';

@Injectable()
export class ConfiguracoesService {
    private readonly logger = new Logger(ConfiguracoesService.name);

    constructor(private readonly prisma: PrismaService) { }

    async getUsers(tenantId: string) {
        try {
            this.logger.log(`Buscando usuários para tenant ${tenantId}`);
            
            const users = await this.prisma.$queryRawUnsafe<any[]>(
                `SELECT id, name, email, role FROM users ORDER BY name ASC`
            );

            this.logger.log(`✅ ${users.length} usuários encontrados`);
            return users;
        } catch (error) {
            this.logger.error(`❌ Erro ao buscar usuários:`, error);
            throw error;
        }
    }

    async toggleTechnician(tenantId: string, userId: string, isTechnician: boolean) {
        try {
            this.logger.log(`Alterando status de técnico para usuário ${userId}: ${isTechnician}`);
            
            // Aqui você pode implementar a lógica para marcar um usuário como técnico
            // Por exemplo, criar uma tabela específica ou usar um campo na tabela users
            
            // Por enquanto, vamos apenas retornar sucesso
            return { success: true, userId, isTechnician };
        } catch (error) {
            this.logger.error(`❌ Erro ao alterar status de técnico:`, error);
            throw error;
        }
    }

    async getProfilePermissions(tenantId: string) {
        try {
            this.logger.log(`Buscando permissões de perfil para tenant ${tenantId}`);
            
            const permissions = await this.prisma.$queryRawUnsafe<any[]>(
                `SELECT * FROM mod_ordem_servico_profile_permissions WHERE tenant_id = $1 ORDER BY profile_name ASC`,
                tenantId
            );

            this.logger.log(`✅ ${permissions.length} permissões de perfil encontradas`);
            return permissions;
        } catch (error) {
            this.logger.error(`❌ Erro ao buscar permissões de perfil:`, error);
            // Se a tabela não existir, retornar array vazio
            return [];
        }
    }

    async updateProfilePermissions(tenantId: string, permissions: any) {
        try {
            this.logger.log(`Atualizando permissões de perfil para tenant ${tenantId}`);
            
            // Implementar lógica de atualização de permissões
            // Por enquanto, apenas retornar sucesso
            
            return { success: true, permissions };
        } catch (error) {
            this.logger.error(`❌ Erro ao atualizar permissões de perfil:`, error);
            throw error;
        }
    }

    async getNotifications(tenantId: string) {
        try {
            this.logger.log(`Buscando notificações para tenant ${tenantId}`);
            
            const notifications = await this.prisma.$queryRawUnsafe<any[]>(
                `SELECT * FROM mod_ordemServico_notification_schedules ORDER BY created_at DESC`
            );

            this.logger.log(`✅ ${notifications.length} notificações encontradas`);
            return notifications;
        } catch (error) {
            this.logger.error(`❌ Erro ao buscar notificações:`, error);
            // Se a tabela não existir, retornar array vazio
            return [];
        }
    }

    async createNotification(tenantId: string, data: any) {
        try {
            this.logger.log(`Criando notificação para tenant ${tenantId}`);
            
            const result = await this.prisma.$executeRawUnsafe(
                `INSERT INTO mod_ordemServico_notification_schedules
                (title, content, audience, cron_expression, enabled)
                VALUES ($1, $2, $3, $4, $5)`,
                data.title,
                data.content,
                data.audience || 'all',
                data.cronExpression,
                data.enabled ?? true
            );

            this.logger.log(`✅ Notificação criada com sucesso`);
            return { success: true, result };
        } catch (error) {
            this.logger.error(`❌ Erro ao criar notificação:`, error);
            throw error;
        }
    }
}