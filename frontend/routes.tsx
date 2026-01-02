import ordem_servicoDashboardPage from './pages/dashboard';
import ordem_servicoListaPage from './pages/lista';
import ordem_servicoConfiguracoesPage from './pages/configuracoes';

const MODULE_ROOT = '/ordem_servico';

export const ModuleRoutes = [
    { path: `${MODULE_ROOT}/dashboard`, component: ordem_servicoDashboardPage },
    { path: `${MODULE_ROOT}/lista`, component: ordem_servicoListaPage },
    { path: `${MODULE_ROOT}/configuracoes`, component: ordem_servicoConfiguracoesPage },
];
