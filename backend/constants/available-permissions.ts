import { AvailablePermission } from '../interfaces/permission.interface';

export const AVAILABLE_PERMISSIONS: AvailablePermission[] = [
  {
    resource: 'dashboard',
    resourceLabel: 'Dashboard',
    actions: [
      { 
        action: 'view_basic', 
        actionLabel: 'Visualizar Básico', 
        description: 'Ver estatísticas gerais e gráficos básicos' 
      },
      { 
        action: 'view_advanced', 
        actionLabel: 'Visualizar Avançado', 
        description: 'Ver relatórios detalhados e métricas de performance' 
      },
      { 
        action: 'view_financial', 
        actionLabel: 'Ver Financeiro', 
        description: 'Ver dados financeiros, valores, lucros e custos' 
      },
      { 
        action: 'export_reports', 
        actionLabel: 'Exportar Relatórios', 
        description: 'Gerar PDFs e planilhas dos relatórios' 
      }
    ]
  },
  {
    resource: 'orders',
    resourceLabel: 'Ordens de Serviço',
    actions: [
      { 
        action: 'view_own', 
        actionLabel: 'Ver Próprias', 
        description: 'Ver apenas ordens de serviço criadas pelo usuário' 
      },
      { 
        action: 'view_all', 
        actionLabel: 'Ver Todas', 
        description: 'Ver todas as ordens de serviço do tenant' 
      },
      { 
        action: 'create', 
        actionLabel: 'Criar', 
        description: 'Criar novas ordens de serviço' 
      },
      { 
        action: 'edit_own', 
        actionLabel: 'Editar Próprias', 
        description: 'Editar apenas ordens de serviço criadas pelo usuário' 
      },
      { 
        action: 'edit_all', 
        actionLabel: 'Editar Todas', 
        description: 'Editar qualquer ordem de serviço' 
      },
      { 
        action: 'delete_own', 
        actionLabel: 'Excluir Próprias', 
        description: 'Excluir apenas ordens de serviço criadas pelo usuário' 
      },
      { 
        action: 'delete_all', 
        actionLabel: 'Excluir Todas', 
        description: 'Excluir qualquer ordem de serviço' 
      },
      { 
        action: 'change_status', 
        actionLabel: 'Alterar Status', 
        description: 'Mudar status das OS (pendente, em andamento, concluída)' 
      },
      { 
        action: 'assign_technician', 
        actionLabel: 'Atribuir Técnico', 
        description: 'Designar técnicos para ordens de serviço' 
      },
      { 
        action: 'view_history', 
        actionLabel: 'Ver Histórico', 
        description: 'Ver histórico completo de alterações das OS' 
      }
    ]
  },
  {
    resource: 'clients',
    resourceLabel: 'Clientes',
    actions: [
      { 
        action: 'view', 
        actionLabel: 'Visualizar', 
        description: 'Ver lista de clientes' 
      },
      { 
        action: 'view_details', 
        actionLabel: 'Ver Detalhes', 
        description: 'Ver todos os dados completos do cliente' 
      },
      { 
        action: 'view_basic', 
        actionLabel: 'Ver Básico', 
        description: 'Ver apenas nome e informações de contato' 
      },
      { 
        action: 'create', 
        actionLabel: 'Criar', 
        description: 'Adicionar novos clientes ao sistema' 
      },
      { 
        action: 'edit', 
        actionLabel: 'Editar', 
        description: 'Modificar dados de clientes existentes' 
      },
      { 
        action: 'delete', 
        actionLabel: 'Excluir', 
        description: 'Remover clientes do sistema (com validações)' 
      },
      { 
        action: 'export', 
        actionLabel: 'Exportar', 
        description: 'Gerar relatórios e listas de clientes' 
      },
      { 
        action: 'import', 
        actionLabel: 'Importar', 
        description: 'Importar dados de clientes em lote' 
      }
    ]
  },
  {
    resource: 'products',
    resourceLabel: 'Produtos/Serviços',
    actions: [
      { 
        action: 'view', 
        actionLabel: 'Visualizar', 
        description: 'Ver catálogo de produtos e serviços' 
      },
      { 
        action: 'view_prices', 
        actionLabel: 'Ver Preços', 
        description: 'Ver valores de venda e custos dos produtos' 
      },
      { 
        action: 'create', 
        actionLabel: 'Criar', 
        description: 'Adicionar novos produtos/serviços' 
      },
      { 
        action: 'edit', 
        actionLabel: 'Editar', 
        description: 'Modificar dados de produtos existentes' 
      },
      { 
        action: 'delete', 
        actionLabel: 'Excluir', 
        description: 'Remover produtos do sistema (com validações)' 
      },
      { 
        action: 'manage_stock', 
        actionLabel: 'Gerenciar Estoque', 
        description: 'Controlar quantidades e estoque dos produtos' 
      },
      { 
        action: 'set_prices', 
        actionLabel: 'Definir Preços', 
        description: 'Alterar valores de venda dos produtos' 
      },
      { 
        action: 'upload_images', 
        actionLabel: 'Upload Imagens', 
        description: 'Adicionar e alterar imagens dos produtos' 
      }
    ]
  },
  {
    resource: 'config',
    resourceLabel: 'Configurações',
    actions: [
      { 
        action: 'view_users', 
        actionLabel: 'Ver Usuários', 
        description: 'Ver lista de usuários do sistema' 
      },
      { 
        action: 'manage_permissions', 
        actionLabel: 'Gerenciar Permissões', 
        description: 'Alterar permissões de outros usuários' 
      },
      { 
        action: 'create_users', 
        actionLabel: 'Criar Usuários', 
        description: 'Adicionar novos usuários ao sistema' 
      },
      { 
        action: 'edit_users', 
        actionLabel: 'Editar Usuários', 
        description: 'Modificar dados de usuários existentes' 
      },
      { 
        action: 'deactivate_users', 
        actionLabel: 'Desativar Usuários', 
        description: 'Desabilitar acesso de usuários ao sistema' 
      },
      { 
        action: 'view_logs', 
        actionLabel: 'Ver Logs', 
        description: 'Ver logs de auditoria e atividades do sistema' 
      },
      { 
        action: 'system_config', 
        actionLabel: 'Config Sistema', 
        description: 'Alterar configurações gerais do módulo' 
      },
      { 
        action: 'backup_restore', 
        actionLabel: 'Backup/Restore', 
        description: 'Gerenciar backups e restauração dos dados' 
      }
    ]
  }
];

// Helper function para buscar permissões por recurso
export function getPermissionsByResource(resource: string): AvailablePermission | undefined {
  return AVAILABLE_PERMISSIONS.find(p => p.resource === resource);
}

// Helper function para verificar se uma ação existe para um recurso
export function isValidPermission(resource: string, action: string): boolean {
  const resourcePermissions = getPermissionsByResource(resource);
  if (!resourcePermissions) return false;
  
  return resourcePermissions.actions.some(a => a.action === action);
}

// Helper function para obter todas as ações de um recurso
export function getResourceActions(resource: string): string[] {
  const resourcePermissions = getPermissionsByResource(resource);
  if (!resourcePermissions) return [];
  
  return resourcePermissions.actions.map(a => a.action);
}