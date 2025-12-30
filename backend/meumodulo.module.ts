
import { Module } from '@nestjs/common';
import { moduloOsCronService } from './cron.service';
import { moduloOsConfigController } from './controller';
import { CronModule } from '@core/cron/cron.module';
import { PrismaModule } from '@core/prisma/prisma.module';

@Module({
    imports: [CronModule, PrismaModule],
    providers: [moduloOsCronService],
    controllers: [moduloOsConfigController],
})
export class moduloOsModule { }
