"use client";

import React, { useState, useEffect } from 'react';
import { Save, ArrowRight, CalendarClock, Calendar, Users, Settings, Shield, Brain, Loader2 } from 'lucide-react';
import { PermissionManagement } from '../../components/PermissionManagement';
import { ProfilePermissionMatrix } from '../../components/ProfilePermissionMatrix';
import { TiposServicoManager } from '../../components/TiposServicoManager';
import { TiposEquipamentoManager } from '../../components/TiposEquipamentoManager';

// Cliente API customizado para o módulo raiz (sem autenticação automática)
const api = {
  get: async (url: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';

    // Função auxiliar para obter o token de forma segura (Cookie ou SessionStorage)
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

    const token = getToken();

    // Log para depuração
    if (!token) console.warn('⚠️ [ModulePage] Token não encontrado (Cookies/SessionSt)!');
    // else console.log('🔑 [ModulePage] Token encontrado.');

    const response = await fetch(`${baseUrl}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return { data: await response.json() };
  },
  post: async (url: string, data: any) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';

    // Duplicando lógica de token para manter consistência sem refatorar tudo para fora agora
    const getToken = () => {
      if (typeof window === 'undefined') return '';
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(c => c.trim().startsWith('accessToken='));
      if (tokenCookie) return tokenCookie.split('=')[1];
      const encrypted = sessionStorage.getItem("@App:token");
      if (encrypted) { try { return atob(encrypted); } catch { return ''; } }
      return '';
    };
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
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';

    // Duplicando lógica de token
    const getToken = () => {
      if (typeof window === 'undefined') return '';
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(c => c.trim().startsWith('accessToken='));
      if (tokenCookie) return tokenCookie.split('=')[1];
      const encrypted = sessionStorage.getItem("@App:token");
      if (encrypted) { try { return atob(encrypted); } catch { return ''; } }
      return '';
    };
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

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className || ''}`}
      {...props}
    />
  )
);
Label.displayName = "Label";

const Select = ({ value, onValueChange, children, placeholder }: {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  placeholder?: string;
}) => (
  <select
    value={value}
    onChange={(e) => onValueChange(e.target.value)}
    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {placeholder && <option value="">{placeholder}</option>}
    {children}
  </select>
);

const SelectItem = ({ value, children }: { value: string; children: React.ReactNode }) => (
  <option value={value}>{children}</option>
);

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

const Switch = ({ id, checked, onCheckedChange }: {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) => (
  <label htmlFor={id} className="relative inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      className="sr-only peer"
    />
    <div className="peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 peer-checked:bg-primary peer-unchecked:bg-input">
      <div className="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform peer-checked:translate-x-5 peer-unchecked:translate-x-0" />
    </div>
  </label>
);

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

// Hook toast simples
const useToast = () => ({
  toast: ({ title, description, variant }: { title: string; description?: string; variant?: string }) => {
    console.log(`Toast: ${title}${description ? ` - ${description}` : ''}`);
    // Em produção, isso seria substituído por uma biblioteca de toast real
  }
});

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

  const [aiConfig, setAiConfig] = useState({
    provider: 'openai',
    apiKey: '',
    model: 'gpt-4o-mini',
    temperature: 0.3,
    maxTokens: 800,
    enabled: false
  });
  const [testingAi, setTestingAi] = useState(false);
  const [testResponse, setTestResponse] = useState<string | null>(null);

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
    // Carregar dados iniciais
    setLoading(false);
  }, []);

  useEffect(() => {
    if (activeTab === 'agendamento') {
      fetchSchedules();
    } else if (activeTab === 'usuarios') {
      fetchUsers();
    } else if (activeTab === 'ia') {
      fetchAiConfig();
    }
  }, [activeTab]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/ordem_servico/config/notifications');
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

  const fetchAiConfig = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/ordem_servico/config/ai');
      if (response.data) {
        setAiConfig(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.error('Erro ao carregar config de IA:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveAiConfig = async () => {
    try {
      setSaving(true);
      await api.post('/api/ordem_servico/config/ai', aiConfig);
      toast({
        title: 'Sucesso',
        description: 'Configurações de IA salvas com sucesso!',
      });
      // Recarregar para pegar a chave mascarada
      fetchAiConfig();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao salvar configurações de IA.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestAi = async () => {
    try {
      setTestingAi(true);
      setTestResponse(null);

      const response = await api.post('/api/ordem_servico/config/ai/test', aiConfig);

      if (response.data.success) {
        setTestResponse(response.data.response);
        toast({
          title: 'Teste bem sucedido!',
          description: 'A IA respondeu corretamente.',
        });
      } else {
        setTestResponse(`Erro: ${response.data.message}`);
        toast({
          title: 'Falha no teste',
          description: response.data.message,
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Erro ao testar IA:', error);
      setTestResponse(`Erro na requisição: ${error.message}`);
      toast({
        title: 'Erro de conexão',
        description: 'Não foi possível contatar o serviço de teste.',
        variant: 'destructive'
      });
    } finally {
      setTestingAi(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('🔍 Iniciando fetchUsers...');

      const response = await api.get('/api/ordem_servico/config/users');
      console.log('📦 Resposta da API users:', response);

      if (Array.isArray(response.data)) {
        console.log(`✅ ${response.data.length} usuários recebidos:`, response.data);
        setUsers(response.data);
      } else {
        console.error('❌ Resposta não é um array:', response.data);
        setUsers([]);
        toast({
          title: 'Erro',
          description: 'Formato de dados inválido recebido do servidor.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('❌ Erro ao carregar usuários:', error);
      setUsers([]);
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
    try {
      await api.put(`/api/ordem_servico/config/users/${userId}/technician`, {
        is_technician: !currentStatus
      });

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
      await api.post('/api/ordem_servico/config/notifications', config);
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

      {/* Horizontal Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          <Button
            variant="ghost"
            className={`border-b-2 rounded-none px-1 py-3 ${activeTab === 'agendamento'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            onClick={() => setActiveTab('agendamento')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Agendamento
          </Button>
          <Button
            variant="ghost"
            className={`border-b-2 rounded-none px-1 py-3 ${activeTab === 'usuarios'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            onClick={() => setActiveTab('usuarios')}
          >
            <Users className="h-4 w-4 mr-2" />
            Usuários
          </Button>
          <Button
            variant="ghost"
            className={`border-b-2 rounded-none px-1 py-3 ${activeTab === 'permissoes'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            onClick={() => setActiveTab('permissoes')}
          >
            <Shield className="h-4 w-4 mr-2" />
            Permissões
          </Button>
          <Button
            variant="ghost"
            className={`border-b-2 rounded-none px-1 py-3 ${activeTab === 'opcoes-os'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            onClick={() => setActiveTab('opcoes-os')}
          >
            <Settings className="h-4 w-4 mr-2" />
            Opções OS
          </Button>
          <Button
            variant="ghost"
            className={`border-b-2 rounded-none px-1 py-3 ${activeTab === 'ia'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            onClick={() => setActiveTab('ia')}
          >
            <Brain className="h-4 w-4 mr-2" />
            Inteligência Artificial
          </Button>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        {activeTab === 'agendamento' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <CalendarClock className="h-5 w-5" />
                Rotinas de Agendamento
              </h2>
              <Button variant="outline" size="sm" className="gap-2">
                Ver Cron do Sistema
                <ArrowRight className="h-3 w-3" />
              </Button>
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
                      placeholder="Selecione..."
                    >
                      <SelectItem value="all">Geral (Todos)</SelectItem>
                      <SelectItem value="admin">Administradores</SelectItem>
                      <SelectItem value="super_admin">Super Admins</SelectItem>
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
                      placeholder="Selecione..."
                    >
                      <SelectItem value="daily">Diário (Todo dia)</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="interval">Intervalo (Minutos)</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
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
                        <div key={schedule.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{schedule.title}</h3>
                              <Badge variant={schedule.enabled ? 'default' : 'secondary'}>
                                {schedule.enabled ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{schedule.content}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                              <span className="flex items-center gap-1">
                                <CalendarClock className="h-3 w-3" />
                                {schedule.cron_expression}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                Destino: {schedule.audience === 'all' ? 'Todos' : schedule.audience}
                              </Badge>
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
                Configure os papéis dos usuários do sistema principal dentro deste módulo.
                ADMIN e SUPER_ADMIN são automaticamente administradores do módulo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Carregando usuários...</div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nenhum usuário encontrado</p>
                  <p className="text-sm">Verifique se há usuários cadastrados no sistema principal.</p>
                </div>
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
                              {user.os_roles?.admin && <Badge className="bg-purple-500 hover:bg-purple-600 text-white">Administrador</Badge>}
                              {user.os_roles?.attendant && <Badge variant="secondary">Atendente</Badge>}
                              {user.os_roles?.technician && <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Técnico</Badge>}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end items-center gap-2">
                              <Label htmlFor={`tech-${user.id}`} className="text-xs text-muted-foreground mr-2">
                                {user.os_roles?.technician ? 'Sim' : 'Não'}
                              </Label>
                              <Switch
                                id={`tech-${user.id}`}
                                checked={user.os_roles?.technician || false}
                                onCheckedChange={(checked) => handleToggleTechnician(user.id, user.os_roles?.technician || false, user.system_role)}
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
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Permissões por Perfil
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure as permissões para cada tipo de usuário: Administrador, Técnico e Atendente
                </p>
              </div>
            </div>

            <ProfilePermissionMatrix
              onClose={() => { }}
              onSave={() => {
                toast({
                  title: 'Sucesso',
                  description: 'Permissões de perfil atualizadas com sucesso!',
                });
              }}
            />
          </div>
        )}

        {activeTab === 'opcoes-os' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Opções OS
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Configurações específicas do módulo Ordem de Serviço
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Tipos de Serviço */}
              <TiposServicoManager />

              {/* Tipos de Equipamento */}
              <TiposEquipamentoManager />

              {/* Espaço para futuras configurações */}
              <div className="space-y-4">
                {/* Placeholder para próximas configurações */}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'ia' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Inteligência Artificial
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure a integração com modelos de linguagem (IA) para automação e análise
                </p>
              </div>
              <Button
                onClick={saveAiConfig}
                className="gap-2"
                disabled={saving}
              >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
                <Save className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações do Provedor</CardTitle>
                  <CardDescription>
                    Selecione o provedor e informe a chave de API
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                    <div className="space-y-1">
                      <Label htmlFor="ai-enabled" className="text-base">Ativar IA no Módulo</Label>
                      <p className="text-sm text-muted-foreground">
                        Permite o uso de recursos de IA em todo o módulo de OS
                      </p>
                    </div>
                    <Switch
                      id="ai-enabled"
                      checked={aiConfig.enabled}
                      onCheckedChange={(checked) => setAiConfig({ ...aiConfig, enabled: checked })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ai-provider">Provedor</Label>
                    <Select
                      value={aiConfig.provider}
                      onValueChange={(val) => setAiConfig({ ...aiConfig, provider: val })}
                    >
                      <SelectItem value="openai">OpenAI (Direct)</SelectItem>
                      <SelectItem value="openrouter">OpenRouter (Unified API)</SelectItem>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ai-api-key">API Key</Label>
                    <Input
                      id="ai-api-key"
                      type="password"
                      value={aiConfig.apiKey}
                      onChange={(e) => setAiConfig({ ...aiConfig, apiKey: e.target.value })}
                      placeholder={aiConfig.apiKey ? "********" : "Sua chave de API..."}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      {aiConfig.provider === 'openrouter'
                        ? 'Obtenha em openrouter.ai. Permite usar Claude, GPT-4, Llama, etc.'
                        : 'Obtenha em platform.openai.com'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Modelo e Parâmetros</CardTitle>
                  <CardDescription>
                    Ajuste o comportamento da inteligência artificial
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ai-model">Modelo (ID)</Label>
                    <Input
                      id="ai-model"
                      value={aiConfig.model}
                      onChange={(e) => setAiConfig({ ...aiConfig, model: e.target.value })}
                      placeholder="Ex: gpt-4o-mini"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ai-temp">Temperatura ({aiConfig.temperature})</Label>
                      <Input
                        id="ai-temp"
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={aiConfig.temperature}
                        onChange={(e) => setAiConfig({ ...aiConfig, temperature: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ai-tokens">Max Tokens</Label>
                      <Input
                        id="ai-tokens"
                        type="number"
                        value={aiConfig.maxTokens}
                        onChange={(e) => setAiConfig({ ...aiConfig, maxTokens: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <h4 className="text-sm font-medium text-blue-500 mb-1 flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Dica de Uso
                    </h4>
                    <p className="text-xs text-blue-500/70 leading-relaxed">
                      A temperatura baixa (0.1 a 0.3) torna a IA mais precisa e determinista, ideal para análise de dados.
                      Temperaturas altas (0.7 a 1.0) tornam o texto mais criativo.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {testResponse && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Brain className="h-4 w-4 text-primary" />
                      Resultado do Teste
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-background/50 p-3 rounded border text-xs font-mono whitespace-pre-wrap">
                      {testResponse}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex items-center justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handleTestAi}
                  disabled={testingAi || !aiConfig.apiKey}
                >
                  {testingAi ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testando...
                    </>
                  ) : 'Testar Conexão'}
                </Button>
                <Button onClick={saveAiConfig} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Configurações
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}