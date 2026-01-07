import { Module } from '@nestjs/common';
import { OrdemServicoConfigController } from './ordem-servico-config.controller';
import { OrdemServicoCronService } from './ordem-servico-cron.service';
import { CronModule } from '@core/cron/cron.module';
import { PrismaModule } from '@core/prisma/prisma.module';

@Module({
    imports: [CronModule, PrismaModule],
    controllers: [OrdemServicoConfigController],
    providers: [OrdemServicoCronService],
    exports: [OrdemServicoCronService],
})
export class CoreModule {}