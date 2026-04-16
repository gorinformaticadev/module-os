import React, { useState, useEffect } from 'react';
import { Settings, Search, Shield, Users, Eye } from 'lucide-react';
import { UserWithPermissions } from '../types/permission.types';
import { PermissionService } from '../services/permissionService';
import { PermissionMatrix } from './PermissionMatrix';
import { ProfilePermissionMatrix } from './ProfilePermissionMatrix';

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

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={`w-full caption-bottom text-sm ${className || ''}`}
        {...props}
      />
    </div>
  )
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={`[&_tr]:border-b ${className || ''}`} {...props} />
  )
);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody
      ref={ref}
      className={`[&_tr:last-child]:border-0 ${className || ''}`}
      {...props}
    />
  )
);
TableBody.displayName = "TableBody";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${className || ''}`}
      {...props}
    />
  )
);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${className || ''}`}
      {...props}
    />
  )
);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className || ''}`}
      {...props}
    />
  )
);
TableCell.displayName = "TableCell";

const Avatar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className || ''}`}
      {...props}
    />
  )
);
Avatar.displayName = "Avatar";

const AvatarFallback = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`flex h-full w-full items-center justify-center rounded-full bg-muted ${className || ''}`}
      {...props}
    />
  )
);
AvatarFallback.displayName = "AvatarFallback";

const Dialog = ({ open, onOpenChange, children }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/80" 
        onClick={() => onOpenChange(false)} 
      />
      {children}
    </div>
  );
};

const DialogContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`relative z-50 grid gap-4 border border-border/50 bg-background/95 dark:bg-background/95 backdrop-blur-sm p-6 shadow-2xl rounded-xl ${className}`}>
    {children}
  </div>
);

const DialogHeader = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex flex-col space-y-1.5 text-center sm:text-left mb-4 ${className}`}>{children}</div>
);

const DialogTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-lg font-semibold leading-none tracking-tight">{children}</h2>
);

// Hook toast simples
const useToast = () => ({
  toast: ({ title, description, variant }: { title: string; description?: string; variant?: string }) => {
    // Toast is handled by UI
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
  const [showProfileMatrix, setShowProfileMatrix] = useState(false);

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
      
      const usersData = await PermissionService.getUsersWithPermissions();
      
      // Verificar se a resposta é um array válido
      if (Array.isArray(usersData)) {
        setUsers(usersData);
      } else {
        console.error('Resposta da API não é um array:', usersData);
        setUsers([]);
        toast({
          title: 'Erro',
          description: 'Formato de dados inválido recebido do servidor.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
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
    setShowProfileMatrix(false);
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

  const handleOpenProfileMatrix = () => {
    setShowProfileMatrix(true);
  };

  const getPermissionStatusColor = (summary: UserWithPermissions['permissionSummary'], user?: any) => {
    // Se for admin, sempre verde (acesso total)
    if (user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
      return 'bg-primary';
    }
    
    const percentage = summary.total > 0 ? (summary.allowed / summary.total) * 100 : 0;
    
    if (percentage >= 80) return 'bg-primary';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 20) return 'bg-orange-500';
    return 'bg-destructive';
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
          <p className="text-sm text-muted-foreground mt-1">
            Configure permissões por perfil ou específicas para cada usuário
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleOpenProfileMatrix}
            variant="default"
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Configurar Perfis
          </Button>
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
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Total de Usuários</span>
            </div>
            <p className="text-2xl font-bold mt-1">{Array.isArray(users) ? users.length : 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
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
              <Eye className="h-4 w-4 text-primary" />
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
              <Settings className="h-4 w-4 text-primary" />
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
            <div className="text-center py-8 text-muted-foreground">
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
                                <Badge variant="default" className="text-xs">
                                  {user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
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

      {/* Modal de Configuração de Perfis */}
      <Dialog open={showProfileMatrix} onOpenChange={setShowProfileMatrix}>
        <DialogContent className="w-[95vw] max-w-[95vw] h-[95vh] max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0 pb-4 border-b">
            <DialogTitle>Configurar Permissões por Perfil</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto mt-4">
            <ProfilePermissionMatrix
              onClose={handleCloseMatrix}
              onSave={handleSavePermissions}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};