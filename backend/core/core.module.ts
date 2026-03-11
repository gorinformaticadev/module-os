import { Module } from '@nestjs/common';
import { OrdemServicoConfigController } from './ordem-servico-config.controller';
import { OrdemServicoCronService } from './ordem-servico-cron.service';
import { CronModule } from '@core/cron/cron.module';
import { PrismaModule } from '@core/prisma/prisma.module';
import { NotificationsModule as RootNotificationsModule } from '../../../notifications/notifications.module';
import { SharedModule } from '../shared/shared.module';

@Module({
    imports: [CronModule, PrismaModule, RootNotificationsModule, SharedModule],
    controllers: [OrdemServicoConfigController],
    providers: [OrdemServicoCronService],
    exports: [OrdemServicoCronService],
})
export class CoreModule { }
