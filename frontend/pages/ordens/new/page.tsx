'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    CalendarIcon,
    Save,
    ArrowLeft,
    Search,
    SearchCode,
    UserPlus,
    Wrench,
    ClipboardList,
    Truck,
    DollarSign,
    Info,
    CheckCircle2,
    AlertCircle,
    X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import {
    StatusOS,
    OrigemSolicitacao,
    TipoServico,
    TIPO_SERVICO_LABELS,
    ORIGEM_LABELS,
    STATUS_LABELS
} from '../../../types/ordem-servico.types';

interface Client {
    id: string;
    name: string;
    document?: string;
    phone_primary: string;
}

interface Technician {
    id: string;
    name: string;
}

export default function NewOrdemRefactoredPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    // Client State
    const [searchTerm, setSearchTerm] = useState('');
    const [clients, setClients] = useState<Client[]>([]);
    const [searchingClients, setSearchingClients] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    // Technicians State
    const [technicians, setTechnicians] = useState<Technician[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        tipo_servico: 'MANUTENCAO',
        prioridade: 'MEDIA',
        descricao: '',
        status: StatusOS.ABERTA, // Default: Aberta as per scope
        data_abertura: new Date(),
        usuario_responsavel_id: '',
        origem_solicitacao: 'PRESENCIAL' as OrigemSolicitacao,

        // Equipment
        equipamento_tipo: '',
        equipamento_marca: '',
        equipamento_modelo: '',
        equipamento_serie: '',
        equipamento_acessorios: '',
        equipamento_estado: '',

        // Values
        valor_servico: '',
        observacoes_financeiras: '',

        // Observations
        observacoes_internas: '',
        observacoes_cliente: '',

        // Formatação
        formatacao_so: '',
        formatacao_backup: false,
        formatacao_backup_descricao: '',
        formatacao_senha: ''
    });

    useEffect(() => {
        fetchTechnicians();
    }, []);

    const fetchTechnicians = async () => {
        try {
            const response = await api.get('/modules/ordem_servico/config/users');
            // Filter to only include technicians if the API supports it, or just show all available users
            setTechnicians(response.data.filter((u: any) => u.is_technician) || response.data);
        } catch (error) {
            console.error('Erro ao buscar técnicos:', error);
        }
    };

    const handleSearchClients = async () => {
        if (searchTerm.length < 2) return;
        try {
            setSearchingClients(true);
            const response = await api.get(`/api/ordem_servico/clientes?search=${searchTerm}&status=true`);
            setClients(response.data);
        } catch (error) {
            console.error('Erro ao buscar clientes:', error);
            toast({ title: 'Erro', description: 'Erro ao buscar clientes', variant: 'destructive' });
        } finally {
            setSearchingClients(false);
        }
    };

    const handleSave = async () => {
        if (!selectedClient) {
            toast({ title: 'Campo obrigatório', description: 'Identifique um cliente antes de salvar.', variant: 'warning' });
            return;
        }
        if (!formData.descricao) {
            toast({ title: 'Campo obrigatório', description: 'A descrição do problema é obrigatória.', variant: 'warning' });
            return;
        }

        try {
            setLoading(true);

            // Business Rule: Se Status = Orçamento (0), não pode ter execução imediata (bloqueado em backend/relatório)
            // But here we just send what's in the form.

            const payload = {
                ...formData,
                cliente_id: selectedClient.id,
                status: Number(formData.status),
                valor_servico: formData.valor_servico ? parseFloat(formData.valor_servico.replace(',', '.')) : 0,
                data_abertura: formData.data_abertura.toISOString()
            };

            const response = await api.post('/api/ordem_servico/ordens', payload);

            toast({
                title: 'OS Criada!',
                description: `Ordem de Serviço #${response.data.numero} gerada com sucesso.`,
                variant: 'default'
            });

            // Redirect to details or list
            window.location.href = `/modules/ordem_servico/pages/ordens`;
        } catch (error: any) {
            console.error('Erro ao salvar OS:', error);
            const msg = error.response?.data?.message || 'Erro ao processar sua solicitação.';
            toast({ title: 'Erro ao Salvar', description: msg, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 w-full mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" onClick={() => window.history.back()} title="Voltar">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Nova Ordem de Serviço</h1>
                        <p className="text-muted-foreground">Registre um novo atendimento ou gere um orçamento.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.history.back()} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={loading} className="gap-2 bg-primary hover:bg-primary/90">
                        {loading ? 'Processando...' : <><Save className="h-4 w-4" /> Salvar Ordem de Serviço</>}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">

                {/* Section 1: IDENTIFICAÇÃO DO CLIENTE */}
                <Card className="lg:col-span-1 shadow-sm border-2">
                    <CardHeader className="bg-muted/20 pb-4">
                        <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                            <CardTitle className="text-lg">Cliente</CardTitle>
                        </div>
                        <CardDescription>Busque ou selecione o cliente</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        {!selectedClient ? (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="search-client">Buscar Cliente</Label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="search-client"
                                                placeholder="Nome, CPF/CNPJ ou Tel..."
                                                className="pl-9"
                                                value={searchTerm}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                                                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSearchClients()}
                                            />
                                        </div>
                                        <Button size="icon" variant="secondary" onClick={handleSearchClients} disabled={searchingClients}>
                                            <SearchCode className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {clients.length > 0 && (
                                    <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto">
                                        {clients.map(c => (
                                            <div
                                                key={c.id}
                                                className="p-3 hover:bg-muted/50 cursor-pointer flex flex-col transition-colors"
                                                onClick={() => setSelectedClient(c)}
                                            >
                                                <span className="font-medium text-sm">{c.name}</span>
                                                <span className="text-xs text-muted-foreground">{c.document || 'Sem documento'} • {c.phone_primary}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex flex-col gap-2 pt-2">
                                    <Button variant="outline" className="w-full gap-2 border-dashed" onClick={() => window.location.href = '/modules/ordem_servico/pages/clientes'}>
                                        <UserPlus className="h-4 w-4" /> Cadastrar Novo Cliente
                                    </Button>
                                    <p className="text-[10px] text-center text-muted-foreground italic">
                                        Se o cliente não existir, cadastre-o primeiro.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-primary/10 rounded-lg border border-primary/20 p-4 space-y-3 relative">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 h-6 w-6 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-500"
                                    onClick={() => setSelectedClient(null)}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                                <div className="flex flex-col">
                                    <span className="text-xs text-primary font-bold uppercase tracking-wider">Selecionado</span>
                                    <span className="font-bold text-lg leading-tight">{selectedClient.name}</span>
                                    <span className="text-sm text-muted-foreground">{selectedClient.document}</span>
                                </div>
                                <div className="pt-2 flex flex-col gap-1 text-sm border-t border-primary/10">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="bg-background">{selectedClient.phone_primary}</Badge>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Main Form Area */}
                <div className="lg:col-span-2 xl:col-span-3 space-y-6">

                    {/* Section 2: DADOS DA ORDEM DE SERVIÇO */}
                    <Card className="shadow-sm border-2">
                        <CardHeader className="bg-muted/20 pb-4">
                            <div className="flex items-center gap-2">
                                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                                <CardTitle className="text-lg">Dados da Ordem de Serviço</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

                            <div className="space-y-2">
                                <Label>Tipo de Serviço *</Label>
                                <Select value={formData.tipo_servico} onValueChange={(v: string) => setFormData({ ...formData, tipo_servico: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(TIPO_SERVICO_LABELS).map(([k, l]) => (
                                            <SelectItem key={k} value={k}>{l}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Status Inicial *</Label>
                                <Select
                                    value={formData.status.toString()}
                                    onValueChange={(v) => setFormData({ ...formData, status: parseInt(v) })}
                                >
                                    <SelectTrigger className={
                                        formData.status === 0
                                            ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                                            : "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400"
                                    }>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">Orçamento (Inicia sem compromisso)</SelectItem>
                                        <SelectItem value="1">Aberta (Serviço autorizado)</SelectItem>
                                    </SelectContent>
                                </Select>
                                {formData.status === 0 && (
                                    <p className="text-[10px] text-yellow-600 dark:text-yellow-400 font-medium">📌 Notas: Não gera faturamento nem compromisso imediato.</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Prioridade</Label>
                                <Select value={formData.prioridade} onValueChange={(v: any) => setFormData({ ...formData, prioridade: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="BAIXA">Baixa</SelectItem>
                                        <SelectItem value="MEDIA">Média</SelectItem>
                                        <SelectItem value="ALTA">Alta</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Origem</Label>
                                <Select
                                    value={formData.origem_solicitacao}
                                    onValueChange={(v: any) => setFormData({ ...formData, origem_solicitacao: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(ORIGEM_LABELS).map(([k, l]) => (
                                            <SelectItem key={k} value={k}>{l}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Data de Entrada</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={`w-full justify-start text-left font-normal`}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {format(formData.data_abertura, "PPP", { locale: ptBR })}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={formData.data_abertura}
                                            onSelect={(d) => d && setFormData({ ...formData, data_abertura: d })}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2">
                                <Label>Técnico Responsável (Opcional)</Label>
                                <Select
                                    value={formData.usuario_responsavel_id}
                                    onValueChange={(v) => setFormData({ ...formData, usuario_responsavel_id: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um técnico" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="UNASSIGNED">Ninguém selecionado</SelectItem>
                                        {technicians.map(t => (
                                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Campos Condicionais: FORMATAÇÃO */}
                            {formData.tipo_servico === 'FORMATACAO' && (
                                <div className="col-span-full mt-4 p-4 border-2 border-primary/20 bg-primary/5 rounded-lg space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Wrench className="h-4 w-4 text-primary" />
                                        <h4 className="text-sm font-semibold uppercase tracking-wider">Detalhes da Formatação</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="space-y-2">
                                            <Label>Sistema Operacional</Label>
                                            <Select value={formData.formatacao_so} onValueChange={(v) => setFormData({ ...formData, formatacao_so: v })}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione o SO" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Windows 10">Windows 10</SelectItem>
                                                    <SelectItem value="Windows 11">Windows 11</SelectItem>
                                                    <SelectItem value="Linux">Linux</SelectItem>
                                                    <SelectItem value="MacOS">MacOS</SelectItem>
                                                    <SelectItem value="Outro">Outro</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Precisa de Backup?</Label>
                                            <Select
                                                value={formData.formatacao_backup ? "sim" : "nao"}
                                                onValueChange={(v) => setFormData({ ...formData, formatacao_backup: v === "sim" })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="nao">Não</SelectItem>
                                                    <SelectItem value="sim">Sim</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Possui Senha?</Label>
                                            <Select
                                                value={formData.formatacao_senha ? "sim" : "nao"}
                                                onValueChange={(v) => {
                                                    if (v === "nao") setFormData({ ...formData, formatacao_senha: '' });
                                                    else if (!formData.formatacao_senha) setFormData({ ...formData, formatacao_senha: ' ' }); // Trigger display
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="nao">Não</SelectItem>
                                                    <SelectItem value="sim">Sim</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {formData.formatacao_senha !== '' && (
                                            <div className="space-y-2">
                                                <Label>Digite a Senha</Label>
                                                <Input
                                                    placeholder="Senha do sistema/BIOS"
                                                    value={formData.formatacao_senha}
                                                    onChange={(e) => setFormData({ ...formData, formatacao_senha: e.target.value })}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {formData.formatacao_backup && (
                                        <div className="space-y-2 mt-4">
                                            <Label>O que deve ser salvo no Backup? (Pastas, Arquivos, Apps...)</Label>
                                            <Textarea
                                                placeholder="Ex: Pasta Documentos, Fotos, Desktop..."
                                                value={formData.formatacao_backup_descricao}
                                                onChange={(e) => setFormData({ ...formData, formatacao_backup_descricao: e.target.value })}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="col-span-full space-y-2">
                                <Label>Descrição do Problema / Serviço Solicitado *</Label>
                                <Textarea
                                    placeholder="Detalhe o que o cliente relatou ou o que deve ser feito..."
                                    className="min-h-[120px]"
                                    value={formData.descricao}
                                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                />
                            </div>

                        </CardContent>
                    </Card>

                    {/* Section 3: EQUIPAMENTO */}
                    <Card className="shadow-sm border-2">
                        <CardHeader className="bg-muted/20 pb-4">
                            <div className="flex items-center gap-2">
                                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
                                <CardTitle className="text-lg">Equipamento (Se aplicável)</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label>Tipo de Equipamento</Label>
                                    <Select
                                        value={formData.equipamento_tipo}
                                        onValueChange={(v: string) => setFormData({ ...formData, equipamento_tipo: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NOTEBOOK">Notebook</SelectItem>
                                            <SelectItem value="DESKTOP">Desktop (Computador)</SelectItem>
                                            <SelectItem value="SMARTPHONE">Smartphone</SelectItem>
                                            <SelectItem value="TABLET">Tablet</SelectItem>
                                            <SelectItem value="MONITOR">Monitor</SelectItem>
                                            <SelectItem value="IMPRESSORA">Impressora</SelectItem>
                                            <SelectItem value="OUTROS">Outros</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Marca</Label>
                                    <Input placeholder="Dell, HP, Samsung..." value={formData.equipamento_marca} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, equipamento_marca: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Modelo</Label>
                                    <Input placeholder="Vostro 3500, Galaxy S21..." value={formData.equipamento_modelo} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, equipamento_modelo: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Número de Série</Label>
                                    <Input placeholder="S/N ou IMEI..." value={formData.equipamento_serie} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, equipamento_serie: e.target.value })} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Acessórios / Outros</Label>
                                <Input
                                    placeholder="Cabo, Carregador, Capinha, Mouse..."
                                    className="w-full"
                                    value={formData.equipamento_acessorios}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, equipamento_acessorios: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Estado de Entrega / Obs</Label>
                                <Textarea
                                    placeholder="Riscos na tela, tampa solta, bateria descarregada..."
                                    className="min-h-[60px]"
                                    value={formData.equipamento_estado}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, equipamento_estado: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Section 4: VALORES */}
                        <Card className="shadow-sm border-2">
                            <CardHeader className="bg-slate-50/50 pb-4">
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">4</span>
                                    <CardTitle className="text-lg">Valores</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="space-y-2">
                                    <Label>Valor Estimado (R$)</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="0,00"
                                            className="pl-9"
                                            value={formData.valor_servico}
                                            onChange={(e) => setFormData({ ...formData, valor_servico: e.target.value })}
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground italic">Nota: Não gera cobrança automática nesta etapa.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Observações Financeiras</Label>
                                    <Textarea
                                        placeholder="Formas de pgto combinadas, descontos..."
                                        value={formData.observacoes_financeiras}
                                        onChange={(e) => setFormData({ ...formData, observacoes_financeiras: e.target.value })}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Section 5: OBSERVAÇÕES */}
                        <Card className="shadow-sm border-2">
                            <CardHeader className="bg-slate-50/50 pb-4">
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">5</span>
                                    <CardTitle className="text-lg">Observações</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        Observações Internas <Badge variant="secondary" className="text-[9px] h-4">Privado</Badge>
                                    </Label>
                                    <Textarea
                                        placeholder="Senhas, detalhes técnicos para equipe..."
                                        value={formData.observacoes_internas}
                                        onChange={(e) => setFormData({ ...formData, observacoes_internas: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        Observações para o Cliente <Badge variant="outline" className="text-[9px] h-4">Visível</Badge>
                                    </Label>
                                    <Textarea
                                        placeholder="Notas que aparecerão na impressão ou consulta online..."
                                        value={formData.observacoes_cliente}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, observacoes_cliente: e.target.value })}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Section 6: AÇÕES */}
                    <div className="flex flex-col md:flex-row gap-4 pt-4 pb-12">
                        <Button
                            className="flex-1 gap-2 h-12 text-lg active:scale-95 transition-transform"
                            size="lg"
                            onClick={handleSave}
                            disabled={loading}
                        >
                            {loading ? (
                                <>Agendando...</>
                            ) : (
                                <><Save className="h-5 w-5" /> Salvar Ordem de Serviço</>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            className="h-12 text-lg"
                            size="lg"
                            onClick={() => window.history.back()}
                            disabled={loading}
                        >
                            Voltar / Cancelar
                        </Button>
                    </div>

                </div>
            </div>

            {/* Business Rules Summary Footer */}
            <div className="bg-muted/30 p-6 rounded-xl border border-dashed text-sm text-muted-foreground grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    <p><strong>Validação:</strong> Todos os campos com asterisco são obrigatórios. O sistema verifica a validade do CPF/CNPJ se informado.</p>
                </div>
                <div className="flex gap-3">
                    <Info className="h-5 w-5 text-blue-500 shrink-0" />
                    <p><strong>Fluxo:</strong> Ao salvar como "Orçamento", o registro não gera obrigações financeiras imediatas.</p>
                </div>
                <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-500 shrink-0" />
                    <p><strong>Restrição:</strong> Clientes inativos não podem abrir novas ordens de serviço. Reative o cliente para prosseguir.</p>
                </div>
            </div>
        </div>
    );
}
