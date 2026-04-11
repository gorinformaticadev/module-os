import React, { useState, useEffect } from 'react';
import { Save, X, Shield, Users, Package, Settings, BarChart3, Zap } from 'lucide-react';
import { AvailablePermission, UserPermission, PermissionUpdate } from '../types/permission.types';
import { PermissionService } from '../services/permissionService';
import { TemplateService, type PermissionTemplate } from '../services/templateService';

interface PermissionMatrixProps {
  userId: string;
  userName: string;
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

const Checkbox = ({ id, checked, onCheckedChange }: {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) => (
  <input
    type="checkbox"
    id={id}
    checked={checked}
    onChange={(e) => onCheckedChange(e.target.checked)}
    className="peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
  />
);

const Select = ({ value, onValueChange, children }: {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}) => (
  <select
    value={value}
    onChange={(e) => onValueChange(e.target.value)}
    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {children}
  </select>
);

const SelectItem = ({ value, children }: { value: string; children: React.ReactNode }) => (
  <option value={value}>{children}</option>
);

// Hook toast simples
const useToast = () => ({
  toast: ({ title, description }: { title: string; description?: string; variant?: string }) => {
    console.log(`Toast: ${title}${description ? ` - ${description}` : ''}`);
    // Em produção, isso seria substituído por uma biblioteca de toast real
  }
});

export const PermissionMatrix: React.FC<PermissionMatrixProps> = ({
  userId,
  userName,
  onClose,
  onSave
}) => {
  const { toast } = useToast();
  const [availablePermissions, setAvailablePermissions] = useState<AvailablePermission[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [templates, setTemplates] = useState<PermissionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [permissions, userPerms] = await Promise.all([
        PermissionService.getAvailablePermissions(),
        PermissionService.getUserPermissions(userId),
      ]);

      let templateList: PermissionTemplate[] = [];

      try {
        templateList = await TemplateService.getAllTemplates();
      } catch (templateError) {
        console.warn('Templates não puderam ser carregados:', templateError);
        toast({
          title: 'Aviso',
          description: 'Os templates não puderam ser carregados, mas a matriz de permissões continua disponível.',
          variant: 'warning'
        });
      }

      setAvailablePermissions(permissions);
      setUserPermissions(userPerms);
      setTemplates(templateList);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados de permissões.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const isPermissionAllowed = (resource: string, action: string): boolean => {
    const permission = userPermissions.find(p => p.resource === resource && p.action === action);
    return permission?.allowed || false;
  };

  const handlePermissionChange = (resource: string, action: string, allowed: boolean) => {
    setUserPermissions(prev => {
      const existing = prev.find(p => p.resource === resource && p.action === action);
      
      if (existing) {
        return prev.map(p => 
          p.resource === resource && p.action === action 
            ? { ...p, allowed }
            : p
        );
      } else {
        return [...prev, {
          id: `temp-${Date.now()}`,
          userId,
          tenantId: '',
          resource,
          action,
          allowed,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: userId
        }];
      }
    });
  };

  const handleApplyTemplate = async (templateId: string) => {
    if (!templateId) return;

    try {
      setSaving(true);
      await TemplateService.applyTemplateToUser(templateId, userId);
      
      // Recarregar permissões do usuário
      const updatedPermissions = await PermissionService.getUserPermissions(userId);
      setUserPermissions(updatedPermissions);
      
      toast({
        title: 'Sucesso',
        description: 'Template aplicado com sucesso!',
      });
      
      setSelectedTemplate('');
    } catch (error) {
      console.error('Erro ao aplicar template:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível aplicar o template.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const permissionUpdates: PermissionUpdate[] = [];
      
      // Coletar todas as permissões disponíveis
      availablePermissions.forEach(group => {
        group.actions.forEach(action => {
          const allowed = isPermissionAllowed(group.resource, action.action);
          permissionUpdates.push({
            resource: group.resource,
            action: action.action,
            allowed
          });
        });
      });

      await PermissionService.updateUserPermissions(userId, permissionUpdates);
      
      toast({
        title: 'Sucesso',
        description: 'Permissões atualizadas com sucesso!',
      });
      
      onSave();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar permissões:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as permissões.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const getResourceIcon = (resource: string) => {
    switch (resource) {
      case 'dashboard': return <BarChart3 className="h-4 w-4" />;
      case 'orders': return <Package className="h-4 w-4" />;
      case 'clients': return <Users className="h-4 w-4" />;
      case 'products': return <Package className="h-4 w-4" />;
      case 'config': return <Settings className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getResourceColor = (resource: string) => {
    switch (resource) {
      case 'dashboard': return 'bg-primary';
      case 'orders': return 'bg-primary';
      case 'clients': return 'bg-primary';
      case 'products': return 'bg-primary';
      case 'config': return 'bg-primary';
      default: return 'bg-primary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Carregando permissões...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Permissões de {userName}</h3>
          <p className="text-sm text-muted-foreground">Configure as permissões específicas para este usuário</p>
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

      {/* Templates Rápidos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Templates Rápidos
          </CardTitle>
          <CardDescription>
            Aplique um conjunto pré-definido de permissões
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <option value="">Selecione um template...</option>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name} - {template.description}
                </SelectItem>
              ))}
            </Select>
            <Button 
              onClick={() => handleApplyTemplate(selectedTemplate)}
              disabled={!selectedTemplate || saving}
              variant="outline"
            >
              Aplicar Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Matriz de Permissões */}
      <div className="space-y-4">
        {availablePermissions.map((group) => (
          <Card key={group.resource}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className={`p-1 rounded ${getResourceColor(group.resource)} text-white`}>
                  {getResourceIcon(group.resource)}
                </div>
                {group.resourceLabel}
                <Badge variant="outline" className="ml-auto">
                  {group.actions.filter(action => isPermissionAllowed(group.resource, action.action)).length} / {group.actions.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.actions.map((action) => (
                  <div key={action.action} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                    <Checkbox
                      id={`${group.resource}-${action.action}`}
                      checked={isPermissionAllowed(group.resource, action.action)}
                      onCheckedChange={(checked) => 
                        handlePermissionChange(group.resource, action.action, checked as boolean)
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <label 
                        htmlFor={`${group.resource}-${action.action}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {action.actionLabel}
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {action.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
