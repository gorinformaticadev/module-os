import { Controller, Get, Post, Body, UseGuards, Put } from '@nestjs/common';
import { Roles } from '@core/common/decorators/roles.decorator';
import { RolesGuard } from '@core/common/guards/roles.guard';
import { JwtAuthGuard } from '@core/common/guards/jwt-auth.guard';
import { PrismaService } from '@core/prisma/prisma.service';
import { OrdemServicoCronService } from './ordem-servico-cron.service';

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
}