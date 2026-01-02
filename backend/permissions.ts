export const ModulePermissions = {
    driver: 'acl',
    permissions: [
        {
            slug: 'ordem_servico.view',
            name: 'Visualizar Ordem de Serviços',
            description: 'Permite visualizar o módulo ordem_servico',
            roles: ['ADMIN', 'USER', 'GUEST']
        },
        {
            slug: 'ordem_servico.create',
            name: 'Criar Configurações',
            description: 'Permite criar configurações no ordem_servico',
            roles: ['ADMIN']
        },
        {
            slug: 'ordem_servico.edit',
            name: 'Editar Ordem de Serviços',
            description: 'Permite editar configurações do ordem_servico',
            roles: ['ADMIN']
        },
        {
            slug: 'ordem_servico.delete',
            name: 'Excluir Ordem de Serviços',
            description: 'Permite excluir configurações do ordem_servico',
            roles: ['ADMIN']
        },
        {
            slug: 'ordem_servico.admin',
            name: 'Administrar Ordem de Serviços',
            description: 'Permite administrar o módulo ordem_servico',
            roles: ['ADMIN']
        }
    ]
};
