import { Module } from '@nestjs/common';
import { OrdemServicoCronService } from './cron.service';
import { OrdemServicoConfigController } from './controller';
import { OrdemServicoService } from './services/ordemServico.service';
import { OrdemServicoController } from './controllers/ordemServico.controller';
import { CronModule } from '@core/cron/cron.module';
import { PrismaModule } from '@core/prisma/prisma.module';

@Module({
    imports: [CronModule, PrismaModule],
    providers: [OrdemServicoCronService, OrdemServicoService],
    controllers: [OrdemServicoConfigController, OrdemServicoController],
})
export class OrdemServicoModule { }
