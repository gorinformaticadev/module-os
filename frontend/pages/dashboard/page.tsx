"use client";

import React, { useEffect, useState } from 'react';
import {
  Users,
  Package,
  FileText,
  Eye,
  Printer,
  MessageCircle,
  Edit,
  Trash2,
} from 'lucide-react';
import { AlertaRetiradaBadge } from '../../components/AlertaRetiradaBadge';
import { ModulePageGuard } from '../../components/ModulePageGuard';
import { MODULE_ROUTE_ROOT } from '../../module-manifest';
import { ordem_servicoService } from '../../services/ordem_servico.service';
import { OrdemServico as ApiOrdemServico, StatusOS } from '../../types/ordem-servico.types';

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

type DashboardOrderStatus = 'aberto' | 'orcamento' | 'aguardando' | 'execucao' | 'finalizada' | 'aprovada';

interface DashboardOrder {
  id: string;
  numero: string;
  cliente: string;
  dataPrevisaoFinal: string;
  status: DashboardOrderStatus;
}

function formatDashboardDate(dateString?: string | null): string {
  if (!dateString) {
    return '-';
  }

  return new Date(dateString).toLocaleDateString('pt-BR');
}

function mapDashboardStatus(ordem: ApiOrdemServico): DashboardOrderStatus | null {
  if (ordem.status === StatusOS.ORCAMENTO && ordem.orcamento_aprovado) {
    return 'aprovada';
  }

  switch (ordem.status) {
    case StatusOS.ABERTA:
      return 'aberto';
    case StatusOS.ORCAMENTO:
      return 'orcamento';
    case StatusOS.AGUARDANDO_CLIENTE:
    case StatusOS.AGUARDANDO_PECAS:
      return 'aguardando';
    case StatusOS.EM_ANALISE:
    case StatusOS.EM_EXECUCAO:
      return 'execucao';
    case StatusOS.FINALIZADA:
      return 'finalizada';
    default:
      return null;
  }
}

function mapDashboardOrder(ordem: ApiOrdemServico): DashboardOrder | null {
  const status = mapDashboardStatus(ordem);
  if (!status) {
    return null;
  }

  return {
    id: ordem.id,
    numero: ordem.numero,
    cliente: ordem.cliente?.name || 'Cliente nao informado',
    dataPrevisaoFinal: formatDashboardDate(ordem.data_previsao || ordem.data_conclusao || ordem.updated_at),
    status,
  };
}

const ShortcutCard = ({
  title,
  shortcut,
  icon: Icon,
  color,
  onClick
}: {
  title: string;
  shortcut: string;
  icon: React.ElementType;
  accentClassName: string;
  onClick: () => void;
}) => {
  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg ${accentClassName}`}
      onClick={onClick}
    >
      <CardContent className="flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <Icon className="h-8 w-8 text-skin-text-inverse" />
          <div>
            <h3 className="text-lg font-semibold text-skin-text-inverse">{title}</h3>
            <p className="text-sm text-skin-text-inverse/80">{shortcut}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const OrderTable = ({
  title,
  orders,
  emptyMessage,
  loading
}: {
  title: string;
  orders: DashboardOrder[];
  emptyMessage: string;
  loading: boolean;
}) => {
  const getStatusBadge = (status: DashboardOrder['status']) => {
    const statusConfig = {
      aberto: { label: 'Aberto', variant: 'default' as const, color: 'bg-skin-success' },
      orcamento: { label: 'Orcamento', variant: 'secondary' as const, color: 'bg-skin-warning' },
      aguardando: { label: 'Aguardando', variant: 'outline' as const, color: 'bg-skin-primary' },
      execucao: { label: 'Em Execucao', variant: 'default' as const, color: 'bg-skin-info' },
      finalizada: { label: 'Finalizada', variant: 'secondary' as const, color: 'bg-skin-text-muted' },
      aprovada: { label: 'Aprovada', variant: 'default' as const, color: 'bg-skin-success' }
    };

    const config = statusConfig[status];
    return (
      <Badge variant="outline" className={`${config.color} text-skin-text-inverse`}>
        {config.label}
      </Badge>
    );
  };

  const handleAction = (action: string, ordem: DashboardOrder) => {
    console.log(`Acao ${action} para ordem ${ordem.numero}`);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-skin-text">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 text-center text-skin-text-muted">
            Carregando dados do dashboard...
          </div>
        ) : orders.length === 0 ? (
          <div className="py-8 text-center text-skin-text-muted">
            {emptyMessage}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-skin-border">
                  <th className="px-2 py-3 text-left font-medium text-skin-text-muted">No</th>
                  <th className="px-2 py-3 text-left font-medium text-skin-text-muted">Cliente</th>
                  <th className="px-2 py-3 text-left font-medium text-skin-text-muted">Data Prev. Final</th>
                  <th className="px-2 py-3 text-left font-medium text-skin-text-muted">Status</th>
                  <th className="px-2 py-3 text-left font-medium text-skin-text-muted">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((ordem) => (
                  <tr key={ordem.id} className="border-b border-skin-border/60 hover:bg-skin-surface-hover">
                    <td className="px-2 py-3 text-sm font-medium text-skin-info">
                      {ordem.numero}
                    </td>
                    <td className="px-2 py-3 text-sm text-skin-text">
                      {ordem.cliente}
                    </td>
                    <td className="px-2 py-3 text-sm text-skin-text-muted">
                      {ordem.dataPrevisaoFinal}
                    </td>
                    <td className="px-2 py-3">
                      {getStatusBadge(ordem.status)}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-skin-info/15"
                          onClick={() => handleAction('visualizar', ordem)}
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4 text-skin-info" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-skin-surface-hover"
                          onClick={() => handleAction('imprimir', ordem)}
                          title="Imprimir"
                        >
                          <Printer className="h-4 w-4 text-skin-text-muted" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-skin-success/15"
                          onClick={() => handleAction('whatsapp', ordem)}
                          title="WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4 text-skin-success" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-skin-warning/15"
                          onClick={() => handleAction('editar', ordem)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4 text-skin-warning" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-skin-danger/15"
                          onClick={() => handleAction('excluir', ordem)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4 text-skin-danger" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function OrdemServicoDashboardPage() {
  const [ordens, setOrdens] = useState<DashboardOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setLoadError(null);

        const response = await ordem_servicoService.listOrdens();
        const rawOrdens = Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data)
            ? response.data
            : [];
        const mappedOrdens = rawOrdens
          .map((ordem: ApiOrdemServico) => mapDashboardOrder(ordem))
          .filter((ordem: DashboardOrder | null): ordem is DashboardOrder => ordem !== null);

        if (mounted) {
          setOrdens(mappedOrdens);
        }
      } catch (error) {
        console.error('Erro ao carregar dashboard de ordens:', error);

        if (mounted) {
          setOrdens([]);
          setLoadError('Nao foi possivel carregar os dados do dashboard.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const handleShortcut = (action: string) => {
    switch (action) {
      case 'clientes':
        window.location.href = `${MODULE_ROUTE_ROOT}/clientes`;
        break;
      case 'produtos':
        window.location.href = `${MODULE_ROUTE_ROOT}/produtos`;
        break;
      case 'ordens':
        window.location.href = `${MODULE_ROUTE_ROOT}/ordens`;
        break;
      case 'novo-cliente':
        window.location.href = `${MODULE_ROUTE_ROOT}/clientes?action=new`;
        break;
      case 'novo-produto':
        window.location.href = `${MODULE_ROUTE_ROOT}/produtos?action=new`;
        break;
      case 'nova-os':
        window.location.href = `${MODULE_ROUTE_ROOT}/ordens/new`;
        break;
    }
  };

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case 'F1':
          event.preventDefault();
          if (event.shiftKey) {
            handleShortcut('novo-cliente');
          } else {
            handleShortcut('clientes');
          }
          break;
        case 'F2':
          event.preventDefault();
          if (event.shiftKey) {
            handleShortcut('novo-produto');
          } else {
            handleShortcut('produtos');
          }
          break;
        case 'F3':
          event.preventDefault();
          if (event.shiftKey) {
            handleShortcut('nova-os');
          } else {
            handleShortcut('ordens');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const ordensAberto = ordens.filter(o => o.status === 'aberto');
  const ordensOrcamento = ordens.filter(o => o.status === 'orcamento');
  const ordensAguardando = ordens.filter(o => o.status === 'aguardando');
  const ordensExecucao = ordens.filter(o => o.status === 'execucao');
  const ordensFinalizadas = ordens.filter(o => o.status === 'finalizada');
  const ordensAprovadas = ordens.filter(o => o.status === 'aprovada');

  return (
    <ModulePageGuard resource="dashboard" action="view">
      <div className="p-6 max-w-full mx-auto space-y-6 bg-skin-background min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-skin-text">
          Dashboard - Ordem de Servicos
        </h1>
        <p className="text-skin-text-muted dark:text-gray-400 mt-2">
          Visao geral das ordens de servico e atalhos rapidos
        </p>
        {loadError ? (
          <p className="mt-3 text-sm text-skin-danger dark:text-red-400">{loadError}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <ShortcutCard
          title="Clientes"
          shortcut="F1"
          icon={Users}
          accentClassName="bg-gradient-to-r from-skin-info to-skin-primary"
          onClick={() => handleShortcut('clientes')}
        />
        <ShortcutCard
          title="Produtos/Servicos"
          shortcut="F2"
          icon={Package}
          accentClassName="bg-gradient-to-r from-skin-warning to-skin-primary"
          onClick={() => handleShortcut('produtos')}
        />
        <ShortcutCard
          title="Ordens"
          shortcut="F3"
          icon={FileText}
          accentClassName="bg-gradient-to-r from-skin-primary to-skin-info"
          onClick={() => handleShortcut('ordens')}
        />
      </div>

      <div className="mb-8">
        <AlertaRetiradaBadge variant="card" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OrderTable
          title="Ordens de Servicos Em Orcamento"
          orders={ordensOrcamento}
          emptyMessage="Nenhuma ordem em orcamento encontrada"
          loading={loading}
        />

        <OrderTable
          title="Ordens de Servicos Em Aberto"
          orders={ordensAberto}
          emptyMessage="Nenhuma ordem em aberto encontrada"
          loading={loading}
        />

        <OrderTable
          title="Ordens de Servicos Aprovadas"
          orders={ordensAprovadas}
          emptyMessage="Nenhuma ordem aprovada encontrada"
          loading={loading}
        />

        <OrderTable
          title="Ordens de Servicos Finalizadas"
          orders={ordensFinalizadas}
          emptyMessage="Nenhuma ordem finalizada encontrada"
          loading={loading}
        />

        <OrderTable
          title="Ordens de Servicos Em Andamento e Aguardando Pecas"
          orders={ordensAguardando}
          emptyMessage="Nenhuma ordem aguardando pecas encontrada"
          loading={loading}
        />

        <OrderTable
          title="Status de Vendas"
          orders={ordensExecucao}
          emptyMessage="Nenhuma venda em execucao encontrada"
          loading={loading}
        />
      </div>

      <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Atalhos de Teclado:
        </h3>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs text-skin-text-muted dark:text-gray-400">
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded shadow-sm border border-gray-300 dark:border-gray-600 font-sans font-bold">F1</kbd> 
            <span>Clientes</span>
            <span className="text-gray-400 mx-1">|</span>
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded shadow-sm border border-gray-300 dark:border-gray-600 font-sans font-bold">Shift+F1</kbd>
            <span className="font-medium text-skin-info dark:text-blue-400">Novo Cliente</span>
          </div>
          
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded shadow-sm border border-gray-300 dark:border-gray-600 font-sans font-bold">F2</kbd> 
            <span>Produtos</span>
            <span className="text-gray-400 mx-1">|</span>
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded shadow-sm border border-gray-300 dark:border-gray-600 font-sans font-bold">Shift+F2</kbd>
            <span className="font-medium text-orange-600 dark:text-orange-400">Novo Produto</span>
          </div>
          
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded shadow-sm border border-gray-300 dark:border-gray-600 font-sans font-bold">F3</kbd> 
            <span>Ordens</span>
            <span className="text-gray-400 mx-1">|</span>
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded shadow-sm border border-gray-300 dark:border-gray-600 font-sans font-bold">Shift+F3</kbd>
            <span className="font-medium text-pink-600 dark:text-pink-400">Nova OS</span>
          </div>
        </div>
      </div>
      </div>
    </ModulePageGuard>
  );
}
