import { ClientesController } from './clientes/clientes.controller';
import { ProdutosController } from './produtos/produtos.controller';
import { OrdensController } from './ordens/ordens.controller';
import { ConfiguracoesController } from './configuracoes/configuracoes.controller';
import { PermissionController } from './shared/controllers/permission.controller';
import { TemplateController } from './shared/controllers/template.controller';
import { OrdemServicoConfigController } from './core/ordem-servico-config.controller';

export const ModuleRoutes = [
    ClientesController,
    ProdutosController,
    OrdensController,
    ConfiguracoesController,
    PermissionController,
    TemplateController,
    OrdemServicoConfigController
];