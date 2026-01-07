import { Controller, Get, Post, Body, UseGuards, Put, Req, Param, Delete } from '@nestjs/common';
import { Roles } from '@core/decorators/roles.decorator';
import { RolesGuard } from '@core/guards/roles.guard';
import { JwtAuthGuard } from '@core/guards/jwt-auth.guard';
import { PrismaService } from '@core/prisma/prisma.service';
import { OrdemServicoCronService } from './ordem-servico-cron.service';
import { Request as ExpressRequest } from 'express';

@Controller('modules/ordem_servico/config')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class OrdemServicoConfigController {
    constructor(
        private prisma: PrismaService,
        private cronService: OrdemServicoCronService
    ) { }

    @Get('notifications')
    async getNotificationConfigs() {
        const result = await this.prisma.$queryRaw<any[]>`
            SELECT * FROM mod_ordemServico_notification_schedules
            ORDER BY created_at DESC
        `;
        return result;
    }

    @Post('notifications')
    async createNotificationConfig(@Body() body: any) {
        const result = await this.prisma.$executeRaw`
            INSERT INTO mod_ordemServico_notification_schedules
            (title, content, audience, cron_expression, enabled)
            VALUES (
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
}