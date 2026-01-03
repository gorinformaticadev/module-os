export const ModuleMenu = [
    {
        id: 'ordem_servico-main',
        name: 'Ordem de Serviço',
        icon: 'Wrench',
        href: '/ordem_servico/dashboard',
        order: 10,
        group: 'ordem_servico',
        roles: ['ADMIN', 'SUPER_ADMIN', 'ATENDENTE', 'TECNICO'],

        children: [
            {
                id: 'ordem_servico-dashboard',
                name: 'Dashboard',
                href: '/ordem_servico/dashboard',
                icon: 'BarChart3',
                order: 1
            },
            {
                id: 'ordem_servico-ordens',
                name: 'Ordens de Serviço',
                href: '/ordem_servico/ordens',
                icon: 'ClipboardList',
                order: 2
            },
            {
                id: 'ordem_servico-clientes',
                name: 'Clientes',
                href: '/ordem_servico/clientes',
                icon: 'Users',
                order: 3
            },
            {
                id: 'ordem_servico-produtos',
                name: 'Produtos / Serviços',
                href: '/ordem_servico/produtos',
                icon: 'Package',
                order: 4
            },
            {
                id: 'ordem_servico-configuracoes',
                name: 'Configurações',
                href: '/ordem_servico/configuracoes',
                icon: 'Settings',
                order: 5
            }
        ]
    }
];
