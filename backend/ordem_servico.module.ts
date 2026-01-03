import { Module } from '@nestjs/common';
import { OrdemServicoCronService } from './cron.service';
import { OrdemServicoConfigController } from './controller';
import { OrdemServicoService } from './services/ordemServico.service';
import { OrdemServicoController } from './controllers/ordemServico.controller';
import { ClientesService } from './services/clientes.service';
import { ClientesController } from './controllers/clientes.controller';
import { ProdutosService } from './services/produtos.service';
import { ProdutosController } from './controllers/produtos.controller';
import { OrdemServicoConfiguracoesService } from './services/configuracoes.service';
import { OrdemServicoConfiguracoesController } from './controllers/configuracoes.controller';
import { PermissionService } from './services/permission.service';
import { PermissionController } from './controllers/permission.controller';
import { TemplateService } from './services/template.service';
import { TemplateController } from './controllers/template.controller';
import { OrdensService } from './services/ordens.service';
import { OrdensController } from './controllers/ordens.controller';
import { CronModule } from '@core/cron/cron.module';
import { PrismaModule } from '@core/prisma/prisma.module';
import { AuditModule } from '@core/audit/audit.module';

@Module({
    imports: [CronModule, PrismaModule, AuditModule],
    providers: [
        OrdemServicoCronService,
        OrdemServicoService,
        ClientesService,
        ProdutosService,
        OrdemServicoConfiguracoesService,
        PermissionService,
        TemplateService,
        OrdensService
    ],
    controllers: [
        OrdemServicoConfigController,
        OrdemServicoController,
        ClientesController,
        ProdutosController,
        OrdemServicoConfiguracoesController,
        PermissionController,
        TemplateController,
        OrdensController
    ],
})
export class OrdemServicoModule {
    constructor() {
        console.log('✅✅✅ MÓDULO ORDEM_SERVICO CARREGADO COM TODAS AS FUNCIONALIDADES!!! ✅✅✅');
    }
}
