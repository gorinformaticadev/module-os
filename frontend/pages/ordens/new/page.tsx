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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
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
    X,
    User,
    Phone,
    MapPin,
    Camera,
    Trash2,
    Plus,
    Loader2,
    Edit
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import {
    StatusOS,
    OrigemSolicitacao,
    TipoServico,
    TIPO_SERVICO_LABELS,
    ORIGEM_LABELS,
    STATUS_LABELS,
    Cliente
} from '../../../types/ordem-servico.types';
import ClientModal from '../../../components/ClientModal';
import ClientEditModal from '../../../components/ClientEditModal';

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
    const [clients, setClients] = useState<Cliente[]>([]);
    const [searchingClients, setSearchingClients] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);

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
        formatacao_senha: '',

        // Photos
        equipamento_fotos: [] as string[]
    });

    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

    useEffect(() => {
        fetchTechnicians();
    }, []);

    // 🔍 PADRÃO OFICIAL DE BUSCA - CLIENTES (com debounce)
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchClients();
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchClients = async () => {
        const safeSearch = typeof searchTerm === 'string' ? searchTerm.trim() : '';
        
        // 🔒 Evita busca curta
        if (safeSearch.length > 0 && safeSearch.length < 2) {
            setClients([]);
            return;
        }

        // ✅ Só busca se tiver 2+ caracteres
        if (safeSearch.length >= 2) {
            try {
                setSearchingClients(true);
                const response = await api.get(`/api/ordem_servico/clientes?search=${safeSearch}`);
                setClients(response.data);
            } catch (error) {
                console.error('Erro ao buscar clientes:', error);
                toast({ title: 'Erro', description: 'Erro ao buscar clientes', variant: 'destructive' });
                setClients([]);
            } finally {
                setSearchingClients(false);
            }
        } else {
            // 📋 Campo vazio = sem lista
            setClients([]);
        }
    };

    const handleClientCreated = (newClient: Cliente) => {
        // Seleciona automaticamente o cliente recém-criado
        setSelectedClient(newClient);
        toast({
            title: 'Cliente selecionado!',
            description: `${newClient.name} foi selecionado automaticamente.`,
            variant: 'default'
        });
    };

    const handleClientUpdated = (updatedClient: Cliente) => {
        // Atualiza o cliente selecionado com os novos dados
        setSelectedClient(updatedClient);
        toast({
            title: 'Cliente atualizado!',
            description: `Os dados de ${updatedClient.name} foram atualizados.`,
            variant: 'default'
        });
    };

    const fetchTechnicians = async () => {
        try {
            const response = await api.get('/modules/ordem_servico/config/users');
            // Filter to only include technicians if the API supports it, or just show all available users
            setTechnicians(response.data.filter((u: any) => u.is_technician) || response.data);
        } catch (error) {
            console.error('Erro ao buscar técnicos:', error);
        }
    };

    const [compressing, setCompressing] = useState(false);

    const compressImage = (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1024;
                    const MAX_HEIGHT = 1024;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        if (blob) resolve(blob);
                    }, 'image/jpeg', 0.6);
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        if (formData.equipamento_fotos.length + files.length > 5) {
            toast({ title: 'Limite atingido', description: 'Você pode enviar no máximo 5 fotos.', variant: 'warning' });
            return;
        }

        setCompressing(true);
        const newPhotos = [...formData.equipamento_fotos];

        try {
            for (let i = 0; i < files.length; i++) {
                const blob = await compressImage(files[i]);

                const formDataUpload = new FormData();
                formDataUpload.append('file', blob, files[i].name || `foto-${i}.jpg`);

                const { data } = await api.post('/api/ordem_servico/ordens/upload', formDataUpload, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });

                newPhotos.push(data.url);
            }
            setFormData({ ...formData, equipamento_fotos: newPhotos });
            toast({ title: 'Sucesso', description: 'Fotos enviadas com sucesso.' });
        } catch (error) {
            console.error('Erro no upload de foto:', error);
            toast({ title: 'Erro', description: 'Falha ao enviar uma ou mais fotos.', variant: 'destructive' });
        } finally {
            setCompressing(false);
            if (e.target) e.target.value = ''; // Limpar input para permitir selecionar o mesmo arquivo novamente
        }
    };

    const removePhoto = (index: number) => {
        const newPhotos = [...formData.equipamento_fotos];
        newPhotos.splice(index, 1);
        setFormData({ ...formData, equipamento_fotos: newPhotos });
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
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="search-client"
                                            placeholder="Digite 2+ letras para buscar..."
                                            className="pl-9"
                                            value={searchTerm}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                                        />
                                        {searchingClients && (
                                            <div className="absolute right-2.5 top-2.5">
                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                            </div>
                                        )}
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
                                    <Button variant="outline" className="w-full gap-2 border-dashed" onClick={() => setIsClientModalOpen(true)}>
                                        <UserPlus className="h-4 w-4" /> Cadastrar Novo Cliente
                                    </Button>
                                    <p className="text-[10px] text-center text-muted-foreground italic">
                                        Cadastre um novo cliente diretamente aqui.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-card rounded-lg border-2 border-primary/20 p-5 space-y-4 relative shadow-sm overflow-hidden bg-gradient-to-br from-primary/5 to-transparent">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-10 -mt-10 pointer-events-none" />

                                <div className="absolute -top-1 right-1 flex gap-1 z-10">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 rounded-full hover:bg-blue-500/10 hover:text-blue-600 transition-colors"
                                        onClick={() => setIsEditClientModalOpen(true)}
                                        title="Editar cliente"
                                    >
                                        <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                                        onClick={() => setSelectedClient(null)}
                                        title="Remover seleção"
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>

                                <div className="flex gap-4 items-start pt-2">
                                    <div className="h-20 w-20 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner shrink-0 overflow-hidden">
                                        {selectedClient.image_url ? (
                                            <img src={selectedClient.image_url} alt={selectedClient.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <User className="h-10 w-10 text-primary" />
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2 py-0.5 rounded text-[10px] bg-primary text-primary-foreground font-bold uppercase tracking-wider">Selecionado</span>
                                            {selectedClient.is_active ? (
                                                <Badge variant="outline" className="text-[10px] h-5 border-emerald-500/50 text-emerald-600 bg-emerald-50/50">Ativo</Badge>
                                            ) : (
                                                <Badge variant="destructive" className="text-[10px] h-5">Inativo</Badge>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-xl leading-tight text-foreground truncate">{selectedClient.name}</h3>
                                        <p className="text-sm text-muted-foreground font-medium">{selectedClient.document || 'Sem documento'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3 pt-3 border-t border-primary/10">
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-primary shrink-0" />
                                        <span className="text-sm font-semibold">{selectedClient.phone_primary}</span>
                                        {selectedClient.phone_secondary && (
                                            <span className="text-xs text-muted-foreground italic border-l pl-2">{selectedClient.phone_secondary}</span>
                                        )}
                                    </div>

                                    {(selectedClient.address_street || selectedClient.address_city) && (
                                        <div className="flex items-start gap-2">
                                            <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                            <div className="text-sm">
                                                <p className="font-medium text-foreground/80">
                                                    {selectedClient.address_street}{selectedClient.address_number ? `, ${selectedClient.address_number}` : ''}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {[selectedClient.address_neighborhood, selectedClient.address_city, selectedClient.address_state]
                                                        .filter(Boolean)
                                                        .join(' - ')}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {selectedClient.observations && (
                                        <div className="mt-2 p-3 bg-muted/40 rounded-md border border-muted-foreground/10">
                                            <div className="flex items-center gap-2 mb-1">
                                                <AlertCircle className="h-3 w-3 text-amber-500" />
                                                <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter">Observações do Cliente</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground italic line-clamp-2">
                                                {selectedClient.observations}
                                            </p>
                                        </div>
                                    )}
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

                            <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between">
                                    <Label className="flex items-center gap-2">
                                        <Camera className="h-4 w-4 text-primary" />
                                        Fotos do Equipamento ({formData.equipamento_fotos.length}/5)
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        {compressing && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-8 gap-1.5 text-xs"
                                            onClick={() => document.getElementById('photo-upload')?.click()}
                                            disabled={compressing || formData.equipamento_fotos.length >= 5}
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            Adicionar Fotos
                                        </Button>
                                    </div>
                                    <input
                                        id="photo-upload"
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={handlePhotoUpload}
                                    />
                                </div>

                                {formData.equipamento_fotos.length > 0 ? (
                                    <>
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {formData.equipamento_fotos.map((photo, index) => (
                                                <div key={index} className="group relative w-12 h-12 rounded-md border border-muted overflow-hidden bg-muted/30 hover:border-primary/50 transition-all cursor-pointer">
                                                    <img
                                                        src={photo}
                                                        alt={`Equipamento ${index + 1}`}
                                                        className="h-full w-full object-cover"
                                                        onClick={() => setSelectedPhoto(photo)}
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            size="icon"
                                                            className="h-5 w-5 rounded-full"
                                                            onClick={() => setSelectedPhoto(photo)}
                                                        >
                                                            <Search className="h-2.5 w-2.5" />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="icon"
                                                            className="h-5 w-5 rounded-full"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removePhoto(index);
                                                            }}
                                                        >
                                                            <Trash2 className="h-2.5 w-2.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
                                            <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-none">
                                                <div className="relative w-full h-full flex items-center justify-center p-4">
                                                    {selectedPhoto && (
                                                        <img
                                                            src={selectedPhoto}
                                                            alt="Visualização ampliada"
                                                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                                                        />
                                                    )}
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        className="absolute top-0 right-0 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 border-white/20 text-white"
                                                        onClick={() => setSelectedPhoto(null)}
                                                    >
                                                        <X className="h-6 w-6" />
                                                    </Button>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </>
                                ) : (
                                    <div
                                        className="border-2 border-dashed border-muted rounded-lg p-6 flex flex-col items-center justify-center text-muted-foreground hover:border-primary/30 hover:bg-primary/5 cursor-pointer transition-all"
                                        onClick={() => document.getElementById('photo-upload')?.click()}
                                    >
                                        <Camera className="h-8 w-8 mb-2 opacity-20" />
                                        <p className="text-xs font-medium">Nenhuma foto adicionada</p>
                                        <p className="text-[10px] opacity-60">Ideal para registrar o estado físico na entrada</p>
                                    </div>
                                )}
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

            {/* Modal de Novo Cliente */}
            <ClientModal
                isOpen={isClientModalOpen}
                onClose={() => setIsClientModalOpen(false)}
                onClientCreated={handleClientCreated}
            />

            {/* Modal de Edição de Cliente */}
            <ClientEditModal
                isOpen={isEditClientModalOpen}
                onClose={() => setIsEditClientModalOpen(false)}
                client={selectedClient}
                onClientUpdated={handleClientUpdated}
            />
        </div>
    );
}
