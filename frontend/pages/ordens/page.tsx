'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Printer,
  MessageCircle,
  Filter,
  FileText
} from 'lucide-react';
import { OrdemServico, StatusOS, STATUS_LABELS, STATUS_COLORS, OrigemSolicitacao, ORIGEM_LABELS } from '../../types/ordem-servico.types';

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

export default function OrdensPage() {
  const { toast } = useToast();
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusOS | 'all'>('all');
  const [origemFilter, setOrigemFilter] = useState<OrigemSolicitacao | 'all'>('all');

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
        } else {
          queryParams.append(key, value.toString());
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
    window.location.href = `/modules/ordem_servico/ordens/${ordem.id}`;
  };

  const handleEdit = (ordem: OrdemServico) => {
    window.location.href = `/modules/ordem_servico/ordens/${ordem.id}/edit`;
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

  const handlePrint = (ordem: OrdemServico) => {
    // TODO: Implementar impressão
    toast({
      title: "Info",
      description: "Funcionalidade de impressão será implementada em breve"
    });
  };

  const handleWhatsApp = (ordem: OrdemServico) => {
    if (ordem.cliente?.phone_primary) {
      const message = `Olá! Sobre a OS #${ordem.numero} - ${ordem.descricao}`;
      const url = `https://wa.me/55${ordem.cliente.phone_primary.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    } else {
      toast({
        title: "Erro",
        description: "Cliente não possui telefone cadastrado",
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
        <Button onClick={() => window.location.href = '/modules/ordem_servico/pages/ordens/new'} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Ordem
        </Button>
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
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter.toString()} onValueChange={(value) => setStatusFilter(value === 'all' ? 'all' : parseInt(value) as StatusOS)}>
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
              <Select value={origemFilter.toString()} onValueChange={(value) => setOrigemFilter(value === 'all' ? 'all' : value as OrigemSolicitacao)}>
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

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePrint(ordem)}
                            className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>

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
    </div>
  );
}
