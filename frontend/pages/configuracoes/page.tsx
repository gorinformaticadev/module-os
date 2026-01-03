"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, Save, ArrowRight, CalendarClock, Calendar, Users, Settings, Shield } from 'lucide-react';
import { PermissionManagement } from '../../components/PermissionManagement';

// API client simples
const api = {
  get: async (url: string) => {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return {
      data: await response.json(),
      status: response.status
    };
  },
  
  post: async (url: string, data: any) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return {
      data: await response.json(),
      status: response.status
    };
  },
  
  put: async (url: string, data: any) => {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return {
      data: await response.json(),
      status: response.status
    };
  }
};

// Hook toast simples
const useToast = () => ({
  toast: ({ title, description, variant }: { title: string; description?: string; variant?: string }) => {
    console.log(`Toast: ${title}${description ? ` - ${description}` : ''}`);
    // Em produção, isso seria substituído por uma biblioteca de toast real
  }
});

// Componentes UI simples
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>{children}</div>
);

const CardHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="p-6 pb-4">{children}</div>
);

const CardTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
);

const CardDescription = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-gray-600 mt-1">{children}</p>
);

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

const Button = ({ children, onClick, disabled = false, variant = "default", size = "default", className = "" }: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm";
  className?: string;
}) => {
  const baseClasses = "rounded-md font-medium transition-colors";
  const sizeClasses = size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2 text-sm";
  const variantClasses = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
    ghost: "text-gray-700 hover:bg-gray-100",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200"
  };
  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses} ${variantClasses[variant]} ${disabledClasses} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ placeholder, value, onChange, type = "text", className = "" }: {
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  className?: string;
}) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
  />
);

const Label = ({ children, htmlFor, className = "" }: { children: React.ReactNode; htmlFor?: string; className?: string }) => (
  <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 mb-1 ${className}`}>
    {children}
  </label>
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

const Badge = ({ children, variant = "default", className = "" }: {
  children: React.ReactNode;
  variant?: "default" | "secondary";
  className?: string;
}) => {
  const baseClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
  const variantClasses = variant === "secondary" 
    ? "bg-gray-100 text-gray-800" 
    : "bg-blue-100 text-blue-800";
  
  return (
    <span className={`${baseClasses} ${variantClasses} ${className}`}>
      {children}
    </span>
  );
};

const Switch = ({ id, checked, onCheckedChange }: {
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

const Table = ({ children }: { children: React.ReactNode }) => (
  <table className="w-full">{children}</table>
);

const TableHeader = ({ children }: { children: React.ReactNode }) => (
  <thead className="bg-gray-50">{children}</thead>
);

const TableBody = ({ children }: { children: React.ReactNode }) => (
  <tbody className="divide-y divide-gray-200">{children}</tbody>
);

const TableRow = ({ children }: { children: React.ReactNode }) => (
  <tr className="hover:bg-gray-50">{children}</tr>
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

export default function OrdemServicoConfiguracoesPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('agendamento');

  const [config, setConfig] = useState({
    title: '',
    content: '',
    audience: 'all',
    cronExpression: '0 9 * * *',
    enabled: true
  });

  const getFrequencyType = (cron: string) => {
    if (!cron) return 'daily';
    if (cron.startsWith('*/')) return 'interval';
    const parts = cron.split(' ');
    if (parts.length < 5) return 'custom';

    if (parts[2] === '*' && parts[3] === '*' && parts[4] === '*') return 'daily';
    if (parts[2] === '*' && parts[3] === '*' && parts[4] !== '*') return 'weekly';
    if (parts[2] !== '*' && parts[3] === '*' && parts[4] === '*') return 'monthly';

    return 'custom';
  };

  const getTimeFromCron = (cron: string) => {
    try {
      const parts = cron.split(' ');
      if (parts.length < 2) return '09:00';
      const minute = parts[0].padStart(2, '0');
      const hour = parts[1].padStart(2, '0');
      return `${hour}:${minute}`;
    } catch {
      return '09:00';
    }
  };

  const generateCron = (type: string, time: string, day: string = '1', interval: string = '15') => {
    const [hour, minute] = time.split(':');
    const safeHour = hour || '09';
    const safeMinute = minute || '00';

    switch (type) {
      case 'daily':
        return `${parseInt(safeMinute)} ${parseInt(safeHour)} * * *`;
      case 'weekly':
        return `${parseInt(safeMinute)} ${parseInt(safeHour)} * * ${day}`;
      case 'monthly':
        return `${parseInt(safeMinute)} ${parseInt(safeHour)} ${day} * *`;
      case 'interval':
        return `*/${interval} * * * *`;
      default:
        return '0 9 * * *';
    }
  };

  useEffect(() => {
    if (activeTab === 'agendamento') {
      fetchSchedules();
    } else if (activeTab === 'usuarios') {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await api.get('/modules/ordem_servico/config/notifications');
      setSchedules(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os agendamentos.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/modules/ordem_servico/config/users');
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os usuários.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTechnician = async (userId: string, currentStatus: boolean, systemRole: string) => {
    // Admins usually play dual roles, but if they want to explicitly unmark themselves as technicians for assignment lists, they can.
    // However, if logic dictates Admins are ALWAYS technicians, we should disable the switch or handle it.
    // Prompt says: "SUPER_ADMIN e ADMIN -> podem atuar também como Técnico".
    // "USER -> pode ser Técnico, se marcado/permitido".

    try {
      await api.put(`/modules/ordem_servico/config/users/${userId}/technician`, {
        is_technician: !currentStatus
      });

      // Optimistic update or refetch
      setUsers(users.map(u =>
        u.id === userId
          ? { ...u, os_roles: { ...u.os_roles, technician: !currentStatus } }
          : u
      ));

      toast({ title: 'Permissão atualizada' });
    } catch (error) {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' });
    }
  };

  const handleCreate = async () => {
    if (!config.title || !config.content) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o título e o conteúdo da notificação.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSaving(true);
      await api.post('/modules/ordem_servico/config/notifications', config);
      toast({
        title: 'Sucesso',
        description: 'Novo agendamento criado.',
      });
      setConfig({
        ...config,
        title: '',
        content: ''
      });
      fetchSchedules();
    } catch (error) {
      toast({
        title: 'Erro ao criar',
        description: 'Ocorreu um erro ao criar o agendamento.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8 text-primary" />
            Configurações
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie as preferências do módulo de Ordem de Serviço
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <Card className="w-full md:w-64 h-fit border-none shadow-none bg-transparent md:bg-card md:border md:shadow-sm">
          <CardContent className="p-0 md:p-4 space-y-1">
            <Button
              variant={activeTab === 'agendamento' ? 'secondary' : 'ghost'}
              className={`w-full justify-start gap-2 ${activeTab === 'agendamento' ? 'bg-secondary' : ''}`}
              onClick={() => setActiveTab('agendamento')}
            >
              <Calendar className="h-4 w-4" />
              Agendamento
            </Button>
            <Button
              variant={activeTab === 'usuarios' ? 'secondary' : 'ghost'}
              className={`w-full justify-start gap-2 ${activeTab === 'usuarios' ? 'bg-secondary' : ''}`}
              onClick={() => setActiveTab('usuarios')}
            >
              <Users className="h-4 w-4" />
              Usuários
            </Button>
            <Button
              variant={activeTab === 'permissoes' ? 'secondary' : 'ghost'}
              className={`w-full justify-start gap-2 ${activeTab === 'permissoes' ? 'bg-secondary' : ''}`}
              onClick={() => setActiveTab('permissoes')}
            >
              <Shield className="h-4 w-4" />
              Permissões
            </Button>
          </CardContent>
        </Card>

        {/* Main Content Area */}
        <div className="flex-1 space-y-6">
          {activeTab === 'agendamento' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <CalendarClock className="h-5 w-5" />
                  Rotinas de Agendamento
                </h2>
                <Link href="/configuracoes/sistema/cron">
                  <Button variant="outline" size="sm" className="gap-2">
                    Ver Cron do Sistema
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle>Novo Agendamento</CardTitle>
                    <CardDescription>
                      Crie uma nova regra de notificação automática.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Título</Label>
                      <Input
                        value={config.title}
                        onChange={(e) => setConfig({ ...config, title: e.target.value })}
                        placeholder="Ex: Lembrete Diário"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Conteúdo</Label>
                      <Input
                        value={config.content}
                        onChange={(e) => setConfig({ ...config, content: e.target.value })}
                        placeholder="Mensagem da notificação..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Público Alvo</Label>
                      <Select
                        value={config.audience}
                        onValueChange={(val) => setConfig({ ...config, audience: val })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Geral (Todos)</SelectItem>
                          <SelectItem value="admin">Administradores</SelectItem>
                          <SelectItem value="super_admin">Super Admins</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Frequência</Label>
                      <Select
                        value={getFrequencyType(config.cronExpression)}
                        onValueChange={(type) => {
                          const newCron = generateCron(type, '09:00', '1', '30');
                          setConfig({ ...config, cronExpression: newCron });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Diário (Todo dia)</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="monthly">Mensal</SelectItem>
                          <SelectItem value="interval">Intervalo (Minutos)</SelectItem>
                          <SelectItem value="custom">Personalizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {getFrequencyType(config.cronExpression) === 'daily' && (
                      <div className="space-y-2">
                        <Label>Horário</Label>
                        <Input
                          type="time"
                          value={getTimeFromCron(config.cronExpression)}
                          onChange={(e) => {
                            const time = e.target.value;
                            if (!time) return;
                            const [hour, minute] = time.split(':');
                            setConfig({ ...config, cronExpression: `${parseInt(minute)} ${parseInt(hour)} * * *` });
                          }}
                        />
                      </div>
                    )}

                    <Button onClick={handleCreate} disabled={saving} className="w-full mt-4">
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Criando...' : 'Criar Agendamento'}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Agendamentos Ativos</CardTitle>
                    <CardDescription>
                      Lista de notificações agendadas para envio automático.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-8 text-muted-foreground">Carregando agendamentos...</div>
                    ) : schedules.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                        Nenhum agendamento encontrado.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {schedules.map((schedule) => (
                          <div key={schedule.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg">{schedule.title}</h3>
                                <Badge variant={schedule.enabled ? 'default' : 'secondary'}>
                                  {schedule.enabled ? 'Ativo' : 'Inativo'}
                                </Badge>
                              </div>
                              <p className="text-sm text-balance text-muted-foreground">{schedule.content}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                                <span className="flex items-center gap-1">
                                  <CalendarClock className="h-3 w-3" />
                                  {schedule.cron_expression}
                                </span>
                                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                  Destino: {schedule.audience === 'all' ? 'Todos' : schedule.audience}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'usuarios' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Configurações de Usuários
                </CardTitle>
                <CardDescription>
                  Defina quem tem acesso e quais permissões dentro deste módulo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Carregando usuários...</div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Usuário</TableHead>
                          <TableHead>Papel do Sistema</TableHead>
                          <TableHead>Papéis no Módulo (OS)</TableHead>
                          <TableHead className="text-right">Técnico?</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="font-medium text-sm">{user.name}</span>
                                  <span className="text-xs text-muted-foreground">{user.email}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{user.system_role}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2 flex-wrap">
                                {user.os_roles.admin && <Badge className="bg-purple-500 hover:bg-purple-600">Administrador</Badge>}
                                {user.os_roles.attendant && <Badge variant="secondary">Atendente</Badge>}
                                {user.os_roles.technician && <Badge className="bg-blue-500 hover:bg-blue-600">Técnico</Badge>}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end items-center gap-2">
                                <Label htmlFor={`tech-${user.id}`} className="text-xs text-muted-foreground mr-2">
                                  {user.os_roles.technician ? 'Sim' : 'Não'}
                                </Label>
                                <Switch
                                  id={`tech-${user.id}`}
                                  checked={user.os_roles.technician}
                                  onCheckedChange={() => handleToggleTechnician(user.id, user.os_roles.technician, user.system_role)}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'permissoes' && (
            <PermissionManagement />
          )}
        </div>
      </div>
    </div>
  );
}
