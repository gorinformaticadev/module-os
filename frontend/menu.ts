export const ModuleMenu = [
    {
        id: 'moduloOs-main',
        name: 'Ordem de Serviços',
        icon: 'Wrench', //icone principal do menu
        href: '/modules/moduloOs/pages/dashboard',
        order: 10,
        group: 'moduloOs',
        roles: ['ADMIN', 'SUPER_ADMIN', 'USER'],

        children: [
            {
                id: 'moduloOs-dashboard',
                name: 'Dashboard',
                href: '/modules/moduloOs/pages/dashboard',
                icon: 'BarChart3',
                order: 1
            },
            {
                id: 'moduloOs-lista',
                name: 'Lista',
                href: '/modules/moduloOs/pages/lista',
                icon: 'List',
                order: 2
            },
            {
                id: 'moduloOs-configuracoes',
                name: 'Configurações',
                href: '/modules/moduloOs/pages/configuracoes',
                icon: 'Settings',
                order: 3
            }
        ]
    }
];
