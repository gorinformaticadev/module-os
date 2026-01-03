import React, { useState, useEffect } from 'react';
import { Settings, Search, Shield, Users, Eye } from 'lucide-react';
import { UserWithPermissions } from '../types/permission.types';
import { PermissionService } from '../services/permissionService';
import { PermissionMatrix } from './PermissionMatrix';

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

const Button = ({ children, onClick, disabled = false, variant = "default", size = "default", className = "" }: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "default" | "outline";
  size?: "default" | "sm";
  className?: string;
}) => {
  const baseClasses = "rounded-md font-medium transition-colors";
  const sizeClasses = size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2 text-sm";
  const variantClasses = variant === "outline" 
    ? "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50" 
    : "bg-blue-600 text-white hover:bg-blue-700";
  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${disabledClasses} ${className}`}
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

const Input = ({ placeholder, value, onChange, className = "" }: {
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}) => (
  <input
    type="text"
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
  />
);

const Table = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <table className={`w-full ${className}`}>{children}</table>
);

const TableHeader = ({ children }: { children: React.ReactNode }) => (
  <thead className="bg-gray-50">{children}</thead>
);

const TableBody = ({ children }: { children: React.ReactNode }) => (
  <tbody className="divide-y divide-gray-200">{children}</tbody>
);

const TableRow = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <tr className={`hover:bg-gray-50 ${className}`}>{children}</tr>
);

const TableHead = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}>
    {children}
  </th>
);

const TableCell = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <td className={`px-6 py-4 whitespace-nowrap text-sm ${className}`}>{children}</td>
);

const Avatar = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`inline-flex items-center justify-center rounded-full bg-gray-100 ${className}`}>
    {children}
  </div>
);

const AvatarFallback = ({ children }: { children: React.ReactNode }) => (
  <span className="text-sm font-medium text-gray-600">{children}</span>
);

const Dialog = ({ open, onOpenChange, children }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => onOpenChange(false)} />
      <div className="relative bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

const DialogContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 ${className}`}>{children}</div>
);

const DialogHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-4">{children}</div>
);

const DialogTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-xl font-semibold">{children}</h2>
);

// Hook toast simples
const useToast = () => ({
  toast: ({ title, description, variant }: { title: string; description?: string; variant?: string }) => {
    console.log(`Toast: ${title}${description ? ` - ${description}` : ''}`);
    // Em produção, isso seria substituído por uma biblioteca de toast real
  }
});

export const PermissionManagement: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithPermissions[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithPermissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithPermissions | null>(null);
  const [showPermissionMatrix, setShowPermissionMatrix] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    // Filtrar usuários baseado no termo de busca
    if (!Array.isArray(users)) {
      setFilteredUsers([]);
      return;
    }
    
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [users, searchTerm]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('🔍 Carregando usuários com permissões...');
      
      const usersData = await PermissionService.getUsersWithPermissions();
      console.log('📦 Dados recebidos do servidor:', usersData);
      console.log('📊 Tipo dos dados:', typeof usersData);
      console.log('📋 É array?', Array.isArray(usersData));
      
      // Verificar se a resposta é um array válido
      if (Array.isArray(usersData)) {
        console.log(`✅ ${usersData.length} usuários carregados`);
        setUsers(usersData);
      } else {
        console.error('❌ Resposta da API não é um array:', usersData);
        setUsers([]);
        toast({
          title: 'Erro',
          description: 'Formato de dados inválido recebido do servidor.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('❌ Erro ao carregar usuários:', error);
      setUsers([]); // Garantir que seja um array vazio em caso de erro
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os usuários.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditPermissions = (user: UserWithPermissions) => {
    setSelectedUser(user);
    setShowPermissionMatrix(true);
  };

  const handleCloseMatrix = () => {
    setShowPermissionMatrix(false);
    setSelectedUser(null);
  };

  const handleSavePermissions = () => {
    // Recarregar lista de usuários após salvar
    loadUsers();
    toast({
      title: 'Sucesso',
      description: 'Permissões atualizadas com sucesso!',
    });
  };

  const getPermissionStatusColor = (summary: UserWithPermissions['permissionSummary'], user?: any) => {
    // Se for admin, sempre verde (acesso total)
    if (user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
      return 'bg-green-500';
    }
    
    const percentage = summary.total > 0 ? (summary.allowed / summary.total) * 100 : 0;
    
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getPermissionStatusText = (summary: UserWithPermissions['permissionSummary'], user?: any) => {
    // Se for admin, sempre acesso total
    if (user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
      return 'Acesso Total (Admin)';
    }
    
    const percentage = summary.total > 0 ? (summary.allowed / summary.total) * 100 : 0;
    
    if (percentage >= 80) return 'Acesso Completo';
    if (percentage >= 50) return 'Acesso Moderado';
    if (percentage >= 20) return 'Acesso Limitado';
    return 'Acesso Restrito';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Carregando usuários...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gerenciamento de Permissões
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure permissões específicas para cada usuário do módulo
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Total de Usuários</span>
            </div>
            <p className="text-2xl font-bold mt-1">{Array.isArray(users) ? users.length : 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Com Permissões</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {Array.isArray(users) ? users.filter(u => u.permissionSummary.allowed > 0).length : 0}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Acesso Limitado</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {Array.isArray(users) ? users.filter(u => {
                const percentage = u.permissionSummary.total > 0 ? 
                  (u.permissionSummary.allowed / u.permissionSummary.total) * 100 : 0;
                return percentage > 0 && percentage < 50;
              }).length : 0}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Acesso Completo</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {Array.isArray(users) ? users.filter(u => {
                const percentage = u.permissionSummary.total > 0 ? 
                  (u.permissionSummary.allowed / u.permissionSummary.total) * 100 : 0;
                return percentage >= 80;
              }).length : 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários e Permissões</CardTitle>
          <CardDescription>
            Lista de todos os usuários com resumo de suas permissões no módulo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!Array.isArray(filteredUsers) || filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'Nenhum usuário encontrado com esse termo.' : 'Nenhum usuário encontrado.'}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Status de Acesso</TableHead>
                    <TableHead>Permissões</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{user.name}</span>
                              {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                                <Badge variant="default" className="text-xs bg-blue-500 hover:bg-blue-600">
                                  {user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">{user.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div 
                            className={`w-2 h-2 rounded-full ${getPermissionStatusColor(user.permissionSummary, user)}`}
                          />
                          <span className="text-sm">
                            {getPermissionStatusText(user.permissionSummary, user)}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {user.permissionSummary.allowed} / {user.permissionSummary.total}
                          </Badge>
                          {user.permissionSummary.allowed > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {Math.round((user.permissionSummary.allowed / user.permissionSummary.total) * 100)}%
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPermissions(user)}
                          className="flex items-center gap-2"
                        >
                          <Settings className="h-3 w-3" />
                          Configurar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Edição de Permissões */}
      <Dialog open={showPermissionMatrix} onOpenChange={setShowPermissionMatrix}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurar Permissões</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <PermissionMatrix
              userId={selectedUser.id}
              userName={selectedUser.name}
              onClose={handleCloseMatrix}
              onSave={handleSavePermissions}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};