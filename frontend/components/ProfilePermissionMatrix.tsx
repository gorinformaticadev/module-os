import React, { useState, useEffect } from 'react';
import { Save, X, Shield, Users, Package, Settings, BarChart3, CheckCircle, XCircle, Info } from 'lucide-react';

// Função auxiliar para recuperar token de forma segura
const getToken = () => {
  if (typeof window === 'undefined') return '';

  // 1. Tentar ler do cookie
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(c => c.trim().startsWith('accessToken='));
  if (tokenCookie) return tokenCookie.split('=')[1];

  // 2. Fallback para sessionStorage (criptografado em base64)
  const encrypted = sessionStorage.getItem("@App:token");
  if (encrypted) {
    try { return atob(encrypted); } catch { return ''; }
  }

  return '';
};

// Cliente API customizado para o módulo raiz
const api = {
  get: async (url: string) => {
    // Usar NEXT_PUBLIC_API_URL se disponível, senão fallback (evitar localhost:3001)
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    console.log(`📡 [ProfileMatrix] GET ${baseUrl}${url}`);

    const token = getToken();

    const response = await fetch(`${baseUrl}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      console.error(`❌ [ProfileMatrix] GET Error: ${response.status}`);
      throw new Error(`HTTP ${response.status}`);
    }
    return { data: await response.json() };
  },
  post: async (url: string, data: any) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const token = getToken();
    const response = await fetch(`${baseUrl}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return { data: await response.json() };
  },
  put: async (url: string, data: any) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const token = getToken();
    const response = await fetch(`${baseUrl}${url}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return { data: await response.json() };
  }
};

// Definição dos perfis
type Profile = 'admin' | 'technician' | 'attendant';

// Definição das regras de permissão
interface PermissionRule {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
}

// Estado das permissões por perfil
interface ProfilePermissions {
  admin: boolean;
  technician: boolean;
  attendant: boolean;
}

interface ProfilePermissionMatrixProps {
  onClose: () => void;
  onSave: () => void;
}

// Importar componentes UI reais do sistema
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`rounded-xl border border-border/50 bg-card/90 dark:bg-card/60 backdrop-blur-sm text-card-foreground shadow-sm hover:shadow-md transition-all duration-300 ${className || ''}`}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex flex-col space-y-1.5 p-6 ${className || ''}`}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={`text-lg font-semibold leading-none tracking-tight ${className || ''}`}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={`text-sm text-muted-foreground ${className || ''}`}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={`p-6 pt-0 ${className || ''}`} {...props} />
));
CardContent.displayName = "CardContent";

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}>(({ className, variant = "default", size = "default", ...props }, ref) => {
  const baseClasses = "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 hover:shadow-md";
  const sizeClasses = size === "sm" ? "h-9 rounded-md px-3" : size === "lg" ? "h-11 rounded-md px-8" : size === "icon" ? "h-10 w-10" : "h-10 px-4 py-2";
  const variantClasses = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground hover:shadow-none",
    link: "text-primary underline-offset-4 hover:underline hover:shadow-none",
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses[variant]} ${className || ''}`}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";

const Badge = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "secondary" | "destructive" | "outline";
}>(({ className, variant = "default", ...props }, ref) => {
  const variantClasses = {
    default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
    outline: "text-foreground",
  };

  return (
    <div
      ref={ref}
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variantClasses[variant]} ${className || ''}`}
      {...props}
    />
  );
});
Badge.displayName = "Badge";

const Checkbox = ({ id, checked, onCheckedChange, disabled = false }: {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) => (
  <input
    type="checkbox"
    id={id}
    checked={checked}
    disabled={disabled}
    onChange={(e) => onCheckedChange(e.target.checked)}
    className="peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
  />
);

// Componente Tooltip para mostrar descrições
const Tooltip = ({ content, children }: { content: string; children: React.ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg -top-2 left-6 transform -translate-y-full whitespace-nowrap max-w-xs">
          {content}
          <div className="absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

// Hook toast simples
const useToast = () => ({
  toast: ({ title, description }: { title: string; description?: string; variant?: string }) => {
    console.log(`Toast: ${title}${description ? ` - ${description}` : ''}`);
    // Em produção, isso seria substituído por uma biblioteca de toast real
  }
});

// Definição das regras de permissão
const PERMISSION_RULES: PermissionRule[] = [
  // Dashboard
  {
    id: 'dashboard_view',
    name: 'Acesso ao Dashboard',
    description: 'Visualizar dashboard principal com estatísticas e gráficos',
    category: 'Dashboard',
    icon: <BarChart3 className="h-4 w-4" />
  },
  {
    id: 'dashboard_view_statistics',
    name: 'Exportar Relatórios',
    description: 'Exportar dados e relatórios do dashboard',
    category: 'Dashboard',
    icon: <BarChart3 className="h-4 w-4" />
  },

  // Ordens de Serviço
  {
    id: 'orders_view',
    name: 'Visualizar Ordens',
    description: 'Ver lista e detalhes das ordens de serviço',
    category: 'Ordens de Serviço',
    icon: <Package className="h-4 w-4" />
  },
  {
    id: 'orders_view_details',
    name: 'Ver Detalhes das Ordens',
    description: 'Visualizar detalhes completos das ordens de servico',
    category: 'Ordens de Servico',
    icon: <Package className="h-4 w-4" />
  },
  {
    id: 'orders_create',
    name: 'Criar Ordens',
    description: 'Criar novas ordens de serviço',
    category: 'Ordens de Serviço',
    icon: <Package className="h-4 w-4" />
  },
  {
    id: 'orders_edit',
    name: 'Editar Ordens',
    description: 'Modificar ordens de serviço existentes',
    category: 'Ordens de Serviço',
    icon: <Package className="h-4 w-4" />
  },
  {
    id: 'orders_delete',
    name: 'Excluir Ordens',
    description: 'Remover ordens de serviço do sistema',
    category: 'Ordens de Serviço',
    icon: <Package className="h-4 w-4" />
  },
  {
    id: 'orders_change_status',
    name: 'Atribuir Técnicos',
    description: 'Designar técnicos para ordens de serviço',
    category: 'Ordens de Serviço',
    icon: <Package className="h-4 w-4" />
  },

  {
    id: 'orders_approve_budget',
    name: 'Aprovar Orcamento',
    description: 'Aprovar ordens em status de orcamento',
    category: 'Ordens de Servico',
    icon: <Package className="h-4 w-4" />
  },
  {
    id: 'orders_view_history',
    name: 'Ver Historico',
    description: 'Visualizar historico e timeline das ordens',
    category: 'Ordens de Servico',
    icon: <Package className="h-4 w-4" />
  },
  // Clientes
  {
    id: 'clients_view',
    name: 'Visualizar Clientes',
    description: 'Ver lista e detalhes dos clientes',
    category: 'Clientes',
    icon: <Users className="h-4 w-4" />
  },
  {
    id: 'clients_view_details',
    name: 'Ver Detalhes dos Clientes',
    description: 'Visualizar detalhes completos dos clientes',
    category: 'Clientes',
    icon: <Users className="h-4 w-4" />
  },
  {
    id: 'clients_create',
    name: 'Criar Clientes',
    description: 'Cadastrar novos clientes',
    category: 'Clientes',
    icon: <Users className="h-4 w-4" />
  },
  {
    id: 'clients_edit',
    name: 'Editar Clientes',
    description: 'Modificar dados dos clientes',
    category: 'Clientes',
    icon: <Users className="h-4 w-4" />
  },
  {
    id: 'clients_delete',
    name: 'Excluir Clientes',
    description: 'Remover clientes do sistema',
    category: 'Clientes',
    icon: <Users className="h-4 w-4" />
  },

  {
    id: 'clients_upload_images',
    name: 'Upload de Imagens de Cliente',
    description: 'Enviar fotos e avatar dos clientes',
    category: 'Clientes',
    icon: <Users className="h-4 w-4" />
  },
  // Produtos
  {
    id: 'products_view',
    name: 'Visualizar Produtos',
    description: 'Ver catálogo de produtos e serviços',
    category: 'Produtos',
    icon: <Package className="h-4 w-4" />
  },
  {
    id: 'products_create',
    name: 'Criar Produtos',
    description: 'Cadastrar novos produtos e serviços',
    category: 'Produtos',
    icon: <Package className="h-4 w-4" />
  },
  {
    id: 'products_edit',
    name: 'Editar Produtos',
    description: 'Modificar produtos e serviços existentes',
    category: 'Produtos',
    icon: <Package className="h-4 w-4" />
  },
  {
    id: 'products_delete',
    name: 'Excluir Produtos',
    description: 'Remover produtos do catálogo',
    category: 'Produtos',
    icon: <Package className="h-4 w-4" />
  },

  // Configurações
  {
    id: 'products_upload_images',
    name: 'Upload de Imagens de Produto',
    description: 'Enviar imagens para produtos e servicos',
    category: 'Produtos',
    icon: <Package className="h-4 w-4" />
  },
  {
    id: 'config_view',
    name: 'Visualizar Configurações',
    description: 'Acessar área de configurações do módulo',
    category: 'Configurações',
    icon: <Settings className="h-4 w-4" />
  },
  {
    id: 'config_edit',
    name: 'Gerenciar Usuários',
    description: 'Configurar usuários e seus papéis',
    category: 'Configurações',
    icon: <Settings className="h-4 w-4" />
  },
  {
    id: 'config_manage_permissions',
    name: 'Gerenciar Permissões',
    description: 'Configurar permissões e perfis de acesso',
    category: 'Configurações',
    icon: <Settings className="h-4 w-4" />
  },
  {
    id: 'config_manage_notifications',
    name: 'Configurações do Sistema',
    description: 'Alterar configurações gerais do módulo',
    category: 'Configurações',
    icon: <Settings className="h-4 w-4" />
  }
];

export const ProfilePermissionMatrix: React.FC<ProfilePermissionMatrixProps> = ({
  onClose,
  onSave
}) => {
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<Record<string, ProfilePermissions>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      console.log('🔍 Carregando permissões de perfil...');

      const response = await api.get('/api/ordem_servico/config/profile-permissions');
      console.log('📦 Permissões carregadas:', response.data);

      // Inicializar permissões com valores padrão se não existirem
      const initialPermissions: Record<string, ProfilePermissions> = {};

      PERMISSION_RULES.forEach(rule => {
        initialPermissions[rule.id] = {
          admin: response.data?.[rule.id]?.admin ?? true, // Admin tem tudo por padrão
          technician: response.data?.[rule.id]?.technician ?? false,
          attendant: response.data?.[rule.id]?.attendant ?? false
        };
      });

      setPermissions(initialPermissions);
    } catch (error) {
      console.error('❌ Erro ao carregar permissões:', error);

      // Inicializar com valores padrão em caso de erro
      const defaultPermissions: Record<string, ProfilePermissions> = {};
      PERMISSION_RULES.forEach(rule => {
        defaultPermissions[rule.id] = {
          admin: true, // Admin tem tudo por padrão
          technician: [
            'dashboard_view',
            'dashboard_view_statistics',
            'orders_view',
            'orders_view_details',
            'orders_create',
            'orders_edit',
            'orders_change_status',
            'orders_view_history',
            'clients_view',
            'clients_view_details',
            'clients_create',
            'clients_edit',
            'clients_upload_images',
            'products_view',
            'products_create',
            'products_edit',
            'products_upload_images',
            'config_view'
          ].includes(rule.id),
          attendant: [
            'dashboard_view',
            'orders_view',
            'orders_view_details',
            'orders_create',
            'clients_view',
            'clients_view_details',
            'clients_create',
            'clients_edit',
            'clients_upload_images',
            'products_view',
            'products_create',
            'products_edit',
            'products_upload_images'
          ].includes(rule.id)
        };
      });
      setPermissions(defaultPermissions);

      toast({
        title: 'Aviso',
        description: 'Carregadas permissões padrão. Salve para persistir as configurações.',
        variant: 'warning'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (ruleId: string, profile: Profile, allowed: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [ruleId]: {
        ...prev[ruleId],
        [profile]: allowed
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      console.log('💾 Salvando permissões de perfil...', permissions);

      await api.post('/api/ordem_servico/config/profile-permissions', {
        permissions
      });

      toast({
        title: 'Sucesso',
        description: 'Permissões de perfil atualizadas com sucesso!',
      });

      onSave();
      onClose();
    } catch (error) {
      console.error('❌ Erro ao salvar permissões:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as permissões.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const getProfileBadgeColor = (profile: Profile) => {
    switch (profile) {
      case 'admin': return 'bg-purple-500 text-white';
      case 'technician': return 'bg-blue-500 text-white';
      case 'attendant': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getProfileLabel = (profile: Profile) => {
    switch (profile) {
      case 'admin': return 'Administrador';
      case 'technician': return 'Técnico';
      case 'attendant': return 'Atendente';
      default: return profile;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Dashboard': return <BarChart3 className="h-4 w-4" />;
      case 'Ordens de Serviço': return <Package className="h-4 w-4" />;
      case 'Clientes': return <Users className="h-4 w-4" />;
      case 'Produtos': return <Package className="h-4 w-4" />;
      case 'Configurações': return <Settings className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Dashboard': return 'bg-blue-500';
      case 'Ordens de Serviço': return 'bg-green-500';
      case 'Clientes': return 'bg-purple-500';
      case 'Produtos': return 'bg-orange-500';
      case 'Configurações': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Agrupar regras por categoria
  const groupedRules = PERMISSION_RULES.reduce((acc, rule) => {
    if (!acc[rule.category]) {
      acc[rule.category] = [];
    }
    acc[rule.category].push(rule);
    return acc;
  }, {} as Record<string, PermissionRule[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Carregando permissões...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Matriz de Permissões por Perfil</h3>
          <p className="text-sm text-muted-foreground">
            Configure as permissões para cada perfil de usuário no módulo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      {/* Legenda dos Perfis */}
      <Card>
        <CardHeader>
          <CardTitle>Perfis de Usuário</CardTitle>
          <CardDescription>
            Entenda os diferentes perfis e suas responsabilidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <div>
                <div className="font-medium">Administrador</div>
                <div className="text-xs text-muted-foreground">Acesso total ao sistema</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <div>
                <div className="font-medium">Técnico</div>
                <div className="text-xs text-muted-foreground">Executa ordens de serviço</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div>
                <div className="font-medium">Atendente</div>
                <div className="text-xs text-muted-foreground">Atendimento ao cliente</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matriz de Permissões */}
      <div className="space-y-4">
        {Object.entries(groupedRules).map(([category, rules]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className={`p-1 rounded ${getCategoryColor(category)} text-white`}>
                  {getCategoryIcon(category)}
                </div>
                {category}
                <Badge variant="outline" className="ml-auto">
                  {rules.length} regras
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4 font-medium w-1/2">Regra</th>
                    <th className="text-center py-2 px-4 font-medium w-1/6">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${getProfileBadgeColor('admin')}`}>
                        Administrador
                      </div>
                    </th>
                    <th className="text-center py-2 px-4 font-medium w-1/6">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${getProfileBadgeColor('technician')}`}>
                        Técnico
                      </div>
                    </th>
                    <th className="text-center py-2 px-4 font-medium w-1/6">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${getProfileBadgeColor('attendant')}`}>
                        Atendente
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => (
                    <tr key={rule.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 w-1/2">
                        <div className="flex items-center gap-2">
                          {rule.icon}
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="font-medium text-sm truncate">{rule.name}</span>
                            <Tooltip content={rule.description}>
                              <Info className="h-3 w-3 text-muted-foreground hover:text-primary transition-colors flex-shrink-0" />
                            </Tooltip>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center w-1/6">
                        <Checkbox
                          id={`${rule.id}-admin`}
                          checked={permissions[rule.id]?.admin || false}
                          onCheckedChange={(checked) => handlePermissionChange(rule.id, 'admin', checked)}
                        />
                      </td>
                      <td className="py-3 px-4 text-center w-1/6">
                        <Checkbox
                          id={`${rule.id}-technician`}
                          checked={permissions[rule.id]?.technician || false}
                          onCheckedChange={(checked) => handlePermissionChange(rule.id, 'technician', checked)}
                        />
                      </td>
                      <td className="py-3 px-4 text-center w-1/6">
                        <Checkbox
                          id={`${rule.id}-attendant`}
                          checked={permissions[rule.id]?.attendant || false}
                          onCheckedChange={(checked) => handlePermissionChange(rule.id, 'attendant', checked)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resumo */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo das Permissões</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['admin', 'technician', 'attendant'] as Profile[]).map(profile => {
              const allowedCount = Object.values(permissions).filter(p => p[profile]).length;
              const totalCount = PERMISSION_RULES.length;
              const percentage = totalCount > 0 ? Math.round((allowedCount / totalCount) * 100) : 0;

              return (
                <div key={profile} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{getProfileLabel(profile)}</span>
                    <Badge variant="outline">{percentage}%</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {allowedCount} de {totalCount} permissões
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full ${getProfileBadgeColor(profile)}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
