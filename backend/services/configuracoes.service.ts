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
}