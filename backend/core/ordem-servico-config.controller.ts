import { Controller, Get, Post, Body, UseGuards, Put, Req, Param, Delete } from '@nestjs/common';
import { Roles } from '@core/decorators/roles.decorator';
import { RolesGuard } from '@core/guards/roles.guard';
import { JwtAuthGuard } from '@core/guards/jwt-auth.guard';
import { PrismaService } from '@core/prisma/prisma.service';
import { OrdemServicoCronService } from './ordem-servico-cron.service';
import { Request as ExpressRequest } from 'express';

@Controller('ordem_servico/config')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class OrdemServicoConfigController {
    constructor(
        private prisma: PrismaService,
        private cronService: OrdemServicoCronService
    ) { }

    @Get('notifications')
    async getNotificationConfigs(@Req() req: ExpressRequest & { user: any }) {
        const result = await this.prisma.$queryRaw<any[]>`
            SELECT * FROM mod_ordem_servico_notification_schedules
            WHERE tenant_id = ${req.user.tenantId}
            ORDER BY created_at DESC
        `;
        return result;
    }

    @Post('notifications')
    async createNotificationConfig(@Req() req: ExpressRequest & { user: any }, @Body() body: any) {
        const result = await this.prisma.$executeRaw`
            INSERT INTO mod_ordem_servico_notification_schedules
            (tenant_id, title, content, audience, cron_expression, enabled)
            VALUES (
                ${req.user.tenantId},
                ${body.title},
                ${body.content},
                ${body.audience},
                ${body.cronExpression},
                ${body.enabled ?? true}
            )
        `;

        await this.cronService.registerNotificationJob();

        return result;
    }

    // ==================== TIPOS DE SERVIÇO ====================

    @Get('tipos-servico')
    async getTiposServico(@Req() req: ExpressRequest & { user: any }) {
        const result = await this.prisma.$queryRawUnsafe<any[]>(
            `SELECT id, nome, is_default FROM mod_ordem_servico_tipos_servico 
             WHERE tenant_id = $1 
             ORDER BY is_default DESC, nome ASC`,
            req.user.tenantId
        );
        return result;
    }

    @Post('tipos-servico')
    async createTipoServico(@Req() req: ExpressRequest & { user: any }, @Body() body: { nome: string }) {
        const result = await this.prisma.$queryRawUnsafe(
            `INSERT INTO mod_ordem_servico_tipos_servico (tenant_id, nome, is_default) 
             VALUES ($1, $2, false) 
             RETURNING id, nome, is_default`,
            req.user.tenantId,
            body.nome
        );
        return result[0];
    }

    @Put('tipos-servico/:id')
    async updateTipoServico(
        @Req() req: ExpressRequest & { user: any },
        @Param('id') id: string,
        @Body() body: { nome: string }
    ) {
        const result = await this.prisma.$queryRawUnsafe(
            `UPDATE mod_ordem_servico_tipos_servico 
             SET nome = $1 
             WHERE id = $2 AND tenant_id = $3 AND is_default = false
             RETURNING id, nome, is_default`,
            body.nome,
            id,
            req.user.tenantId
        );
        return result[0];
    }

    @Delete('tipos-servico/:id')
    async deleteTipoServico(@Req() req: ExpressRequest & { user: any }, @Param('id') id: string) {
        await this.prisma.$queryRawUnsafe(
            `DELETE FROM mod_ordem_servico_tipos_servico 
             WHERE id = $1 AND tenant_id = $2 AND is_default = false`,
            id,
            req.user.tenantId
        );
        return { success: true };
    }

    // ==================== TIPOS DE EQUIPAMENTO ====================

    @Get('tipos-equipamento')
    async getTiposEquipamento(@Req() req: ExpressRequest & { user: any }) {
        const result = await this.prisma.$queryRawUnsafe<any[]>(
            `SELECT id, nome FROM mod_ordem_servico_tipos_equipamento 
             WHERE tenant_id = $1 
             ORDER BY nome ASC`,
            req.user.tenantId
        );
        return result;
    }

    @Post('tipos-equipamento')
    async createTipoEquipamento(@Req() req: ExpressRequest & { user: any }, @Body() body: { nome: string }) {
        const result = await this.prisma.$queryRawUnsafe(
            `INSERT INTO mod_ordem_servico_tipos_equipamento (tenant_id, nome) 
             VALUES ($1, $2) 
             RETURNING id, nome`,
            req.user.tenantId,
            body.nome
        );
        return result[0];
    }

    @Put('tipos-equipamento/:id')
    async updateTipoEquipamento(
        @Req() req: ExpressRequest & { user: any },
        @Param('id') id: string,
        @Body() body: { nome: string }
    ) {
        const result = await this.prisma.$queryRawUnsafe(
            `UPDATE mod_ordem_servico_tipos_equipamento 
             SET nome = $1 
             WHERE id = $2 AND tenant_id = $3
             RETURNING id, nome`,
            body.nome,
            id,
            req.user.tenantId
        );
        return result[0];
    }

    @Delete('tipos-equipamento/:id')
    async deleteTipoEquipamento(@Req() req: ExpressRequest & { user: any }, @Param('id') id: string) {
        await this.prisma.$queryRawUnsafe(
            `DELETE FROM mod_ordem_servico_tipos_equipamento 
             WHERE id = $1 AND tenant_id = $2`,
            id,
            req.user.tenantId
        );
        return { success: true };
    }

    // ==================== USUÁRIOS/TÉCNICOS ====================

    @Get('users')
    async getUsers(@Req() req: ExpressRequest & { user: any }) {
        try {
            // Primeiro, tentar com a nova tabela de papéis
            const result = await this.prisma.$queryRawUnsafe<any[]>(
                `SELECT 
                    u.id, 
                    u.name, 
                    u.email, 
                    u.role as system_role,
                    COALESCE(osr.is_technician, false) as is_technician,
                    COALESCE(osr.is_attendant, true) as is_attendant,
                    COALESCE(osr.is_admin, (u.role = 'SUPER_ADMIN' OR u.role = 'ADMIN')) as is_admin
                 FROM users u
                 LEFT JOIN mod_ordem_servico_user_roles osr ON u.id = osr.user_id AND u."tenantId" = osr.tenant_id
                 WHERE u."tenantId" = $1 AND u."isLocked" = false
                 ORDER BY u.name ASC`,
                req.user.tenantId
            );

            // Formatar dados para o frontend
            const usersWithOSRoles = result.map(user => ({
                id: user.id,
                name: user.name,
                email: user.email,
                system_role: user.system_role,
                os_roles: {
                    admin: user.is_admin,
                    attendant: user.is_attendant,
                    technician: user.is_technician
                }
            }));

            return usersWithOSRoles;
        } catch (error) {
            console.error('Erro ao buscar usuários com papéis OS, tentando fallback:', error);

            // Fallback: usar apenas a tabela users
            const result = await this.prisma.$queryRawUnsafe<any[]>(
                `SELECT id, name, email, role as system_role FROM users 
                 WHERE "tenantId" = $1 AND "isLocked" = false
                 ORDER BY name ASC`,
                req.user.tenantId
            );

            // Formatar dados para o frontend (sem papéis específicos do módulo)
            const usersWithOSRoles = result.map(user => ({
                id: user.id,
                name: user.name,
                email: user.email,
                system_role: user.system_role,
                os_roles: {
                    admin: user.system_role === 'SUPER_ADMIN' || user.system_role === 'ADMIN',
                    attendant: true, // Por padrão, todos podem ser atendentes
                    technician: false // Por padrão, ninguém é técnico até executar a migração
                }
            }));

            return usersWithOSRoles;
        }
    }

    @Get('technicians')
    async getTechnicians(@Req() req: ExpressRequest & { user: any }) {
        const result = await this.prisma.$queryRawUnsafe<any[]>(
            `SELECT u.id, u.name, u.email 
             FROM users u
             INNER JOIN mod_ordem_servico_user_roles osr ON u.id = osr.user_id AND u."tenantId" = osr.tenant_id
             WHERE u."tenantId" = $1 AND u."isLocked" = false AND osr.is_technician = true
             ORDER BY u.name ASC`,
            req.user.tenantId
        );
        return result;
    }

    @Put('users/:id/technician')
    async updateUserTechnician(
        @Req() req: ExpressRequest & { user: any },
        @Param('id') userId: string,
        @Body() body: { is_technician: boolean }
    ) {
        // Inserir ou atualizar o papel do usuário
        await this.prisma.$queryRawUnsafe(
            `INSERT INTO mod_ordem_servico_user_roles (tenant_id, user_id, is_technician, is_attendant, is_admin)
             VALUES ($1, $2, $3, true, false)
             ON CONFLICT (tenant_id, user_id) 
             DO UPDATE SET 
                is_technician = $3,
                updated_at = CURRENT_TIMESTAMP`,
            req.user.tenantId,
            userId,
            body.is_technician
        );

        return { success: true, message: 'Configuração de técnico atualizada' };
    }
}
