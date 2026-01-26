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
  Clock,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  XCircle
} from 'lucide-react';

// Componente de Alerta de Retirada
import { AlertaRetiradaBadge } from '../../components/AlertaRetiradaBadge';

// Componentes UI customizados para o módulo raiz
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

// Tipos para as ordens de serviço
interface OrdemServico {
  id: string;
  numero: string;
  cliente: string;
  dataPrevisaoFinal: string;
  status: 'aberto' | 'orcamento' | 'aguardando' | 'execucao' | 'finalizada' | 'aprovada';
}

// Componente de atalho com teclado
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

// Componente de tabela de ordens
const OrderTable = ({
  title,
  orders,
  emptyMessage
}: {
  title: string;
  orders: OrdemServico[];
  emptyMessage: string;
}) => {
  const getStatusBadge = (status: OrdemServico['status']) => {
    const statusConfig = {
      aberto: { label: 'Aberto', variant: 'default' as const, color: 'bg-green-500' },
      orcamento: { label: 'Orçamento', variant: 'secondary' as const, color: 'bg-yellow-500' },
      aguardando: { label: 'Aguardando', variant: 'outline' as const, color: 'bg-blue-500' },
      execucao: { label: 'Em Execução', variant: 'default' as const, color: 'bg-purple-500' },
      finalizada: { label: 'Finalizada', variant: 'secondary' as const, color: 'bg-gray-500' },
      aprovada: { label: 'Aprovada', variant: 'default' as const, color: 'bg-green-600' }
    };

    const config = statusConfig[status];
    return (
      <Badge variant={config.variant} className={`${config.color} text-white`}>
        {config.label}
      </Badge>
    );
  };

  const handleAction = (action: string, ordem: OrdemServico) => {
    console.log(`Ação ${action} para ordem ${ordem.numero}`);
    // Aqui você implementaria as ações reais
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-200">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {emptyMessage}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 font-medium text-gray-600 dark:text-gray-300">Nº</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600 dark:text-gray-300">Cliente</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600 dark:text-gray-300">Data Prev. Final</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600 dark:text-gray-300">Status</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600 dark:text-gray-300">Ações</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((ordem) => (
                  <tr key={ordem.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-3 px-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                      {ordem.numero}
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-700 dark:text-gray-300">
                      {ordem.cliente}
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-600 dark:text-gray-400">
                      {ordem.dataPrevisaoFinal}
                    </td>
                    <td className="py-3 px-2">
                      {getStatusBadge(ordem.status)}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
                          onClick={() => handleAction('visualizar', ordem)}
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => handleAction('imprimir', ordem)}
                          title="Imprimir"
                        >
                          <Printer className="h-4 w-4 text-gray-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-green-100 dark:hover:bg-green-900"
                          onClick={() => handleAction('whatsapp', ordem)}
                          title="WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-yellow-100 dark:hover:bg-yellow-900"
                          onClick={() => handleAction('editar', ordem)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4 text-yellow-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900"
                          onClick={() => handleAction('excluir', ordem)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
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
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);

  // Simulação de dados - em produção, isso viria de uma API
  useEffect(() => {
    // Aqui você faria a chamada para a API para buscar as ordens
    setOrdens([]);
  }, []);

  const handleShortcut = (action: string) => {
    console.log(`Atalho acionado: ${action}`);
    // Implementar navegação para as respectivas páginas
    switch (action) {
      case 'clientes':
        // Rotas atualizadas conforme module.json
        window.location.href = '/modules/ordem_servico/pages/clientes';
        break;
      case 'produtos':
        window.location.href = '/modules/ordem_servico/pages/produtos';
        break;
      case 'ordens':
        window.location.href = '/modules/ordem_servico/pages/ordens';
        break;
    }
  };

  // Listener para atalhos de teclado globais
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Verificar se não está em um input ou textarea
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

  // Filtrar ordens por status
  const ordensAberto = ordens.filter(o => o.status === 'aberto');
  const ordensOrcamento = ordens.filter(o => o.status === 'orcamento');
  const ordensAguardando = ordens.filter(o => o.status === 'aguardando');
  const ordensExecucao = ordens.filter(o => o.status === 'execucao');
  const ordensFinalizadas = ordens.filter(o => o.status === 'finalizada');
  const ordensAprovadas = ordens.filter(o => o.status === 'aprovada');

  return (
    <div className="p-6 max-w-full mx-auto space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Título */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          Dashboard - Ordem de Serviços
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Visão geral das ordens de serviço e atalhos rápidos
        </p>
      </div>

      {/* Atalhos no topo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <ShortcutCard
          title="Clientes"
          shortcut="F1"
          icon={Users}
          color="bg-gradient-to-r from-blue-500 to-blue-600"
          onClick={() => handleShortcut('clientes')}
        />
        <ShortcutCard
          title="Produtos/Serviços"
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

      {/* Alertas de Equipamentos para Retirada */}
      <div className="mb-8">
        <AlertaRetiradaBadge variant="card" />
      </div>

      {/* Cards de Ordens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Primeira linha */}
        <OrderTable
          title="Ordens de Serviços Em Orçamento"
          orders={ordensOrcamento}
          emptyMessage="Nenhuma ordem em orçamento encontrada"
        />

        <OrderTable
          title="Ordens de Serviços Em Aberto"
          orders={ordensAberto}
          emptyMessage="Nenhuma ordem em aberto encontrada"
        />

        {/* Segunda linha */}
        <OrderTable
          title="Ordens de Serviços Aprovadas"
          orders={ordensAprovadas}
          emptyMessage="Nenhuma ordem aprovada encontrada"
        />

        <OrderTable
          title="Ordens de Serviços Finalizadas"
          orders={ordensFinalizadas}
          emptyMessage="Nenhuma ordem finalizada encontrada"
        />

        {/* Terceira linha */}
        <OrderTable
          title="Ordens de Serviços Em Andamento e Aguardando Peças"
          orders={ordensAguardando}
          emptyMessage="Nenhuma ordem aguardando peças encontrada"
        />

        <OrderTable
          title="Status de Vendas"
          orders={ordensExecucao}
          emptyMessage="Nenhuma venda em execução encontrada"
        />
      </div>

      {/* Instruções de atalhos */}
      <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Atalhos de Teclado:
        </h3>
        <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
          <span><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">F1</kbd> Clientes</span>
          <span><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">F2</kbd> Produtos/Serviços</span>
          <span><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">F3</kbd> Ordens</span>
        </div>
      </div>
    </div>
  );
}