
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';

@Injectable()
export class OrdemServicoConfiguracoesService {
    private readonly logger = new Logger(OrdemServicoConfiguracoesService.name);

    constructor(private readonly prisma: PrismaService) { }

    async getUsers(tenantId: string) {
        try {
            const users = await this.prisma.$queryRawUnsafe<any[]>(
                `SELECT 
                    u.id, 
                    u.name, 
                    u.email, 
                    u.role,
                    s.is_technician
                 FROM users u
                 LEFT JOIN "mod_ordemServico_staff" s ON u.id::text = s.user_id AND s.tenant_id = $1
                 ORDER BY u.name ASC`,
                tenantId
            );

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
            this.logger.error(`Error fetching users: ${error.message}`);
            throw error;
        }
    }

    async toggleTechnician(tenantId: string, userId: string, isTechnician: boolean) {
        try {
            const existing = await this.prisma.$queryRawUnsafe<any[]>(
                `SELECT id FROM "mod_ordemServico_staff" WHERE user_id = $1 AND tenant_id = $2`,
                userId, tenantId
            );

            if (existing.length > 0) {
                await this.prisma.$executeRawUnsafe(
                    `UPDATE "mod_ordemServico_staff" SET is_technician = $3, updated_at = NOW() WHERE user_id = $1 AND tenant_id = $2`,
                    userId, tenantId, isTechnician
                );
            } else {
                await this.prisma.$executeRawUnsafe(
                    `INSERT INTO "mod_ordemServico_staff" (tenant_id, user_id, is_technician) VALUES ($2, $1, $3)`,
                    userId, tenantId, isTechnician
                );
            }

            return { success: true };
        } catch (error) {
            this.logger.error(`Error toggling technician: ${error.message}`);
            throw error;
        }
    }
}
