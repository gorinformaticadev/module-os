import { Module } from '@nestjs/common';
import { ConfiguracoesController } from './configuracoes.controller';
import { ConfiguracoesService } from './configuracoes.service';
import { TiposServicoController } from './tipos-servico.controller';
import { TiposServicoService } from './tipos-servico.service';
import { TiposEquipamentoController } from './tipos-equipamento.controller';
import { TiposEquipamentoService } from './tipos-equipamento.service';
import { PrismaModule } from '@core/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [
        ConfiguracoesController,
        TiposServicoController,
        TiposEquipamentoController
    ],
    providers: [
        ConfiguracoesService,
        TiposServicoService,
        TiposEquipamentoService
    ],
    exports: [
        ConfiguracoesService,
        TiposServicoService,
        TiposEquipamentoService
    ],
})
export class ConfiguracoesModule {}