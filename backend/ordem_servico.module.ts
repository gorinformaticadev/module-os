import { Module } from '@nestjs/common';
import { ClientesModule } from './clientes/clientes.module';
import { ProdutosModule } from './produtos/produtos.module';
import { OrdensModule } from './ordens/ordens.module';
import { ConfiguracoesModule } from './configuracoes/configuracoes.module';
import { SharedModule } from './shared/shared.module';
import { CoreModule } from './core/core.module';
import { PrismaModule } from '@core/prisma/prisma.module';
import { AuditModule } from '@core/audit/audit.module';

@Module({
    imports: [
        PrismaModule,
        AuditModule,
        SharedModule,
        CoreModule,
        ClientesModule,
        ProdutosModule,
        OrdensModule,
        ConfiguracoesModule,
    ],
    exports: [
        ClientesModule,
        ProdutosModule,
        OrdensModule,
        ConfiguracoesModule,
        SharedModule,
        CoreModule,
    ],
})
export class OrdemServicoModule {
    constructor() {
        const fs = require('fs');
        const logMsg = `[${new Date().toISOString()}] ✅✅✅ MÓDULO ORDEM_SERVICO CARREGADO!!!\n`;
        fs.appendFileSync('d:/github/Projeto-menu-multitenant-seguro/module_loading_debug.log', logMsg);
        console.log('✅✅✅ MÓDULO ORDEM_SERVICO REORGANIZADO E CARREGADO COM TODAS AS FUNCIONALIDADES!!! ✅✅✅');
    }
}