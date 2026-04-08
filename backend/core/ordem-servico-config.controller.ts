import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@core/common/guards/jwt-auth.guard';
import { PrismaService } from '@core/prisma/prisma.service';
import { OrdemServicoCronService } from './ordem-servico-cron.service';
import { Request as ExpressRequest } from 'express';
import { PermissionGuard } from '../shared/guards/permission.guard';
import { RequireConfigPermission } from '../shared/decorators/require-permission.decorator';
import { Permissions } from '../shared/decorators/permissions.decorator';
import { ModuleOsPrismaService } from '../prisma/module-os-prisma.service';

@Controller('ordem_servico/config')
@Permissions('ordem_servico.config')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class OrdemServicoConfigController {
    // tenantId e resolvido via ALS nas services e no ModuleOsPrismaService.
    constructor(
        private readonly prisma: PrismaService,
        private readonly modulePrisma: ModuleOsPrismaService,
        private readonly cronService: OrdemServicoCronService,
    ) { }

    @Get('notifications')
    @RequireConfigPermission('manage_notifications')
    async getNotificationConfigs() {
        return this.modulePrisma.mod_ordem_servico_notification_schedules.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    @Post('notifications')
    @RequireConfigPermission('manage_notifications')
    async createNotificationConfig(@Body() body: any) {
        const result = await this.modulePrisma.mod_ordem_servico_notification_schedules.create({
            data: {
                title: body.title,
                content: body.content,
                audience: body.audience,
                cronExpression: body.cronExpression,
                enabled: body.enabled ?? true,
            },
        });

        await this.cronService.registerNotificationJob();
        return result;
    }

    @Get('tipos-servico')
    @RequireConfigPermission('view')
    async getTiposServico() {
        return this.modulePrisma.mod_ordem_servico_tipos_servico.findMany({
            orderBy: [{ isDefault: 'desc' }, { nome: 'asc' }],
        });
    }

    @Post('tipos-servico')
    @RequireConfigPermission('edit')
    async createTipoServico(@Body() body: { nome: string }) {
        return this.modulePrisma.mod_ordem_servico_tipos_servico.create({
            data: {
                nome: body.nome,
                isDefault: false,
            },
        });
    }

    @Put('tipos-servico/:id')
    @RequireConfigPermission('edit')
    async updateTipoServico(@Param('id') id: string, @Body() body: { nome: string }) {
        await this.modulePrisma.mod_ordem_servico_tipos_servico.updateMany({
            where: {
                id,
                isDefault: false,
            },
            data: { nome: body.nome },
        });

        return this.modulePrisma.mod_ordem_servico_tipos_servico.findFirst({
            where: { id },
        });
    }

    @Delete('tipos-servico/:id')
    @RequireConfigPermission('edit')
    async deleteTipoServico(@Param('id') id: string) {
        await this.modulePrisma.mod_ordem_servico_tipos_servico.deleteMany({
            where: {
                id,
                isDefault: false,
            },
        });
        return { success: true };
    }

    @Get('tipos-equipamento')
    @RequireConfigPermission('view')
    async getTiposEquipamento() {
        return this.modulePrisma.mod_ordem_servico_tipos_equipamento.findMany({
            orderBy: { nome: 'asc' },
        });
    }

    @Post('tipos-equipamento')
    @RequireConfigPermission('edit')
    async createTipoEquipamento(@Body() body: { nome: string }) {
        return this.modulePrisma.mod_ordem_servico_tipos_equipamento.create({
            data: { nome: body.nome },
        });
    }

    @Put('tipos-equipamento/:id')
    @RequireConfigPermission('edit')
    async updateTipoEquipamento(@Param('id') id: string, @Body() body: { nome: string }) {
        await this.modulePrisma.mod_ordem_servico_tipos_equipamento.updateMany({
            where: { id },
            data: { nome: body.nome },
        });

        return this.modulePrisma.mod_ordem_servico_tipos_equipamento.findFirst({
            where: { id },
        });
    }

    @Delete('tipos-equipamento/:id')
    @RequireConfigPermission('edit')
    async deleteTipoEquipamento(@Param('id') id: string) {
        await this.modulePrisma.mod_ordem_servico_tipos_equipamento.deleteMany({
            where: { id },
        });
        return { success: true };
    }

    @Get('users')
    @RequireConfigPermission('manage_permissions')
    async getUsers(@Req() req: ExpressRequest & { user: any }) {
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

        const roles = await this.modulePrisma.mod_ordem_servico_user_roles.findMany();
        const rolesByUserId = new Map(roles.map((role) => [role.userId, role]));

        return users.map((user) => {
            const role = rolesByUserId.get(user.id);
            return {
                id: user.id,
                name: user.name,
                email: user.email,
                system_role: user.role,
                os_roles: {
                    admin: role?.isAdmin ?? (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN'),
                    attendant: role?.isAttendant ?? true,
                    technician: role?.isTechnician ?? false,
                },
            };
        });
    }

    @Get('technicians')
    @RequireConfigPermission('manage_permissions')
    async getTechnicians() {
        const technicians = await this.modulePrisma.mod_ordem_servico_user_roles.findMany({
            where: { isTechnician: true },
            select: { userId: true },
        });

        if (technicians.length === 0) {
            return [];
        }

        return this.prisma.user.findMany({
            where: {
                id: { in: technicians.map((item) => item.userId) },
                isLocked: false,
            },
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                email: true,
            },
        });
    }

    @Put('users/:id/technician')
    @RequireConfigPermission('manage_permissions')
    async updateUserTechnician(
        @Param('id') userId: string,
        @Body() body: { is_technician: boolean },
    ) {
        const existing = await this.modulePrisma.mod_ordem_servico_user_roles.findFirst({
            where: { userId },
        });

        if (existing) {
            await this.modulePrisma.mod_ordem_servico_user_roles.updateMany({
                where: { userId },
                data: {
                    isTechnician: body.is_technician,
                    updatedAt: new Date(),
                },
            });
        } else {
            await this.modulePrisma.mod_ordem_servico_user_roles.create({
                data: {
                    userId,
                    isTechnician: body.is_technician,
                    isAttendant: true,
                    isAdmin: false,
                },
            });
        }

        return { success: true, message: 'Configuracao de tecnico atualizada' };
    }
}
