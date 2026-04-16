import { Module } from '@nestjs/common';
import { ProdutosController } from './produtos.controller';
import { ProdutosService } from './produtos.service';
import { AuditModule } from '@core/audit/audit.module';
import { SharedModule } from '../../shared/shared.module';
import { ModuleOsPrismaModule } from '../../prisma/module-os-prisma.module';
import { ProdutoRepository } from './repositories/produto.repository';

@Module({
    imports: [ModuleOsPrismaModule, AuditModule, SharedModule],
    controllers: [ProdutosController],
    providers: [ProdutosService, ProdutoRepository],
    exports: [ProdutosService],
})
export class ProdutosModule {}
