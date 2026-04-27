import { Module } from '@nestjs/common';
import { AuditModule } from '@core/audit/audit.module';
import { CommonModule } from '@common/common.module';
import { SharedModule } from '../../shared/shared.module';
import { ClientesController } from './clientes.controller';
import { ClientesService } from './clientes.service';
import { ClienteRepository } from './repositories/cliente.repository';

@Module({
  imports: [CommonModule, AuditModule, SharedModule],
  controllers: [ClientesController],
  providers: [ClientesService, ClienteRepository],
  exports: [ClientesService],
})
export class ClientesModule {}
