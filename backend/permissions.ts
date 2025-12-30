export const ModulePermissions = {
    driver: 'acl',
    permissions: [
        {
            slug: 'moduloOs.view',
            name: 'Visualizar Ordem de Serviços',
            description: 'Permite visualizar o módulo moduloOs',
            roles: ['ADMIN', 'USER', 'GUEST']
        },
        {
            slug: 'moduloOs.create',
            name: 'Criar Configurações',
            description: 'Permite criar configurações no moduloOs',
            roles: ['ADMIN']
        },
        {
            slug: 'moduloOs.edit',
            name: 'Editar Ordem de Serviços',
            description: 'Permite editar configurações do moduloOs',
            roles: ['ADMIN']
        },
        {
            slug: 'moduloOs.delete',
            name: 'Excluir Ordem de Serviços',
            description: 'Permite excluir configurações do moduloOs',
            roles: ['ADMIN']
        },
        {
            slug: 'moduloOs.admin',
            name: 'Administrar Ordem de Serviços',
            description: 'Permite administrar o módulo moduloOs',
            roles: ['ADMIN']
        }
    ]
};
