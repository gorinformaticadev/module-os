export const ModuleMenu = [
    {
        id: 'ordem_servico-main',
        name: 'Ordem de Serviço',
        icon: 'Wrench',
        href: '/modules/ordem_servico/pages/dashboard',
        order: 10,
        group: 'ordem_servico',
        roles: ['ADMIN', 'SUPER_ADMIN', 'ATENDENTE', 'TECNICO'],

        children: [
            {
                id: 'ordem_servico-dashboard',
                name: 'Dashboard',
                href: '/modules/ordem_servico/pages/dashboard',
                icon: 'BarChart3',
                order: 1
            },
            {
                id: 'ordem_servico-ordens',
                name: 'Ordens de Serviço',
                href: '/modules/ordem_servico/pages/ordens',
                icon: 'ClipboardList',
                order: 2
            },
            {
                id: 'ordem_servico-clientes',
                name: 'Clientes',
                href: '/modules/ordem_servico/pages/clientes',
                icon: 'Users',
                order: 3
            },
            {
                id: 'ordem_servico-produtos',
                name: 'Produtos / Serviços',
                href: '/modules/ordem_servico/pages/produtos',
                icon: 'Package',
                order: 4
            },
            {
                id: 'ordem_servico-configuracoes',
                name: 'Configurações',
                href: '/modules/ordem_servico/pages/configuracoes',
                icon: 'Settings',
                order: 5
            }
        ]
    }
];
