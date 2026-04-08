import { Module } from '@nestjs/common';
import { ClientesController } from './clientes.controller';
import { ClientesService } from './clientes.service';
import { AuditModule } from '@core/audit/audit.module';
import { SharedModule } from '../shared/shared.module';
import { ModuleOsPrismaModule } from '../prisma/module-os-prisma.module';

@Module({
    imports: [ModuleOsPrismaModule, AuditModule, SharedModule],
    controllers: [ClientesController],
    providers: [ClientesService],
    exports: [ClientesService],
})
export class ClientesModule {}
