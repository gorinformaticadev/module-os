export const MODULE_SLUG = 'ordem_servico';
export const MODULE_NAME = 'Ordem de Servicos';
export const MODULE_DISPLAY_NAME = 'Ordem de Servicos';
export const MODULE_VERSION = '3.1.0';
export const MODULE_ICON = 'Wrench';
export const MODULE_ROUTE_ROOT = `/modules/${MODULE_SLUG}/pages`;

export type ModuleMenuEntry = {
    id: string;
    label: string;
    icon: string;
    route: string;
    order: number;
};

export const MODULE_MENU_ENTRIES: ModuleMenuEntry[] = [
    {
        id: `${MODULE_SLUG}-dashboard`,
        label: 'Dashboard',
        icon: 'BarChart3',
        route: `${MODULE_ROUTE_ROOT}/dashboard`,
        order: 1,
    },
    {
        id: `${MODULE_SLUG}-ordens`,
        label: 'Ordens de Servico',
        icon: 'ClipboardList',
        route: `${MODULE_ROUTE_ROOT}/ordens`,
        order: 2,
    },
    {
        id: `${MODULE_SLUG}-clientes`,
        label: 'Clientes',
        icon: 'Users',
        route: `${MODULE_ROUTE_ROOT}/clientes`,
        order: 3,
    },
    {
        id: `${MODULE_SLUG}-produtos`,
        label: 'Produtos / Servicos',
        icon: 'Package',
        route: `${MODULE_ROUTE_ROOT}/produtos`,
        order: 4,
    },
    {
        id: `${MODULE_SLUG}-configuracoes`,
        label: 'Configuracoes',
        icon: 'Settings',
        route: `${MODULE_ROUTE_ROOT}/configuracoes`,
        order: 5,
    },
];
