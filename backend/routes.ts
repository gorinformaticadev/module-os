import { ProdutosController } from './produtos/src/produtos.controller';
import { OrdensController } from './ordens/src/ordens.controller';
import { ConfiguracoesController } from './configuracoes/configuracoes.controller';
import { PermissionController } from './shared/controllers/permission.controller';
import { TemplateController } from './shared/controllers/template.controller';
import { OrdemServicoConfigController } from './core/ordem-servico-config.controller';

export const ModuleRoutes = [
    ProdutosController,
    OrdensController,
    ConfiguracoesController,
    PermissionController,
    TemplateController,
    OrdemServicoConfigController
];