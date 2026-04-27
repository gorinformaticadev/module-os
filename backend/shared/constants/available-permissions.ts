import { AvailablePermission } from "../interfaces/permission.interface";

export const AVAILABLE_PERMISSIONS: AvailablePermission[] = [
  {
    resource: "dashboard",
    name: "Dashboard",
    description: "Acesso ao painel principal do módulo",
    actions: [
      {
        action: "view",
        name: "Visualizar Dashboard",
        description: "Permite visualizar o dashboard principal",
      },
      {
        action: "view_statistics",
        name: "Ver Estatísticas",
        description: "Permite visualizar estatísticas e relatórios",
      },
    ],
  },
  {
    resource: "clients",
    name: "Clientes",
    description: "Gestão de clientes",
    actions: [
      {
        action: "view",
        name: "Listar Clientes",
        description: "Permite visualizar a lista de clientes",
      },
      {
        action: "view_details",
        name: "Ver Detalhes",
        description: "Permite visualizar detalhes completos do cliente",
      },
      {
        action: "create",
        name: "Criar Cliente",
        description: "Permite criar novos clientes",
      },
      {
        action: "edit",
        name: "Editar Cliente",
        description: "Permite editar dados dos clientes",
      },
      {
        action: "delete",
        name: "Excluir Cliente",
        description: "Permite excluir clientes",
      },
      {
        action: "upload_images",
        name: "Upload de Imagens",
        description: "Permite fazer upload de fotos dos clientes",
      },
    ],
  },
  {
    resource: "products",
    name: "Produtos/Serviços",
    description: "Gestão de produtos e serviços",
    actions: [
      {
        action: "view",
        name: "Listar Produtos",
        description: "Permite visualizar a lista de produtos/serviços",
      },
      {
        action: "create",
        name: "Criar Produto",
        description: "Permite criar novos produtos/serviços",
      },
      {
        action: "edit",
        name: "Editar Produto",
        description: "Permite editar produtos/serviços",
      },
      {
        action: "delete",
        name: "Excluir Produto",
        description: "Permite excluir produtos/serviços",
      },
      {
        action: "upload_images",
        name: "Upload de Imagens",
        description: "Permite fazer upload de imagens dos produtos",
      },
    ],
  },
  {
    resource: "orders",
    name: "Ordens de Serviço",
    description: "Gestão de ordens de serviço",
    actions: [
      {
        action: "view",
        name: "Listar Ordens",
        description: "Permite visualizar a lista de ordens de serviço",
      },
      {
        action: "view_details",
        name: "Ver Detalhes",
        description: "Permite visualizar detalhes completos da ordem",
      },
      {
        action: "create",
        name: "Criar Ordem",
        description: "Permite criar novas ordens de serviço",
      },
      {
        action: "edit",
        name: "Editar Ordem",
        description: "Permite editar ordens de serviço",
      },
      {
        action: "delete",
        name: "Excluir Ordem",
        description: "Permite excluir ordens de serviço",
      },
      {
        action: "change_status",
        name: "Alterar Status",
        description: "Permite alterar o status das ordens",
      },
      {
        action: "approve_budget",
        name: "Aprovar Orçamento",
        description: "Permite aprovar orçamentos",
      },
      {
        action: "view_history",
        name: "Ver Histórico",
        description: "Permite visualizar o histórico das ordens",
      },
    ],
  },
  {
    resource: "config",
    name: "Configurações",
    description: "Configurações do módulo",
    actions: [
      {
        action: "view",
        name: "Ver Configurações",
        description: "Permite visualizar as configurações",
      },
      {
        action: "edit",
        name: "Editar Configurações",
        description: "Permite editar configurações do módulo",
      },
      {
        action: "manage_permissions",
        name: "Gerenciar Permissões",
        description: "Permite gerenciar permissões de usuários",
      },
      {
        action: "manage_notifications",
        name: "Gerenciar Notificações",
        description: "Permite gerenciar notificações automáticas",
      },
    ],
  },
];
