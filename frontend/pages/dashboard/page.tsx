"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Users,
  Package,
  FileText,
  Eye,
  Printer,
  MessageCircle,
  Edit,
  Trash2,
  RotateCcw,
  Receipt,
  ChevronDown,
} from 'lucide-react';
import { AlertaRetiradaBadge } from '../../components/AlertaRetiradaBadge';
import { ModulePageGuard } from '../../components/ModulePageGuard';
import { MODULE_ROUTE_ROOT } from '../../module-manifest';
import { ordem_servicoService } from '../../services/ordem_servico.service';
import { OrdemServico as ApiOrdemServico, StatusOS } from '../../types/ordem-servico.types';
import { OrdemViewModal } from '../../components/OrdemViewModal';
import { PrintModal } from '../../components/PrintModal';
import { WhatsAppModal } from '../../components/WhatsAppModal';
import { useAuth } from '@/contexts/AuthContext';
import { useMultiplePermissions } from '../../hooks/usePermission';
import api from '@/lib/api';

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`rounded-xl border border-skin-border/50 bg-card/90 dark:bg-card/60 backdrop-blur-sm text-card-foreground shadow-sm hover:shadow-md transition-all duration-300 ${className || ''}`}
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
    outline: "border border-skin-input-border bg-skin-background hover:bg-skin-surface-hover hover:text-skin-text",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-skin-surface-hover hover:text-skin-text hover:shadow-none",
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

type DashboardOrderStatus = 'aberto' | 'orcamento' | 'aguardando' | 'execucao' | 'finalizada' | 'aprovada';

interface DashboardOrder {
  id: string;
  numero: string;
  cliente: string;
  dataPrevisaoFinal: string;
  status: DashboardOrderStatus;
  ordem: ApiOrdemServico;
}

const ORDERS_ACTION_PERMISSIONS = [
  { resource: 'orders', action: 'create' },
  { resource: 'orders', action: 'view_details' },
  { resource: 'orders', action: 'edit' },
  { resource: 'orders', action: 'delete' },
  { resource: 'orders', action: 'change_status' },
];

const DASHBOARD_ACTION_BUTTON_CLASS = 'h-9 w-9 p-0';
const DASHBOARD_ACTION_ICON_CLASS = 'h-5 w-5';

const useToast = () => ({
  toast: (_options: { title: string; description: string; variant?: string }) => {
    // Toast is handled by UI
  }
});

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
    ordem,
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
  color: string;
  onClick: () => void;
}) => {
  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg ${color}`}
      onClick={onClick}
    >
      <CardContent className="flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <Icon className="h-8 w-8 text-white" />
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-sm text-white/80">{shortcut}</p>
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
  loading,
  canViewOrderDetails,
  canEditOrder,
  canDeleteOrder,
  canChangeOrderStatus,
  isAdminUser,
  printMenuOpen,
  onPrintMenuEnter,
  onPrintMenuLeave,
  onTogglePrintMenu,
  onView,
  onEdit,
  onDelete,
  onPrintA4,
  onPrintThermal,
  onWhatsApp,
  onReopen,
}: {
  title: string;
  orders: DashboardOrder[];
  emptyMessage: string;
  loading: boolean;
  canViewOrderDetails: boolean;
  canEditOrder: boolean;
  canDeleteOrder: boolean;
  canChangeOrderStatus: boolean;
  isAdminUser: boolean;
  printMenuOpen: string | null;
  onPrintMenuEnter: (id: string) => void;
  onPrintMenuLeave: () => void;
  onTogglePrintMenu: (id: string) => void;
  onView: (ordem: ApiOrdemServico) => void;
  onEdit: (ordem: ApiOrdemServico) => void;
  onDelete: (ordem: ApiOrdemServico) => void;
  onPrintA4: (ordem: ApiOrdemServico) => void;
  onPrintThermal: (ordem: ApiOrdemServico) => void;
  onWhatsApp: (ordem: ApiOrdemServico) => void;
  onReopen: (ordem: ApiOrdemServico) => void;
}) => {
  return (
    <Card className="relative z-0 w-full overflow-visible transition-[z-index] hover:z-20">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-skin-text-muted dark:text-skin-text-muted">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-visible">
        {loading ? (
          <div className="text-center py-8 text-skin-text-muted">
            Carregando dados do dashboard...
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8 text-skin-text-muted">
            {emptyMessage}
          </div>
        ) : (
          <div className="relative overflow-visible">
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b border-skin-border dark:border-skin-border-strong">
                  <th className="w-[88px] py-3 px-2 text-left font-medium text-skin-text-muted dark:text-skin-text-muted">No</th>
                  <th className="py-3 px-2 text-left font-medium text-skin-text-muted dark:text-skin-text-muted">Cliente</th>
                  <th className="w-[122px] py-3 px-2 text-left font-medium text-skin-text-muted dark:text-skin-text-muted">Prev. Final</th>
                  <th className="w-[196px] py-3 px-2 text-right font-medium text-skin-text-muted dark:text-skin-text-muted">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((ordem) => (
                  <tr key={ordem.id} className="border-b border-skin-text-muted dark:border-skin-text-muted hover:bg-skin-surface dark:hover:bg-skin-text">
                    <td className="whitespace-nowrap py-3 px-2 text-sm font-medium text-skin-info dark:text-skin-info">
                      {ordem.numero}
                    </td>
                    <td className="max-w-0 py-3 px-2 text-sm text-skin-text-muted dark:text-skin-text-muted">
                      <span className="block truncate" title={ordem.cliente}>
                        {ordem.cliente}
                      </span>
                    </td>
                    <td className="whitespace-nowrap py-3 px-2 text-sm text-skin-text-muted dark:text-skin-text-muted">
                      {ordem.dataPrevisaoFinal}
                    </td>
                    <td className="py-3 px-2 align-middle">
                      <div className="flex items-center justify-end gap-1">
                        {canViewOrderDetails && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`${DASHBOARD_ACTION_BUTTON_CLASS} hover:bg-skin-info/10 dark:hover:bg-skin-info-hover`}
                            onClick={() => onView(ordem.ordem)}
                            title="Visualizar"
                          >
                            <Eye className={`${DASHBOARD_ACTION_ICON_CLASS} text-skin-info`} />
                          </Button>
                        )}

                        {canEditOrder &&
                          ordem.ordem.status !== StatusOS.FINALIZADA &&
                          ordem.ordem.status !== StatusOS.CANCELADA && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className={`${DASHBOARD_ACTION_BUTTON_CLASS} hover:bg-skin-warning/10 dark:hover:bg-skin-warning-hover`}
                              onClick={() => onEdit(ordem.ordem)}
                              title="Editar"
                            >
                              <Edit className={`${DASHBOARD_ACTION_ICON_CLASS} text-skin-warning`} />
                            </Button>
                          )}

                        {canViewOrderDetails && (
                          <div
                            className="relative z-[60]"
                            onMouseEnter={() => onPrintMenuEnter(ordem.id)}
                            onMouseLeave={onPrintMenuLeave}
                          >
                            <Button
                              size="sm"
                              variant="ghost"
                              className={`h-8 min-w-8 gap-0.5 rounded-md px-1.5 hover:bg-skin-surface dark:hover:bg-skin-text ${printMenuOpen === ordem.id ? 'bg-skin-surface dark:bg-skin-text' : ''}`}
                              onClick={() => onTogglePrintMenu(ordem.id)}
                              title="Imprimir"
                            >
                              <Printer className="h-[18px] w-[18px] text-skin-text-muted" />
                              <ChevronDown className={`h-3.5 w-3.5 text-skin-text-muted transition-transform ${printMenuOpen === ordem.id ? 'rotate-180' : ''}`} />
                            </Button>

                            {printMenuOpen === ordem.id && (
                              <div className="absolute bottom-full right-0 z-[80] min-w-[190px] pb-2">
                                <div className="absolute bottom-0 left-0 h-2 w-full pointer-events-auto" />
                                <div className="overflow-hidden rounded-md border border-skin-border bg-skin-background shadow-2xl">
                                  <button
                                    type="button"
                                    onClick={() => onPrintA4(ordem.ordem)}
                                    className="flex w-full items-center gap-2 border-b border-skin-border px-4 py-2.5 text-left text-sm text-skin-text transition-colors hover:bg-skin-surface-hover hover:text-skin-text"
                                  >
                                    <FileText className="h-4 w-4 text-skin-text-muted" />
                                    <span>Impressao A4</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onPrintThermal(ordem.ordem)}
                                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-skin-text transition-colors hover:bg-skin-surface-hover hover:text-skin-text"
                                  >
                                    <Receipt className="h-4 w-4 text-skin-text-muted" />
                                    <span>Impressao 50/80mm</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {canViewOrderDetails && ordem.ordem.cliente?.phone_primary && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`${DASHBOARD_ACTION_BUTTON_CLASS} hover:bg-skin-success/10 dark:hover:bg-skin-success-hover`}
                            onClick={() => onWhatsApp(ordem.ordem)}
                            title="WhatsApp"
                          >
                            <MessageCircle className={`${DASHBOARD_ACTION_ICON_CLASS} text-skin-success`} />
                          </Button>
                        )}

                        {canDeleteOrder &&
                          (ordem.ordem.status === StatusOS.ORCAMENTO || ordem.ordem.status === StatusOS.ABERTA) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className={`${DASHBOARD_ACTION_BUTTON_CLASS} hover:bg-skin-danger/10 dark:hover:bg-skin-danger-hover`}
                              onClick={() => onDelete(ordem.ordem)}
                              title="Excluir"
                            >
                              <Trash2 className={`${DASHBOARD_ACTION_ICON_CLASS} text-skin-danger`} />
                            </Button>
                          )}

                        {canChangeOrderStatus &&
                          isAdminUser &&
                          (ordem.ordem.status === StatusOS.FINALIZADA || ordem.ordem.status === StatusOS.CANCELADA) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className={`${DASHBOARD_ACTION_BUTTON_CLASS} hover:bg-skin-warning/10 dark:hover:bg-skin-warning-hover`}
                              onClick={() => onReopen(ordem.ordem)}
                              title="Reabrir OS"
                            >
                              <RotateCcw className={`${DASHBOARD_ACTION_ICON_CLASS} text-skin-warning`} />
                            </Button>
                          )}
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
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasPermission: hasOrdersPermission } = useMultiplePermissions(ORDERS_ACTION_PERMISSIONS);
  const [ordens, setOrdens] = useState<DashboardOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reopenOrder, setReopenOrder] = useState<ApiOrdemServico | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState<ApiOrdemServico | null>(null);
  const [printFormat, setPrintFormat] = useState<'a4' | 'thermal'>('a4');
  const [printOrdemId, setPrintOrdemId] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printMenuOpen, setPrintMenuOpen] = useState<string | null>(null);
  const printMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppOrder, setWhatsAppOrder] = useState<ApiOrdemServico | null>(null);

  const canViewOrderDetails = hasOrdersPermission('orders', 'view_details');
  const canEditOrder = hasOrdersPermission('orders', 'edit');
  const canDeleteOrder = hasOrdersPermission('orders', 'delete');
  const canChangeOrderStatus = hasOrdersPermission('orders', 'change_status');
  const isAdminUser = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const handlePrintMenuEnter = useCallback((id: string) => {
    if (printMenuTimeoutRef.current) {
      clearTimeout(printMenuTimeoutRef.current);
      printMenuTimeoutRef.current = null;
    }
    setPrintMenuOpen(id);
  }, []);

  const handlePrintMenuLeave = useCallback(() => {
    printMenuTimeoutRef.current = setTimeout(() => {
      setPrintMenuOpen(null);
      printMenuTimeoutRef.current = null;
    }, 500);
  }, []);

  const handleTogglePrintMenu = useCallback((id: string) => {
    setPrintMenuOpen((current) => (current === id ? null : id));
  }, []);

  const handleView = useCallback((ordem: ApiOrdemServico) => {
    setViewOrder(ordem);
    setIsViewModalOpen(true);
  }, []);

  const handleEdit = useCallback((ordem: ApiOrdemServico) => {
    window.location.href = `${MODULE_ROUTE_ROOT}/ordens/edit?id=${ordem.id}`;
  }, []);

  const handleDelete = useCallback(async (ordem: ApiOrdemServico) => {
    if (!confirm(`Tem certeza que deseja excluir a OS #${ordem.numero}?`)) return;

    try {
      await api.delete(`/api/ordem_servico/ordens/${ordem.id}`);
      toast({
        title: 'Sucesso',
        description: 'Ordem de servico excluida com sucesso',
      });

      setOrdens((current) => current.filter((item) => item.id !== ordem.id));
    } catch (error) {
      console.error('Erro ao excluir ordem:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir ordem de servico',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handlePrintA4 = useCallback((ordem: ApiOrdemServico) => {
    setPrintOrdemId(ordem.id);
    setPrintFormat('a4');
    setIsPrintModalOpen(true);
    setPrintMenuOpen(null);
  }, []);

  const handlePrintThermal = useCallback((ordem: ApiOrdemServico) => {
    setPrintOrdemId(ordem.id);
    setPrintFormat('thermal');
    setIsPrintModalOpen(true);
    setPrintMenuOpen(null);
  }, []);

  const handleWhatsApp = useCallback((ordem: ApiOrdemServico) => {
    if (ordem.cliente?.phone_primary) {
      setWhatsAppOrder(ordem);
      setIsWhatsAppModalOpen(true);
      return;
    }

    toast({
      title: 'Erro',
      description: 'Cliente nao possui telefone cadastrado',
      variant: 'destructive',
    });
  }, [toast]);

  const handleReopen = useCallback((ordem: ApiOrdemServico) => {
    setReopenOrder(ordem);
  }, []);

  const confirmReopen = useCallback(async () => {
    if (!reopenOrder) return;

    try {
      await api.put(`/api/ordem_servico/ordens/${reopenOrder.id}/status`, { status: StatusOS.EM_EXECUCAO });
      toast({
        title: 'Sucesso',
        description: 'Ordem reaberta com sucesso',
      });

      const response = await ordem_servicoService.listOrdens();
      const rawOrdens = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
          ? response.data
          : [];

      setOrdens(
        rawOrdens
          .map((ordem: ApiOrdemServico) => mapDashboardOrder(ordem))
          .filter((ordem: DashboardOrder | null): ordem is DashboardOrder => ordem !== null),
      );
      setReopenOrder(null);
    } catch (error) {
      console.error('Erro ao reabrir ordem:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao reabrir ordem de servico',
        variant: 'destructive',
      });
    }
  }, [reopenOrder, toast]);

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
          handleShortcut('clientes');
          break;
        case 'F2':
          event.preventDefault();
          handleShortcut('produtos');
          break;
        case 'F3':
          event.preventDefault();
          handleShortcut('ordens');
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
      <div className="p-6 max-w-full mx-auto space-y-6 bg-skin-surface dark:bg-skin-text-muted-hover min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-skin-text dark:text-skin-background">
          Dashboard - Ordem de Servicos
        </h1>
        <p className="text-skin-text-muted dark:text-skin-text-muted mt-2">
          Visao geral das ordens de servico e atalhos rapidos
        </p>
        {loadError ? (
          <p className="mt-3 text-sm text-skin-danger dark:text-skin-danger">{loadError}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <ShortcutCard
          title="Clientes"
          shortcut="F1"
          icon={Users}
          color="bg-gradient-to-r from-blue-500 to-blue-600"
          onClick={() => handleShortcut('clientes')}
        />
        <ShortcutCard
          title="Produtos/Servicos"
          shortcut="F2"
          icon={Package}
          color="bg-gradient-to-r from-orange-500 to-orange-600"
          onClick={() => handleShortcut('produtos')}
        />
        <ShortcutCard
          title="Ordens"
          shortcut="F3"
          icon={FileText}
          color="bg-gradient-to-r from-pink-500 to-pink-600"
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
          canViewOrderDetails={canViewOrderDetails}
          canEditOrder={canEditOrder}
          canDeleteOrder={canDeleteOrder}
          canChangeOrderStatus={canChangeOrderStatus}
          isAdminUser={isAdminUser}
          printMenuOpen={printMenuOpen}
          onPrintMenuEnter={handlePrintMenuEnter}
          onPrintMenuLeave={handlePrintMenuLeave}
          onTogglePrintMenu={handleTogglePrintMenu}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPrintA4={handlePrintA4}
          onPrintThermal={handlePrintThermal}
          onWhatsApp={handleWhatsApp}
          onReopen={handleReopen}
        />

        <OrderTable
          title="Ordens de Servicos Em Aberto"
          orders={ordensAberto}
          emptyMessage="Nenhuma ordem em aberto encontrada"
          loading={loading}
          canViewOrderDetails={canViewOrderDetails}
          canEditOrder={canEditOrder}
          canDeleteOrder={canDeleteOrder}
          canChangeOrderStatus={canChangeOrderStatus}
          isAdminUser={isAdminUser}
          printMenuOpen={printMenuOpen}
          onPrintMenuEnter={handlePrintMenuEnter}
          onPrintMenuLeave={handlePrintMenuLeave}
          onTogglePrintMenu={handleTogglePrintMenu}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPrintA4={handlePrintA4}
          onPrintThermal={handlePrintThermal}
          onWhatsApp={handleWhatsApp}
          onReopen={handleReopen}
        />

        <OrderTable
          title="Ordens de Servicos Aprovadas"
          orders={ordensAprovadas}
          emptyMessage="Nenhuma ordem aprovada encontrada"
          loading={loading}
          canViewOrderDetails={canViewOrderDetails}
          canEditOrder={canEditOrder}
          canDeleteOrder={canDeleteOrder}
          canChangeOrderStatus={canChangeOrderStatus}
          isAdminUser={isAdminUser}
          printMenuOpen={printMenuOpen}
          onPrintMenuEnter={handlePrintMenuEnter}
          onPrintMenuLeave={handlePrintMenuLeave}
          onTogglePrintMenu={handleTogglePrintMenu}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPrintA4={handlePrintA4}
          onPrintThermal={handlePrintThermal}
          onWhatsApp={handleWhatsApp}
          onReopen={handleReopen}
        />

        <OrderTable
          title="Ordens de Servicos Finalizadas"
          orders={ordensFinalizadas}
          emptyMessage="Nenhuma ordem finalizada encontrada"
          loading={loading}
          canViewOrderDetails={canViewOrderDetails}
          canEditOrder={canEditOrder}
          canDeleteOrder={canDeleteOrder}
          canChangeOrderStatus={canChangeOrderStatus}
          isAdminUser={isAdminUser}
          printMenuOpen={printMenuOpen}
          onPrintMenuEnter={handlePrintMenuEnter}
          onPrintMenuLeave={handlePrintMenuLeave}
          onTogglePrintMenu={handleTogglePrintMenu}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPrintA4={handlePrintA4}
          onPrintThermal={handlePrintThermal}
          onWhatsApp={handleWhatsApp}
          onReopen={handleReopen}
        />

        <OrderTable
          title="Ordens de Servicos Em Andamento e Aguardando Pecas"
          orders={ordensAguardando}
          emptyMessage="Nenhuma ordem aguardando pecas encontrada"
          loading={loading}
          canViewOrderDetails={canViewOrderDetails}
          canEditOrder={canEditOrder}
          canDeleteOrder={canDeleteOrder}
          canChangeOrderStatus={canChangeOrderStatus}
          isAdminUser={isAdminUser}
          printMenuOpen={printMenuOpen}
          onPrintMenuEnter={handlePrintMenuEnter}
          onPrintMenuLeave={handlePrintMenuLeave}
          onTogglePrintMenu={handleTogglePrintMenu}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPrintA4={handlePrintA4}
          onPrintThermal={handlePrintThermal}
          onWhatsApp={handleWhatsApp}
          onReopen={handleReopen}
        />

        <OrderTable
          title="Status de Vendas"
          orders={ordensExecucao}
          emptyMessage="Nenhuma venda em execucao encontrada"
          loading={loading}
          canViewOrderDetails={canViewOrderDetails}
          canEditOrder={canEditOrder}
          canDeleteOrder={canDeleteOrder}
          canChangeOrderStatus={canChangeOrderStatus}
          isAdminUser={isAdminUser}
          printMenuOpen={printMenuOpen}
          onPrintMenuEnter={handlePrintMenuEnter}
          onPrintMenuLeave={handlePrintMenuLeave}
          onTogglePrintMenu={handleTogglePrintMenu}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPrintA4={handlePrintA4}
          onPrintThermal={handlePrintThermal}
          onWhatsApp={handleWhatsApp}
          onReopen={handleReopen}
        />
      </div>

      <div className="mt-8 p-4 bg-white dark:bg-skin-text rounded-lg border border-skin-border dark:border-skin-border-strong">
        <h3 className="text-sm font-semibold text-skin-text-muted dark:text-skin-text-muted mb-2">
          Atalhos de Teclado:
        </h3>
        <div className="flex flex-wrap gap-4 text-xs text-skin-text-muted dark:text-skin-text-muted">
          <span><kbd className="px-2 py-1 bg-skin-surface dark:bg-skin-text-muted-hover rounded">F1</kbd> Clientes</span>
          <span><kbd className="px-2 py-1 bg-skin-surface dark:bg-skin-text-muted-hover rounded">F2</kbd> Produtos/Servicos</span>
          <span><kbd className="px-2 py-1 bg-skin-surface dark:bg-skin-text-muted-hover rounded">F3</kbd> Ordens</span>
        </div>
      </div>
      <OrdemViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        ordem={viewOrder}
        onPrintA4={handlePrintA4}
        onPrintThermal={handlePrintThermal}
      />
      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        ordemId={printOrdemId}
        format={printFormat}
      />
      <WhatsAppModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        ordem={whatsAppOrder}
      />
      <div>
        {reopenOrder ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-xl border border-skin-border bg-card p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-skin-text dark:text-skin-background">Reabrir Ordem de Servico</h3>
              <p className="mt-2 text-sm text-skin-text-muted dark:text-skin-text-muted">
                Tem certeza que deseja reabrir a OS <span className="font-semibold">#{reopenOrder.numero}</span>?
                Isso alterara o status para Em Execucao.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setReopenOrder(null)}>
                  Cancelar
                </Button>
                <Button className="bg-skin-warning text-white hover:bg-skin-warning-hover" onClick={() => void confirmReopen()}>
                  Confirmar Reabertura
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      </div>
    </ModulePageGuard>
  );
}
