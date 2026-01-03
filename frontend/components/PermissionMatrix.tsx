import React, { useState, useEffect } from 'react';
import { Save, X, Shield, Users, Package, Settings, BarChart3, Zap } from 'lucide-react';
import { AvailablePermission, UserPermission, PermissionUpdate } from '../types/permission.types';
import { PermissionService } from '../services/permissionService';
import { TemplateService } from '../services/templateService';

interface PermissionMatrixProps {
  userId: string;
  userName: string;
  onClose: () => void;
  onSave: () => void;
}

// Componentes UI simples para substituir os imports
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>{children}</div>
);

const CardHeader = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pb-4 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
);

const CardDescription = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-sm text-gray-600 mt-1 ${className}`}>{children}</p>
);

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

const Button = ({ children, onClick, disabled = false, variant = "default", className = "" }: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "default" | "outline";
  className?: string;
}) => {
  const baseClasses = "px-4 py-2 rounded-md font-medium text-sm transition-colors";
  const variantClasses = variant === "outline" 
    ? "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50" 
    : "bg-blue-600 text-white hover:bg-blue-700";
  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseClasses} ${variantClasses} ${disabledClasses} ${className}`}
    >
      {children}
    </button>
  );
};

const Badge = ({ children, variant = "default", className = "" }: {
  children: React.ReactNode;
  variant?: "default" | "outline" | "secondary";
  className?: string;
}) => {
  const baseClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
  const variantClasses = {
    default: "bg-blue-100 text-blue-800",
    outline: "border border-gray-300 text-gray-700",
    secondary: "bg-gray-100 text-gray-800"
  };
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

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
    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
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
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    {children}
  </select>
);

const SelectTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const SelectValue = ({ placeholder }: { placeholder: string }) => <option value="">{placeholder}</option>;
const SelectContent = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const SelectItem = ({ value, children }: { value: string; children: React.ReactNode }) => (
  <option value={value}>{children}</option>
);

// Hook toast simples
const useToast = () => ({
  toast: ({ title, description, variant }: { title: string; description?: string; variant?: string }) => {
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
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [permissions, userPerms, templateList] = await Promise.all([
        PermissionService.getAvailablePermissions(),
        PermissionService.getUserPermissions(userId),
        TemplateService.getAllTemplates()
      ]);

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
      case 'dashboard': return 'bg-blue-500';
      case 'orders': return 'bg-green-500';
      case 'clients': return 'bg-purple-500';
      case 'products': return 'bg-orange-500';
      case 'config': return 'bg-red-500';
      default: return 'bg-gray-500';
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
          <p className="text-sm text-gray-600">Configure as permissões específicas para este usuário</p>
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
              <SelectTrigger>
                <SelectValue placeholder="Selecione um template..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name} - {template.description}
                  </SelectItem>
                ))}
              </SelectContent>
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
                  <div key={action.action} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
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
                      <p className="text-xs text-gray-500 mt-1">
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