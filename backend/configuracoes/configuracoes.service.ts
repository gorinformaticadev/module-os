import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { AiService } from '../shared/services/ai.service';

@Injectable()
export class ConfiguracoesService {
    private readonly logger = new Logger(ConfiguracoesService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly aiService: AiService
    ) { }

    private getDefaultPermissions() {
        // Permissões padrão caso a tabela não exista
        const defaultPermissions: Record<string, Record<string, boolean>> = {};

        const permissions = [
            'dashboard_view', 'dashboard_export',
            'orders_view', 'orders_create', 'orders_edit', 'orders_delete', 'orders_assign',
            'clients_view', 'clients_create', 'clients_edit', 'clients_delete',
            'products_view', 'products_create', 'products_edit', 'products_delete',
            'config_view', 'config_users', 'config_permissions', 'config_system'
        ];

        permissions.forEach(permId => {
            defaultPermissions[permId] = {
                admin: true, // Admin tem tudo
                technician: ['dashboard_view', 'orders_view', 'orders_create', 'orders_edit', 'clients_view', 'products_view'].includes(permId),
                attendant: ['dashboard_view', 'orders_view', 'orders_create', 'clients_view', 'clients_create', 'clients_edit', 'products_view'].includes(permId)
            };
        });

        return defaultPermissions;
    }

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
                `SELECT profile, permission_id, allowed 
                 FROM mod_ordem_servico_profile_permissions 
                 WHERE tenant_id = $1 OR tenant_id = 'default'
                 ORDER BY profile ASC, permission_id ASC`,
                tenantId
            );

            this.logger.log(`✅ ${permissions.length} permissões de perfil encontradas`);

            // Transformar array em objeto estruturado
            const structuredPermissions: Record<string, Record<string, boolean>> = {};

            permissions.forEach(perm => {
                if (!structuredPermissions[perm.permission_id]) {
                    structuredPermissions[perm.permission_id] = {};
                }
                structuredPermissions[perm.permission_id][perm.profile] = perm.allowed;
            });

            return structuredPermissions;
        } catch (error) {
            this.logger.error(`❌ Erro ao buscar permissões de perfil:`, error);
            // Se a tabela não existir, retornar permissões padrão
            return this.getDefaultPermissions();
        }
    }

    async updateProfilePermissions(tenantId: string, permissions: any) {
        try {
            this.logger.log(`Atualizando permissões de perfil para tenant ${tenantId}`);

            // Primeiro, deletar todas as permissões existentes para este tenant
            await this.prisma.$executeRawUnsafe(
                `DELETE FROM mod_ordem_servico_profile_permissions WHERE tenant_id = $1`,
                tenantId
            );

            // Inserir as novas permissões
            const insertPromises = [];

            for (const [permissionId, profiles] of Object.entries(permissions)) {
                for (const [profileName, allowed] of Object.entries(profiles as Record<string, boolean>)) {
                    insertPromises.push(
                        this.prisma.$executeRawUnsafe(
                            `INSERT INTO mod_ordem_servico_profile_permissions 
                             (tenant_id, profile, permission_id, allowed, created_at, updated_at)
                             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                            tenantId,
                            profileName,
                            permissionId,
                            allowed
                        )
                    );
                }
            }

            await Promise.all(insertPromises);

            this.logger.log(`✅ Permissões de perfil atualizadas com sucesso`);
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

    async getAiConfig(tenantId: string) {
        try {
            this.logger.log(`Buscando configuração de IA para tenant ${tenantId}`);

            const results = await this.prisma.$queryRawUnsafe<any[]>(
                `SELECT value FROM mod_ordem_servico_configs WHERE tenant_id = $1 AND key = 'ai_integration'`,
                tenantId
            );

            if (results.length === 0) {
                return { enabled: false };
            }

            const config = JSON.parse(results[0].value);
            // Mascarar a API Key por segurança
            if (config.apiKey) {
                config.apiKey = '********' + config.apiKey.slice(-4);
            }

            return config;
        } catch (error) {
            this.logger.error(`❌ Erro ao buscar configuração de IA:`, error);
            return { enabled: false };
        }
    }

    async updateAiConfig(tenantId: string, config: any) {
        try {
            this.logger.log(`Atualizando configuração de IA para tenant ${tenantId}`);

            // Se a key vier mascarada, precisamos manter a key original se existir
            if (config.apiKey && config.apiKey.startsWith('********')) {
                const currentConfig = await this.getAiConfigInternal(tenantId);
                if (currentConfig && currentConfig.apiKey) {
                    config.apiKey = currentConfig.apiKey;
                }
            }

            const configValue = JSON.stringify(config);

            // Tentar atualizar
            const updateResult = await this.prisma.$executeRawUnsafe(
                `UPDATE mod_ordem_servico_configs SET value = $1, updated_at = CURRENT_TIMESTAMP 
                 WHERE tenant_id = $2 AND key = 'ai_integration'`,
                configValue,
                tenantId
            );

            // Se não atualizou nenhum, inserir
            if (updateResult === 0) {
                await this.prisma.$executeRawUnsafe(
                    `INSERT INTO mod_ordem_servico_configs (tenant_id, key, value) VALUES ($1, 'ai_integration', $2)`,
                    tenantId,
                    configValue
                );
            }

            return { success: true };
        } catch (error) {
            this.logger.error(`❌ Erro ao atualizar configuração de IA:`, error);
            throw error;
        }
    }

    private async getAiConfigInternal(tenantId: string) {
        try {
            const results = await this.prisma.$queryRawUnsafe<any[]>(
                `SELECT value FROM mod_ordem_servico_configs WHERE tenant_id = $1 AND key = 'ai_integration'`,
                tenantId
            );
            return results.length > 0 ? JSON.parse(results[0].value) : null;
        } catch {
            return null;
        }
    }
    async testAiConfig(tenantId: string, testConfig: any) {
        try {
            this.logger.log(`Testando configuração de IA para tenant ${tenantId}`);

            // Se a key vier mascarada, precisamos da key real do banco (se estiver testando a config salva)
            if (testConfig.apiKey && testConfig.apiKey.startsWith('********')) {
                const currentConfig = await this.getAiConfigInternal(tenantId);
                if (currentConfig && currentConfig.apiKey) {
                    testConfig.apiKey = currentConfig.apiKey;
                }
            }

            const response = await this.aiService.callAI(
                tenantId,
                { prompt: 'Olá! Por favor, responda confirmando que você está funcionando corretamente.' },
                testConfig
            );

            return { success: true, response };
        } catch (error: any) {
            this.logger.error(`❌ Erro no teste de IA:`, error);
            return {
                success: false,
                message: error.message || 'Erro desconhecido ao testar IA',
                details: error.response?.data || error.response || error
            };
        }
    }
}