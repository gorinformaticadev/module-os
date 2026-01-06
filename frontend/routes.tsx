import ordem_servicoDashboardPage from './pages/dashboard';
import ordem_servicoListaPage from './pages/lista';
import ordem_servicoConfiguracoesPage from './pages/configuracoes';
import ordem_servicoClientesPage from './pages/clientes';
import ordem_servicoProdutosPage from './pages/produtos';
import ordem_servicoOrdensPage from './pages/ordens';
import ordem_servicoNovaOrdemPage from './pages/ordens/new';

const MODULE_ROOT = '/ordem_servico';

export const ModuleRoutes = [
    { path: `${MODULE_ROOT}/dashboard`, component: ordem_servicoDashboardPage },
    { path: `${MODULE_ROOT}/lista`, component: ordem_servicoListaPage },
    { path: `${MODULE_ROOT}/configuracoes`, component: ordem_servicoConfiguracoesPage },
    { path: `${MODULE_ROOT}/clientes`, component: ordem_servicoClientesPage },
    { path: `${MODULE_ROOT}/produtos`, component: ordem_servicoProdutosPage },
    { path: `${MODULE_ROOT}/ordens`, component: ordem_servicoOrdensPage },
    { path: `${MODULE_ROOT}/ordens/new`, component: ordem_servicoNovaOrdemPage },
];
