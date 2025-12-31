import { Module } from '@nestjs/common';
import { OrdemServicoCronService } from './cron.service';
import { OrdemServicoConfigController } from './controller';
import { OrdemServicoService } from './services/ordemServico.service';
import { OrdemServicoController } from './controllers/ordemServico.controller';
import { ClientesService } from './services/clientes.service';
import { ClientesController } from './controllers/clientes.controller';
import { CronModule } from '@core/cron/cron.module';
import { PrismaModule } from '@core/prisma/prisma.module';
import { AuditModule } from '@core/audit/audit.module';

@Module({
    imports: [CronModule, PrismaModule, AuditModule],
    providers: [
        OrdemServicoCronService,
        OrdemServicoService,
        ClientesService
    ],
    controllers: [
        OrdemServicoConfigController,
        OrdemServicoController,
        ClientesController
    ],
})
export class OrdemServicoModule { }
