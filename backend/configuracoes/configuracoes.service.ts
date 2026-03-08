import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { OrdemServicoCronService } from '../core/ordem-servico-cron.service';
import { AiService } from '../shared/services/ai.service';

@Injectable()
export class ConfiguracoesService {
    private readonly logger = new Logger(ConfiguracoesService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly aiService: AiService,
        private readonly cronService: OrdemServicoCronService
    ) { }

    private getDefaultPermissions() {
        const defaultPermissions: Record<string, Record<string, boolean>> = {};

        const permissions = [
            'dashboard_view', 'dashboard_export',
            'orders_view', 'orders_create', 'orders_edit', 'orders_delete', 'orders_assign',
            'clients_view', 'clients_create', 'clients_edit', 'clients_delete',
            'products_view', 'products_create', 'products_edit', 'products_delete',
            'config_view', 'config_users', 'config_permissions', 'config_system',
        ];

        permissions.forEach((permId) => {
            defaultPermissions[permId] = {
                admin: true,
                technician: ['dashboard_view', 'orders_view', 'orders_create', 'orders_edit', 'clients_view', 'products_view'].includes(permId),
                attendant: ['dashboard_view', 'orders_view', 'orders_create', 'clients_view', 'clients_create', 'clients_edit', 'products_view'].includes(permId),
            };
        });

        return defaultPermissions;
    }

    async getUsers(tenantId: string) {
        try {
            this.logger.log(`Buscando usuarios para tenant ${tenantId}`);

            const users = await this.prisma.$queryRawUnsafe<any[]>(
                `SELECT id, name, email, role
                 FROM users
                 WHERE "tenantId" = $1 AND "isLocked" = false
                 ORDER BY name ASC`,
                tenantId
            );

            this.logger.log(`Usuarios encontrados: ${users.length}`);
            return users;
        } catch (error) {
            this.logger.error(`Erro ao buscar usuarios:`, error);
            throw error;
        }
    }

    async toggleTechnician(tenantId: string, userId: string, isTechnician: boolean) {
        try {
            this.logger.log(`Alterando status de tecnico para usuario ${userId}: ${isTechnician}`);
            return { success: true, userId, isTechnician };
        } catch (error) {
            this.logger.error(`Erro ao alterar status de tecnico:`, error);
            throw error;
        }
    }

    async getProfilePermissions(tenantId: string) {
        try {
            this.logger.log(`Buscando permissoes de perfil para tenant ${tenantId}`);

            const permissions = await this.prisma.$queryRawUnsafe<any[]>(
                `SELECT profile, permission_id, allowed
                 FROM mod_ordem_servico_profile_permissions
                 WHERE tenant_id = $1 OR tenant_id = 'default'
                 ORDER BY profile ASC, permission_id ASC`,
                tenantId
            );

            const structuredPermissions: Record<string, Record<string, boolean>> = {};

            permissions.forEach((perm) => {
                if (!structuredPermissions[perm.permission_id]) {
                    structuredPermissions[perm.permission_id] = {};
                }
                structuredPermissions[perm.permission_id][perm.profile] = perm.allowed;
            });

            return structuredPermissions;
        } catch (error) {
            this.logger.error(`Erro ao buscar permissoes de perfil:`, error);
            return this.getDefaultPermissions();
        }
    }

    async updateProfilePermissions(tenantId: string, permissions: any) {
        try {
            this.logger.log(`Atualizando permissoes de perfil para tenant ${tenantId}`);

            await this.prisma.$executeRawUnsafe(
                `DELETE FROM mod_ordem_servico_profile_permissions WHERE tenant_id = $1`,
                tenantId
            );

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

            return { success: true, permissions };
        } catch (error) {
            this.logger.error(`Erro ao atualizar permissoes de perfil:`, error);
            throw error;
        }
    }

    async getNotifications(tenantId: string) {
        try {
            this.logger.log(`Buscando notificacoes para tenant ${tenantId}`);

            const notifications = await this.prisma.$queryRawUnsafe<any[]>(
                `SELECT * FROM mod_ordem_servico_notification_schedules
                 WHERE tenant_id = $1
                 ORDER BY created_at DESC`,
                tenantId
            );

            return notifications;
        } catch (error) {
            this.logger.error(`Erro ao buscar notificacoes:`, error);
            return [];
        }
    }

    async createNotification(tenantId: string, data: any) {
        try {
            this.logger.log(`Criando notificacao para tenant ${tenantId}`);

            const result = await this.prisma.$executeRawUnsafe(
                `INSERT INTO mod_ordem_servico_notification_schedules
                (tenant_id, title, content, audience, cron_expression, enabled)
                VALUES ($1, $2, $3, $4, $5, $6)`,
                tenantId,
                data.title,
                data.content,
                data.audience || 'all',
                data.cronExpression,
                data.enabled ?? true
            );

            await this.cronService.registerNotificationJob();

            return { success: true, result };
        } catch (error) {
            this.logger.error(`Erro ao criar notificacao:`, error);
            throw error;
        }
    }

    async getAiConfig(tenantId: string) {
        try {
            this.logger.log(`Buscando configuracao de IA para tenant ${tenantId}`);

            const results = await this.prisma.$queryRawUnsafe<any[]>(
                `SELECT value FROM mod_ordem_servico_configs WHERE tenant_id = $1 AND key = 'ai_integration'`,
                tenantId
            );

            if (results.length === 0) {
                return { enabled: false };
            }

            const config = JSON.parse(results[0].value);
            if (config.apiKey) {
                config.apiKey = '********' + config.apiKey.slice(-4);
            }

            return config;
        } catch (error) {
            this.logger.error(`Erro ao buscar configuracao de IA:`, error);
            return { enabled: false };
        }
    }

    async updateAiConfig(tenantId: string, config: any) {
        try {
            this.logger.log(`Atualizando configuracao de IA para tenant ${tenantId}`);

            if (config.apiKey && config.apiKey.startsWith('********')) {
                const currentConfig = await this.getAiConfigInternal(tenantId);
                if (currentConfig && currentConfig.apiKey) {
                    config.apiKey = currentConfig.apiKey;
                }
            }

            const configValue = JSON.stringify(config);

            const updateResult = await this.prisma.$executeRawUnsafe(
                `UPDATE mod_ordem_servico_configs SET value = $1, updated_at = CURRENT_TIMESTAMP
                 WHERE tenant_id = $2 AND key = 'ai_integration'`,
                configValue,
                tenantId
            );

            if (updateResult === 0) {
                await this.prisma.$executeRawUnsafe(
                    `INSERT INTO mod_ordem_servico_configs (tenant_id, key, value) VALUES ($1, 'ai_integration', $2)`,
                    tenantId,
                    configValue
                );
            }

            return { success: true };
        } catch (error) {
            this.logger.error(`Erro ao atualizar configuracao de IA:`, error);
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
            this.logger.log(`Testando configuracao de IA para tenant ${tenantId}`);

            if (testConfig.apiKey && testConfig.apiKey.startsWith('********')) {
                const currentConfig = await this.getAiConfigInternal(tenantId);
                if (currentConfig && currentConfig.apiKey) {
                    testConfig.apiKey = currentConfig.apiKey;
                }
            }

            const response = await this.aiService.callAI(
                tenantId,
                { prompt: 'Ola! Por favor, responda confirmando que voce esta funcionando corretamente.' },
                testConfig
            );

            return { success: true, response };
        } catch (error: any) {
            this.logger.error(`Erro no teste de IA:`, error);
            return {
                success: false,
                message: error.message || 'Erro desconhecido ao testar IA',
                details: error.response?.data || error.response || error,
            };
        }
    }

    async getConfigurations(tenantId: string) {
        try {
            this.logger.log(`Buscando configuracoes genericas para tenant ${tenantId}`);

            const results = await this.prisma.$queryRawUnsafe<any[]>(
                `SELECT key as config_key, value as config_value FROM mod_ordem_servico_configs WHERE tenant_id = $1`,
                tenantId
            );

            return results;
        } catch (error) {
            this.logger.error(`Erro ao buscar configuracoes genericas:`, error);
            return [];
        }
    }

    async saveConfiguration(tenantId: string, key: string, value: any) {
        try {
            this.logger.log(`Salvando configuracao: ${key} para tenant ${tenantId}`);

            const configValue = typeof value === 'string' ? value : JSON.stringify(value);

            const updateResult = await this.prisma.$executeRawUnsafe(
                `UPDATE mod_ordem_servico_configs SET value = $1, updated_at = CURRENT_TIMESTAMP
                 WHERE tenant_id = $2 AND key = $3`,
                configValue,
                tenantId,
                key
            );

            if (updateResult === 0) {
                await this.prisma.$executeRawUnsafe(
                    `INSERT INTO mod_ordem_servico_configs (tenant_id, key, value, created_at, updated_at)
                     VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                    tenantId,
                    key,
                    configValue
                );
            }

            return { success: true };
        } catch (error) {
            this.logger.error(`Erro ao salvar configuracao:`, error);
            throw error;
        }
    }
}
