'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Printer,
  MessageCircle,
  Filter,
  FileText,
  RotateCcw,
  Receipt,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { OrdemServico, StatusOS, STATUS_LABELS, STATUS_COLORS, OrigemSolicitacao, ORIGEM_LABELS } from '../../types/ordem-servico.types';
import { OrdemViewModal } from '../../components/OrdemViewModal';
import { PrintModal } from '../../components/PrintModal';
import { WhatsAppModal } from '../../components/WhatsAppModal';
import { AlertaRetiradaBadge } from '../../components/AlertaRetiradaBadge';

// Cliente API customizado para o módulo raiz
const api = {
  get: async (url: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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
    if (!token) console.warn('⚠️ [OrdensPage] Token não encontrado (Cookies/SessionSt)!');

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
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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
  },
  delete: async (url: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return { data: await response.json() };
  }
};

const useToast = () => ({
  toast: (options: { title: string; description: string; variant?: string }) => {
    if (options.variant === 'destructive') {
      console.error(`${options.title}: ${options.description}`);
    } else {
      console.log(`${options.title}: ${options.description}`);
    }
  }
});

export const dynamic = 'force-dynamic';

export default function OrdensPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusOS | 'all'>('all');
  const [origemFilter, setOrigemFilter] = useState<OrigemSolicitacao | 'all'>('all');
  const [reopenOrder, setReopenOrder] = useState<OrdemServico | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState<OrdemServico | null>(null);
  const [printFormat, setPrintFormat] = useState<'a4' | 'thermal'>('a4');
  const [printOrdemId, setPrintOrdemId] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printMenuOpen, setPrintMenuOpen] = useState<string | null>(null);
  const printMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // WhatsApp Modal State
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppOrder, setWhatsAppOrder] = useState<OrdemServico | null>(null);

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
    }, 500); // 500ms de tolerância para evitar piscadeiras
  }, []);

  // Carregar ordens de serviço
  const loadOrdens = async () => {
    try {
      setLoading(true);

      const filters: any = {};
      if (searchTerm) filters.search = searchTerm;
      if (statusFilter !== 'all') filters.status = [statusFilter];
      if (origemFilter !== 'all') filters.origem_solicitacao = origemFilter;

      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v.toString()));
        } else if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const response = await api.get(`/api/ordem_servico/ordens?${queryParams.toString()}`);

      // Tratar resposta com ou sem paginação
      const data = response.data?.data || response.data || [];
      setOrdens(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Erro ao carregar ordens:', error);

      // Mensagens de erro mais específicas
      let errorMessage = "Erro ao carregar ordens de serviço";
      if (error.response?.status === 400) {
        errorMessage = "Parâmetros de busca inválidos";
      } else if (error.response?.status === 500) {
        errorMessage = "Erro no servidor. Por favor, tente novamente";
      }

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      setOrdens([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      // Validation for short search terms
      if (searchTerm && searchTerm.trim().length > 0 && searchTerm.trim().length < 2) {
        // Can optionally set empty list or just do nothing
        // For now, let's respect the user's view but avoid the API call if we want strictness, 
        // OR allow loadOrdens to handle it. 
        // The guide suggests stopping at frontend.
        // But let's follow the guide's "useEffect" pattern exactly if possible.
        // Guide says:
        // if (safeSearch.length > 0 && safeSearch.length < 2) { setClients([]); return; }
        setOrdens([]);
        return;
      }
      loadOrdens();
    }, 500); // Increased debounce slightly to be safe

    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, origemFilter]);

  // Ações das ordens
  const handleView = (ordem: OrdemServico) => {
    setViewOrder(ordem);
    setIsViewModalOpen(true);
  };

  const handleEdit = (ordem: OrdemServico) => {
    window.location.href = `/modules/ordem_servico/pages/ordens/edit?id=${ordem.id}`;
  };

  const handleDelete = async (ordem: OrdemServico) => {
    if (!confirm(`Tem certeza que deseja excluir a OS #${ordem.numero}?`)) return;

    try {
      await api.delete(`/api/ordem_servico/ordens/${ordem.id}`);
      toast({
        title: "Sucesso",
        description: "Ordem de serviço excluída com sucesso"
      });
      loadOrdens();
    } catch (error) {
      console.error('Erro ao excluir ordem:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir ordem de serviço",
        variant: "destructive"
      });
    }
  };

  const handlePrintA4 = (ordem: OrdemServico) => {
    setPrintOrdemId(ordem.id);
    setPrintFormat('a4');
    setIsPrintModalOpen(true);
    setPrintMenuOpen(null);
  };

  const handlePrintThermal = (ordem: OrdemServico) => {
    setPrintOrdemId(ordem.id);
    setPrintFormat('thermal');
    setIsPrintModalOpen(true);
    setPrintMenuOpen(null);
  };

  const handleWhatsApp = (ordem: OrdemServico) => {
    if (ordem.cliente?.phone_primary) {
      setWhatsAppOrder(ordem);
      setIsWhatsAppModalOpen(true);
    } else {
      toast({
        title: "Erro",
        description: "Cliente não possui telefone cadastrado",
        variant: "destructive"
      });
    }
  };

  const handleReabrir = (ordem: OrdemServico) => {
    setReopenOrder(ordem);
  };

  const confirmReopen = async () => {
    if (!reopenOrder) return;

    try {
      await api.put(`/api/ordem_servico/ordens/${reopenOrder.id}/status`, { status: StatusOS.EM_EXECUCAO });
      toast({
        title: "Sucesso",
        description: "Ordem reaberta com sucesso"
      });
      loadOrdens();
      setReopenOrder(null);
    } catch (error) {
      console.error('Erro ao reabrir ordem:', error);
      toast({
        title: "Erro",
        description: "Erro ao reabrir ordem de serviço",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: StatusOS) => {
    const colorClass = STATUS_COLORS[status];
    return (
      <Badge className={`${colorClass} text-white`}>
        {STATUS_LABELS[status]}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Ordens de Serviço</h1>
          <p className="text-muted-foreground">Gerencie todas as ordens de serviço</p>
        </div>
        <div className="flex items-center gap-3">
          <AlertaRetiradaBadge variant="badge" />
          <Button onClick={() => window.location.href = '/modules/ordem_servico/pages/ordens/new'} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nova Ordem
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Número, cliente ou descrição..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter.toString()} onValueChange={(value: string) => setStatusFilter(value === 'all' ? 'all' : parseInt(value) as StatusOS)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Origem</label>
              <Select value={origemFilter.toString()} onValueChange={(value: string) => setOrigemFilter(value === 'all' ? 'all' : value as OrigemSolicitacao)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as origens" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as origens</SelectItem>
                  {Object.entries(ORIGEM_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Ordens */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Ordens de Serviço</span>
            <Badge variant="secondary">{ordens.length} ordens</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : ordens.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma ordem de serviço encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo de Serviço</TableHead>
                    <TableHead>Data Abertura</TableHead>
                    <TableHead>Data Previsão</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordens.map((ordem) => (
                    <TableRow key={ordem.id}>
                      <TableCell className="font-mono font-medium">
                        #{ordem.numero}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{ordem.cliente?.name || 'Cliente não encontrado'}</div>
                          {ordem.cliente?.phone_primary && (
                            <div className="text-sm text-muted-foreground">{ordem.cliente.phone_primary}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{ordem.tipo_servico}</TableCell>
                      <TableCell>{formatDate(ordem.data_abertura)}</TableCell>
                      <TableCell>
                        {ordem.data_previsao ? formatDate(ordem.data_previsao) : '-'}
                      </TableCell>
                      <TableCell>{formatCurrency(ordem.valor_servico)}</TableCell>
                      <TableCell>{getStatusBadge(ordem.status)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {ORIGEM_LABELS[ordem.origem_solicitacao]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(ordem)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {ordem.status !== StatusOS.FINALIZADA && ordem.status !== StatusOS.CANCELADA && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(ordem)}
                              className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}

                          <div
                            className="relative"
                            onMouseEnter={() => handlePrintMenuEnter(ordem.id)}
                            onMouseLeave={handlePrintMenuLeave}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                if (printMenuOpen === ordem.id) {
                                  setPrintMenuOpen(null);
                                } else {
                                  handlePrintMenuEnter(ordem.id);
                                }
                              }}
                              className={`
                                text-gray-600 hover:text-gray-700 hover:bg-gray-50 relative z-30 flex items-center gap-0.5
                                ${printMenuOpen === ordem.id ? 'bg-gray-50' : ''}
                              `}
                            >
                              <Printer className="h-4 w-4" />
                              <ChevronDown className={`h-3 w-3 opacity-50 transition-transform ${printMenuOpen === ordem.id ? 'rotate-180' : ''}`} />
                            </Button>

                            {printMenuOpen === ordem.id && (
                              <div
                                className="absolute left-0 top-full -mt-2 pt-2 z-50 min-w-[180px]"
                                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                              >
                                {/* Transparent bridge to maintain hover between button and menu */}
                                <div className="absolute top-0 left-0 w-full h-2 pointer-events-auto" />

                                <div className="bg-background border border-border shadow-xl rounded-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handlePrintA4(ordem);
                                      setPrintMenuOpen(null);
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-2 border-b border-border transition-colors cursor-pointer"
                                  >
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span>Impressão A4</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handlePrintThermal(ordem);
                                      setPrintMenuOpen(null);
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors cursor-pointer"
                                  >
                                    <Receipt className="h-4 w-4 text-muted-foreground" />
                                    <span>Impressão 50/80mm</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {ordem.cliente?.phone_primary && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleWhatsApp(ordem)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          )}

                          {(ordem.status === StatusOS.ORCAMENTO || ordem.status === StatusOS.ABERTA) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(ordem)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}

                          {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') &&
                            (ordem.status === StatusOS.FINALIZADA || ordem.status === StatusOS.CANCELADA) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReabrir(ordem)}
                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                title="Reabrir OS"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}
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

      <Dialog open={!!reopenOrder} onOpenChange={(open: boolean) => !open && setReopenOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reabrir Ordem de Serviço</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja reabrir a OS <span className="font-bold">#{reopenOrder?.numero}</span>?
              Isso alterará o status para "Em Execução".
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReopenOrder(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmReopen} className="bg-orange-600 hover:bg-orange-700 text-white">
              Confirmar Reabertura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <OrdemViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        ordem={viewOrder}
        onPrintA4={handlePrintA4}
        onPrintThermal={handlePrintThermal}
      />
      {/* Modal de Impressão */}
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

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
