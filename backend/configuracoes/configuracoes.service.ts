import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { OrdemServicoCronService } from '../core/ordem-servico-cron.service';
import { AiService } from '../shared/services/ai.service';
import { AVAILABLE_PERMISSIONS } from '../shared/constants/available-permissions';
import { ModuleOsPrismaService } from '../prisma/module-os-prisma.service';

@Injectable()
export class ConfiguracoesService {
    // tenantId e aplicado pelo ALS + ModuleOsPrismaService.
    private readonly logger = new Logger(ConfiguracoesService.name);
    private readonly LEGACY_PROFILE_PERMISSION_MAP: Record<string, string> = {
        dashboard_export: 'dashboard_view_statistics',
        orders_assign: 'orders_change_status',
        config_users: 'config_manage_permissions',
        config_permissions: 'config_manage_permissions',
        config_system: 'config_edit',
    };

    constructor(
        private readonly prisma: PrismaService,
        private readonly modulePrisma: ModuleOsPrismaService,
        private readonly aiService: AiService,
        private readonly cronService: OrdemServicoCronService,
    ) { }

    private getDefaultPermissions() {
        const defaultPermissions: Record<string, Record<string, boolean>> = {};

        const technicianDefaults = new Set<string>([
            'dashboard_view',
            'dashboard_view_statistics',
            'orders_view',
            'orders_view_details',
            'orders_create',
            'orders_edit',
            'orders_change_status',
            'orders_view_history',
            'clients_view',
            'clients_view_details',
            'clients_create',
            'clients_edit',
            'clients_upload_images',
            'products_view',
            'products_create',
            'products_edit',
            'products_upload_images',
            'config_view',
        ]);

        const attendantDefaults = new Set<string>([
            'dashboard_view',
            'orders_view',
            'orders_view_details',
            'orders_create',
            'clients_view',
            'clients_view_details',
            'clients_create',
            'clients_edit',
            'clients_upload_images',
            'products_view',
            'products_create',
            'products_edit',
            'products_upload_images',
        ]);

        for (const group of AVAILABLE_PERMISSIONS) {
            for (const action of group.actions) {
                const permId = `${group.resource}_${action.action}`;
                defaultPermissions[permId] = {
                    admin: true,
                    technician: technicianDefaults.has(permId),
                    attendant: attendantDefaults.has(permId),
                };
            }
        }

        return defaultPermissions;
    }

    private normalizePermissionId(permissionId: string): string {
        const key = String(permissionId || '').trim();
        return this.LEGACY_PROFILE_PERMISSION_MAP[key] || key;
    }

    async getUsers() {
        try {
            const users = await this.prisma.user.findMany({
                where: {
                    isLocked: false,
                },
                orderBy: { name: 'asc' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            });

            this.logger.log(`Usuarios encontrados: ${users.length}`);
            return users;
        } catch (error) {
            this.logger.error('Erro ao buscar usuarios:', error);
            throw error;
        }
    }

    async toggleTechnician(userId: string, isTechnician: boolean) {
        try {
            this.logger.log(`Alterando status de tecnico para usuario ${userId}: ${isTechnician}`);
            return { success: true, userId, isTechnician };
        } catch (error) {
            this.logger.error('Erro ao alterar status de tecnico:', error);
            throw error;
        }
    }

    async getProfilePermissions() {
        try {
            const permissions = await this.modulePrisma.mod_ordem_servico_profile_permissions.findMany({
                orderBy: [{ profile: 'asc' }, { permissionId: 'asc' }],
            });

            const structuredPermissions: Record<string, Record<string, boolean>> = {};
            const defaults = this.getDefaultPermissions();

            permissions.forEach((perm) => {
                const normalizedPermissionId = this.normalizePermissionId(perm.permissionId);
                if (!normalizedPermissionId) {
                    return;
                }

                if (!structuredPermissions[normalizedPermissionId]) {
                    structuredPermissions[normalizedPermissionId] = {};
                }
                structuredPermissions[normalizedPermissionId][perm.profile] = perm.allowed === true;
            });

            const mergedPermissions: Record<string, Record<string, boolean>> = { ...defaults };

            for (const [permissionId, profiles] of Object.entries(structuredPermissions)) {
                mergedPermissions[permissionId] = {
                    ...(mergedPermissions[permissionId] || {}),
                    ...profiles,
                };
            }

            return mergedPermissions;
        } catch (error) {
            this.logger.error('Erro ao buscar permissoes de perfil:', error);
            return this.getDefaultPermissions();
        }
    }

    async updateProfilePermissions(permissions: any) {
        try {
            await this.modulePrisma.mod_ordem_servico_profile_permissions.deleteMany();
            const rows = [];

            for (const [permissionId, profiles] of Object.entries(permissions)) {
                const normalizedPermissionId = this.normalizePermissionId(permissionId);
                for (const [profileName, allowed] of Object.entries(profiles as Record<string, boolean>)) {
                    rows.push({
                        profile: profileName,
                        permissionId: normalizedPermissionId,
                        allowed,
                    });
                }
            }

            if (rows.length > 0) {
                await this.modulePrisma.mod_ordem_servico_profile_permissions.createMany({
                    data: rows,
                });
            }

            return { success: true, permissions };
        } catch (error) {
            this.logger.error('Erro ao atualizar permissoes de perfil:', error);
            throw error;
        }
    }

    async getNotifications() {
        try {
            return await this.modulePrisma.mod_ordem_servico_notification_schedules.findMany({
                orderBy: { createdAt: 'desc' },
            });
        } catch (error) {
            this.logger.error('Erro ao buscar notificacoes:', error);
            return [];
        }
    }

    async createNotification(data: any) {
        try {
            const result = await this.modulePrisma.mod_ordem_servico_notification_schedules.create({
                data: {
                    title: data.title,
                    content: data.content,
                    audience: data.audience || 'all',
                    cronExpression: data.cronExpression,
                    enabled: data.enabled ?? true,
                },
            });

            await this.cronService.registerNotificationJob();
            return { success: true, result };
        } catch (error) {
            this.logger.error('Erro ao criar notificacao:', error);
            throw error;
        }
    }

    async getAiConfig() {
        try {
            const config = await this.readConfigValue('ai_integration');
            if (!config || typeof config !== 'object') {
                return { enabled: false };
            }

            const maskedConfig = { ...config };
            if (maskedConfig.apiKey) {
                maskedConfig.apiKey = '********' + String(maskedConfig.apiKey).slice(-4);
            }

            return maskedConfig;
        } catch (error) {
            this.logger.error('Erro ao buscar configuracao de IA:', error);
            return { enabled: false };
        }
    }

    async updateAiConfig(config: any) {
        try {
            if (config.apiKey && config.apiKey.startsWith('********')) {
                const currentConfig = await this.getAiConfigInternal();
                if (currentConfig && currentConfig.apiKey) {
                    config.apiKey = currentConfig.apiKey;
                }
            }

            await this.upsertConfigValue('ai_integration', config);
            return { success: true };
        } catch (error) {
            this.logger.error('Erro ao atualizar configuracao de IA:', error);
            throw error;
        }
    }

    private async getAiConfigInternal() {
        try {
            return this.readConfigValue('ai_integration');
        } catch {
            return null;
        }
    }

    async testAiConfig(testConfig: any) {
        try {
            if (testConfig.apiKey && testConfig.apiKey.startsWith('********')) {
                const currentConfig = await this.getAiConfigInternal();
                if (currentConfig && currentConfig.apiKey) {
                    testConfig.apiKey = currentConfig.apiKey;
                }
            }

            const response = await this.aiService.callAI(
                { prompt: 'Ola! Por favor, responda confirmando que voce esta funcionando corretamente.' },
                testConfig,
            );

            return { success: true, response };
        } catch (error: any) {
            this.logger.error('Erro no teste de IA:', error);
            return {
                success: false,
                message: error.message || 'Erro desconhecido ao testar IA',
                details: error.response?.data || error.response || error,
            };
        }
    }

    async getConfigurations() {
        try {
            const results = await this.modulePrisma.mod_ordem_servico_configs.findMany({
                orderBy: { key: 'asc' },
                select: {
                    key: true,
                    value: true,
                },
            });

            return results.map((item) => ({
                config_key: item.key,
                config_value: item.value,
            }));
        } catch (error) {
            this.logger.error('Erro ao buscar configuracoes genericas:', error);
            return [];
        }
    }

    async saveConfiguration(key: string, value: any) {
        try {
            await this.upsertConfigValue(key, value);
            return { success: true };
        } catch (error) {
            this.logger.error('Erro ao salvar configuracao:', error);
            throw error;
        }
    }

    private async readConfigValue(key: string) {
        const config = await this.modulePrisma.mod_ordem_servico_configs.findFirst({
            where: { key },
            select: { value: true },
        });

        if (!config?.value) {
            return null;
        }

        try {
            return JSON.parse(config.value);
        } catch {
            return config.value;
        }
    }

    private async upsertConfigValue(key: string, value: any) {
        const configValue = typeof value === 'string' ? value : JSON.stringify(value);

        const updateResult = await this.modulePrisma.mod_ordem_servico_configs.updateMany({
            where: { key },
            data: {
                value: configValue,
                updatedAt: new Date(),
            },
        });

        if (updateResult.count === 0) {
            await this.modulePrisma.mod_ordem_servico_configs.create({
                data: {
                    key,
                    value: configValue,
                },
            });
        }
    }
}
