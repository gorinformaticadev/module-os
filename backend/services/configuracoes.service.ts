import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';

@Injectable()
export class OrdemServicoConfiguracoesService {
    private readonly logger = new Logger(OrdemServicoConfiguracoesService.name);

    constructor(private readonly prisma: PrismaService) { }

    async getUsers(tenantId: string) {
        try {
            this.logger.log(`getUsers chamado. Tenant: ${tenantId}`);

            // First check if users table exists and is accessible
            const testQuery = await this.prisma.$queryRawUnsafe<any[]>(
                `SELECT COUNT(*)::int as count FROM users LIMIT 1`
            );
            this.logger.log(`✅ Teste de conexão com tabela users: ${testQuery[0]?.count >= 0 ? 'OK' : 'FALHOU'}`);

            const users = await this.prisma.$queryRawUnsafe<any[]>(
                `SELECT 
                    u.id, 
                    u.name, 
                    u.email, 
                    u.role,
                    s.is_technician
                 FROM users u
                 LEFT JOIN "mod_ordem_servico_staff" s ON u.id::text = s.user_id AND s.tenant_id = $1
                 ORDER BY u.name ASC`,
                tenantId
            );

            this.logger.log(`✅ Usuários encontrados: ${users.length}`);

            return users.map(user => {
                // Handle potential array or string for roles if users table varies, assuming string based on logic
                // If role is undefined, default to USER
                const role = user.role || 'USER';
                const isSystemAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    system_role: role,
                    os_roles: {
                        admin: isSystemAdmin,
                        attendant: true,
                        technician: user.is_technician === true // Ensure boolean
                    }
                };
            });

        } catch (error) {
            this.logger.error(`❌ Erro no getUsers:`, error);
            if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
                throw new Error('Tabela de usuários não encontrada. Verifique se o sistema foi instalado corretamente.');
            }
            throw error;
        }
    }

    async toggleTechnician(tenantId: string, userId: string, isTechnician: boolean) {
        try {
            this.logger.log(`toggleTechnician chamado. Tenant: ${tenantId}, User: ${userId}, isTechnician: ${isTechnician}`);

            const existing = await this.prisma.$queryRawUnsafe<any[]>(
                `SELECT id FROM "mod_ordem_servico_staff" WHERE user_id = $1 AND tenant_id = $2`,
                userId, tenantId
            );

            if (existing.length > 0) {
                await this.prisma.$executeRawUnsafe(
                    `UPDATE "mod_ordem_servico_staff" SET is_technician = $3, updated_at = NOW() WHERE user_id = $1 AND tenant_id = $2`,
                    userId, tenantId, isTechnician
                );
                this.logger.log(`✅ Staff atualizado para usuário ${userId}`);
            } else {
                await this.prisma.$executeRawUnsafe(
                    `INSERT INTO "mod_ordem_servico_staff" (tenant_id, user_id, is_technician) VALUES ($2, $1, $3)`,
                    userId, tenantId, isTechnician
                );
                this.logger.log(`✅ Staff criado para usuário ${userId}`);
            }

            return { success: true };
        } catch (error) {
            this.logger.error(`❌ Erro no toggleTechnician:`, error);
            throw error;
        }
    }

    async getProfilePermissions(tenantId: string) {
        try {
            this.logger.log(`getProfilePermissions chamado. Tenant: ${tenantId}`);

            const permissions = await this.prisma.$queryRawUnsafe<any[]>(
                `SELECT permission_id, profile, allowed FROM "mod_ordem_servico_profile_permissions" WHERE tenant_id = $1`,
                tenantId
            );

            this.logger.log(`✅ ${permissions.length} permissões de perfil encontradas`);

            // Organizar permissões por permission_id
            const result: Record<string, any> = {};
            permissions.forEach(perm => {
                if (!result[perm.permission_id]) {
                    result[perm.permission_id] = {
                        admin: false,
                        technician: false,
                        attendant: false
                    };
                }
                result[perm.permission_id][perm.profile] = perm.allowed;
            });

            return result;
        } catch (error) {
            this.logger.error(`❌ Erro no getProfilePermissions:`, error);
            throw error;
        }
    }

    async updateProfilePermissions(tenantId: string, permissions: Record<string, any>) {
        try {
            this.logger.log(`updateProfilePermissions chamado. Tenant: ${tenantId}`);

            // Primeiro, limpar permissões existentes
            await this.prisma.$executeRawUnsafe(
                `DELETE FROM "mod_ordem_servico_profile_permissions" WHERE tenant_id = $1`,
                tenantId
            );

            // Inserir novas permissões
            for (const [permissionId, profilePerms] of Object.entries(permissions)) {
                for (const [profile, allowed] of Object.entries(profilePerms as Record<string, boolean>)) {
                    if (allowed) {
                        await this.prisma.$executeRawUnsafe(
                            `INSERT INTO "mod_ordem_servico_profile_permissions" (tenant_id, permission_id, profile, allowed) VALUES ($1, $2, $3, $4)`,
                            tenantId, permissionId, profile, true
                        );
                    }
                }
            }

            this.logger.log(`✅ Permissões de perfil atualizadas`);
            return { success: true };
        } catch (error) {
            this.logger.error(`❌ Erro no updateProfilePermissions:`, error);
            throw error;
        }
    }

    async getNotifications(tenantId: string) {
        try {
            this.logger.log(`getNotifications chamado. Tenant: ${tenantId}`);
            return await this.prisma.$queryRawUnsafe<any[]>(
                `SELECT * FROM "mod_ordem_servico_notification_schedules" WHERE tenant_id = $1 ORDER BY created_at DESC`,
                tenantId
            );
        } catch (error) {
            this.logger.error(`❌ Erro no getNotifications:`, error);
            // Se tabela não existir, retorna array vazio para não quebrar frontend
            if (error.message?.includes('does not exist')) {
                return [];
            }
            throw error;
        }
    }

    async createNotification(tenantId: string, data: { title: string, content: string, audience: string, cronExpression: string, enabled?: boolean }) {
        try {
            this.logger.log(`createNotification chamado. Tenant: ${tenantId}`);
            await this.prisma.$executeRawUnsafe(
                `INSERT INTO "mod_ordem_servico_notification_schedules" 
                (tenant_id, title, content, audience, cron_expression, enabled) 
                VALUES ($1, $2, $3, $4, $5, $6)`,
                tenantId, data.title, data.content, data.audience, data.cronExpression, data.enabled ?? true
            );
            return { success: true };
        } catch (error) {
            this.logger.error(`❌ Erro no createNotification:`, error);
            throw error;
        }
    }
}