import moduloOsDashboardPage from './pages/dashboard';
import moduloOsListaPage from './pages/lista';
import moduloOsConfiguracoesPage from './pages/configuracoes';

const MODULE_ROOT = '/moduloOs';

export const ModuleRoutes = [
    { path: `${MODULE_ROOT}/dashboard`, component: moduloOsDashboardPage },
    { path: `${MODULE_ROOT}/lista`, component: moduloOsListaPage },
    { path: `${MODULE_ROOT}/configuracoes`, component: moduloOsConfiguracoesPage },
];
