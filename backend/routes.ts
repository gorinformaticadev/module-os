import { OrdemServicoController } from './controllers/ordemServico.controller';
import { ClientesController } from './controllers/clientes.controller';
import { OrdemServicoConfiguracoesController } from './controllers/configuracoes.controller';
import { PermissionController } from './controllers/permission.controller';
import { TemplateController } from './controllers/template.controller';
import { ProdutosController } from './controllers/produtos.controller';

export const ModuleRoutes = [
    OrdemServicoController,
    ClientesController,
    OrdemServicoConfiguracoesController,
    PermissionController,
    TemplateController,
    ProdutosController
];
