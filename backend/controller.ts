
import { Controller, Get, Post, Body, UseGuards, Put } from '@nestjs/common';
import { Roles } from '@core/roles.decorator';
import { RolesGuard } from '@core/roles.guard';
import { JwtAuthGuard } from '@core/jwt-auth.guard';
import { PrismaService } from '@core/prisma/prisma.service';
import { moduloOsCronService } from './cron.service';

@Controller('modules/moduloOs/config')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class moduloOsConfigController {
    constructor(
        private prisma: PrismaService,
        private moduloOsCron: moduloOsCronService
    ) { }

    @Get('notifications')
    async getNotificationConfigs() {
        const result = await this.prisma.$queryRaw<any[]>`
            SELECT * FROM mod_moduloOs_notification_schedules
            ORDER BY created_at DESC
        `;
        return result;
    }

    @Post('notifications')
    async createNotificationConfig(@Body() body: any) {
        const result = await this.prisma.$executeRaw`
            INSERT INTO mod_moduloOs_notification_schedules
            (title, content, audience, cron_expression, enabled)
            VALUES (
                ${body.title},
                ${body.content},
                ${body.audience},
                ${body.cronExpression},
                ${body.enabled ?? true}
            )
        `;

        await this.moduloOsCron.registerNotificationJob();

        return result;
    }
}
