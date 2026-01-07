import { Module } from '@nestjs/common';
import { ProdutosController } from './produtos.controller';
import { ProdutosService } from './produtos.service';
import { PrismaModule } from '@core/prisma/prisma.module';
import { AuditModule } from '@core/audit/audit.module';
import { SharedModule } from '../shared/shared.module';

@Module({
    imports: [PrismaModule, AuditModule, SharedModule],
    controllers: [ProdutosController],
    providers: [ProdutosService],
    exports: [ProdutosService],
})
export class ProdutosModule {}