'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from '@/components/ui/popover';
import {
    Save,
    ArrowLeft,
    User,
    Phone,
    MapPin,
    DollarSign,
    AlertCircle,
    CheckCircle2,
    Info,
    Plus,
    Search,
    Trash2,
    X,
    ImageIcon,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Loader2,
    Brain
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { RichTextEditor } from '../../../components/ui/rich-text-editor';
import { useAI } from '../../../hooks/useAI';

// Tipos locais
interface OrdemServico {
    id: string;
    numero: string;
    cliente_id: string;
    usuario_responsavel_id: string;
    tipo_servico: string;
    prioridade: 'BAIXA' | 'MEDIA' | 'ALTA';
    descricao: string;
    observacoes_internas?: string;
    observacoes_cliente?: string;
    valor_servico: number;
    forma_pagamento?: string;
    status: StatusOS;
    data_abertura: string;
    data_previsao?: string;
    origem_solicitacao: OrigemSolicitacao;
    equipamento_tipo?: string;
    equipamento_marca?: string;
    equipamento_modelo?: string;
    equipamento_serie?: string;
    equipamento_acessorios?: string;
    equipamento_estado?: string;
    laudo_tecnico?: string;
    motivo_cancelamento?: string;
    cliente?: Cliente;
    equipamento_fotos?: string[];
    itens?: ItemOrdem[];
}

interface Produto {
    id: string;
    name: string;
    description: string;
    price: number | string;
    code?: string;
    image_url?: string;
}

interface ItemOrdem {
    produto_id?: string;
    descricao: string;
    valor_unitario: number;
    quantidade: number;
    valor_total: number;
    image_url?: string;
}

interface Cliente {
    id: string;
    name: string;
    document?: string;
    phone_primary: string;
    phone_secondary?: string;
    address_street?: string;
    address_number?: string;
    address_city?: string;
    address_state?: string;
    is_active: boolean;
    image_url?: string;
}

enum StatusOS {
    ORCAMENTO = 0,
    ABERTA = 1,
    EM_ANALISE = 2,
    AGUARDANDO_CLIENTE = 3,
    AGUARDANDO_PECAS = 4,
    EM_EXECUCAO = 5,
    FINALIZADA = 6,
    CANCELADA = 7
}

enum OrigemSolicitacao {
    WHATSAPP = 'WHATSAPP',
    PRESENCIAL = 'PRESENCIAL',
    SISTEMA = 'SISTEMA'
}

const STATUS_LABELS: Record<StatusOS, string> = {
    [StatusOS.ORCAMENTO]: 'Orçamento',
    [StatusOS.ABERTA]: 'Aberta',
    [StatusOS.EM_ANALISE]: 'Em Análise',
    [StatusOS.AGUARDANDO_CLIENTE]: 'Aguardando Cliente',
    [StatusOS.AGUARDANDO_PECAS]: 'Aguardando Peças',
    [StatusOS.EM_EXECUCAO]: 'Em Execução',
    [StatusOS.FINALIZADA]: 'Finalizada',
    [StatusOS.CANCELADA]: 'Cancelada'
};

const ORIGEM_LABELS: Record<OrigemSolicitacao, string> = {
    [OrigemSolicitacao.WHATSAPP]: 'WhatsApp',
    [OrigemSolicitacao.PRESENCIAL]: 'Presencial',
    [OrigemSolicitacao.SISTEMA]: 'Sistema'
};

const TRANSICOES_PERMITIDAS: Record<StatusOS, StatusOS[]> = {
    [StatusOS.ORCAMENTO]: [StatusOS.ABERTA, StatusOS.CANCELADA],
    [StatusOS.ABERTA]: [StatusOS.EM_ANALISE, StatusOS.CANCELADA],
    [StatusOS.EM_ANALISE]: [StatusOS.EM_EXECUCAO, StatusOS.AGUARDANDO_CLIENTE, StatusOS.AGUARDANDO_PECAS, StatusOS.CANCELADA],
    [StatusOS.AGUARDANDO_CLIENTE]: [StatusOS.EM_ANALISE, StatusOS.EM_EXECUCAO, StatusOS.AGUARDANDO_PECAS, StatusOS.CANCELADA],
    [StatusOS.AGUARDANDO_PECAS]: [StatusOS.EM_EXECUCAO, StatusOS.AGUARDANDO_CLIENTE, StatusOS.CANCELADA],
    [StatusOS.EM_EXECUCAO]: [StatusOS.FINALIZADA, StatusOS.AGUARDANDO_CLIENTE, StatusOS.AGUARDANDO_PECAS, StatusOS.CANCELADA],
    [StatusOS.FINALIZADA]: [],
    [StatusOS.CANCELADA]: []
};

interface Technician {
    id: string;
    name: string;
    email?: string;
}

export default function EditOrdemPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { gerarLaudo, analisarDescricao, analyzing } = useAI();
    const [aiAnalysis, setAiAnalysis] = useState<any>(null);

    const handleAIAnalyze = async () => {
        if (!formData.descricao) {
            toast({
                title: 'Atenção',
                description: 'Descreva o problema primeiro para que a IA possa analisar.',
                variant: 'destructive'
            });
            return;
        }

        try {
            const result = await analisarDescricao(formData.descricao);
            setAiAnalysis(result);
            toast({
                title: 'Análise Concluída',
                description: 'A IA analisou o problema e forneceu sugestões.',
            });
        } catch (error) {
            toast({
                title: 'Erro na IA',
                description: 'Não foi possível realizar a análise no momento. Verifique as configurações de IA.',
                variant: 'destructive'
            });
        }
    };
    const [loading, setLoading] = useState(false);
    const [loadingOrdem, setLoadingOrdem] = useState(true);

    const ordemId = searchParams.get('id');

    // Estados principais
    const [ordem, setOrdem] = useState<OrdemServico | null>(null);
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [tiposServico, setTiposServico] = useState<{ id: string; nome: string; is_default: boolean }[]>([]);

    // Estados para Produtos
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [itemTemp, setItemTemp] = useState<Partial<ItemOrdem>>({
        descricao: '',
        quantidade: 1,
    });
    // State for image preview
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Refs for keyboard navigation
    const descriptionInputRef = React.useRef<HTMLInputElement>(null);
    const valueInputRef = React.useRef<HTMLInputElement>(null);
    const quantityInputRef = React.useRef<HTMLInputElement>(null);

    // State for keyboard navigation selection
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [openCombobox, setOpenCombobox] = useState(false);
    // Estados do formulário
    const [formData, setFormData] = useState({
        tipo_servico: '',
        prioridade: 'MEDIA' as 'BAIXA' | 'MEDIA' | 'ALTA',
        descricao: '',
        status: StatusOS.ABERTA,
        usuario_responsavel_id: '',
        origem_solicitacao: 'PRESENCIAL' as OrigemSolicitacao,
        equipamento_tipo: '',
        equipamento_marca: '',
        equipamento_modelo: '',
        equipamento_serie: '',
        valor_servico: '',
        forma_pagamento: '',
        data_previsao: '',
        observacoes_internas: '',
        observacoes_cliente: '',
        laudo_tecnico: '',
        motivo_cancelamento: '',
        itens: [] as ItemOrdem[],
        equipamento_fotos: [] as string[]
    });

    useEffect(() => {
        if (!ordemId) {
            toast({
                title: "Erro",
                description: "ID da ordem não fornecido",
                variant: "destructive"
            });
            router.push('/modules/ordem_servico/pages/ordens');
            return;
        }

        loadOrdem();
        fetchTechnicians();
        fetchTiposServico();
        fetchProdutos();
    }, [ordemId]);

    const fetchProdutos = async () => {
        try {
            const response = await api.get('/api/ordem_servico/produtos');
            setProdutos(response.data);
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível carregar a lista de produtos.',
                variant: 'destructive',
            });
        }
    };

    const handleAddItem = () => {
        if (!itemTemp.descricao || !itemTemp.quantidade || itemTemp.valor_unitario === undefined || itemTemp.valor_unitario === null) {
            toast({
                title: "Atenção",
                description: "Preencha a descrição, quantidade e valor unitário.",
                variant: "destructive"
            });
            return;
        }

        const qtd = Number(itemTemp.quantidade);
        const valorUnit = Number(itemTemp.valor_unitario);
        const total = qtd * valorUnit;

        const newItem: ItemOrdem = {
            produto_id: itemTemp.produto_id,
            descricao: itemTemp.descricao,
            quantidade: qtd,
            valor_unitario: valorUnit,
            valor_total: total,
            image_url: itemTemp.image_url
        };

        const currentItens = formData.itens || [];
        const newItens = [...currentItens, newItem];

        updateFormDataWithItens(newItens);

        setItemTemp({
            descricao: '',
            quantidade: 1,
            valor_unitario: 0,
            produto_id: undefined
        });
        setDebouncedSearch('');
        setOpenCombobox(false);
        setTimeout(() => descriptionInputRef.current?.focus(), 100);
    };

    const handleRemoveItem = (index: number) => {
        const currentItens = formData.itens || [];
        const newItens = currentItens.filter((_, i) => i !== index);
        updateFormDataWithItens(newItens);
    };

    const updateFormDataWithItens = (itens: ItemOrdem[]) => {
        const totalItens = itens.reduce((acc, item) => acc + item.valor_total, 0);

        setFormData(prev => ({
            ...prev,
            itens: itens,
            valor_servico: totalItens.toFixed(2)
        }));
    };



    const handleDescriptionChange = (desc: string) => {
        // Se mudou a descrição, limpa o ID do produto para indicar que é customizado
        // a menos que o usuário tenha selecionado da lista (handled separately)
        setItemTemp(prev => ({
            ...prev,
            descricao: desc,
            produto_id: undefined // Limpa vínculo se digitar
        }));
    };

    const handleUpdateItemQuantity = (index: number, newQuantity: number) => {
        const newItens = [...(formData.itens || [])];
        if (newQuantity < 1) return; // Prevent invalid quantity

        newItens[index] = {
            ...newItens[index],
            quantidade: newQuantity,
            valor_total: newQuantity * newItens[index].valor_unitario
        };

        // Recalculate total service value
        const totalItens = newItens.reduce((acc, item) => acc + item.valor_total, 0);

        setFormData(prev => ({
            ...prev,
            itens: newItens,
            valor_servico: totalItens.toFixed(2)
        }));
    };

    const handleProductClick = (produto: Produto) => {
        setItemTemp({
            produto_id: produto.id,
            descricao: produto.name,
            valor_unitario: Number(produto.price),
            quantidade: 1,
            valor_total: Number(produto.price),
            // Se tiver imagem, salva na lista (opcional, se ItemOrdem tiver image_url)
            image_url: produto.image_url
        });
        setOpenCombobox(false);
        setDebouncedSearch('');
        // Focus on Value input after selection
        setTimeout(() => valueInputRef.current?.focus(), 100);
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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if ((formData.equipamento_fotos?.length || 0) + files.length > 5) {
            toast({ title: 'Limite atingido', description: 'Você pode enviar no máximo 5 fotos.', variant: 'destructive' });
            return;
        }

        setCompressing(true);
        setUploading(true);
        const newPhotos = [...(formData.equipamento_fotos || [])];

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
            toast({ title: 'Sucesso', description: 'Fotos enviadas com sucesso!' });
        } catch (error) {
            console.error('Erro no upload de foto:', error);
            toast({ title: 'Erro', description: 'Falha ao enviar uma ou mais fotos.', variant: 'destructive' });
        } finally {
            setCompressing(false);
            setUploading(false);
            // Reset input
            if (e.target) e.target.value = '';
        }
    };

    const handleRemovePhoto = (index: number) => {
        const currentPhotos = [...(formData.equipamento_fotos || [])];
        currentPhotos.splice(index, 1);
        setFormData({ ...formData, equipamento_fotos: currentPhotos });
    };

    // --- CARREGAMENTO INICIAL ---
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(itemTemp.descricao || '');
        }, 0);
        return () => clearTimeout(timer);
    }, [itemTemp.descricao]);

    // Filtra produtos baseado no input atual
    const filteredProducts = debouncedSearch.length >= 2 ? produtos.filter(p =>
        (p.name || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(debouncedSearch.toLowerCase())
    ) : [];

    useEffect(() => {
        if (debouncedSearch.length >= 2 && !itemTemp.produto_id && filteredProducts.length > 0) {
            setOpenCombobox(true);
        } else {
            setOpenCombobox(false);
        }
        setSelectedIndex(0); // Reset selected index whenever search or products change
    }, [debouncedSearch, itemTemp.produto_id, filteredProducts.length]);


    const loadOrdem = async () => {
        try {
            setLoadingOrdem(true);
            const response = await api.get(`/api/ordem_servico/ordens/${ordemId}`);
            const ordemData = response.data;

            setOrdem(ordemData);

            // Preencher formulário com dados da ordem
            setFormData({
                tipo_servico: ordemData.tipo_servico || '',
                prioridade: ordemData.prioridade || 'MEDIA',
                descricao: ordemData.descricao || '',
                status: ordemData.status || StatusOS.ABERTA,
                usuario_responsavel_id: ordemData.usuario_responsavel_id || '',
                origem_solicitacao: ordemData.origem_solicitacao || 'PRESENCIAL',
                equipamento_tipo: ordemData.equipamento_tipo || '',
                equipamento_marca: ordemData.equipamento_marca || '',
                equipamento_modelo: ordemData.equipamento_modelo || '',
                equipamento_serie: ordemData.equipamento_serie || '',
                valor_servico: ordemData.valor_servico ? ordemData.valor_servico.toString() : '',
                forma_pagamento: ordemData.forma_pagamento || '',
                data_previsao: ordemData.data_previsao ? ordemData.data_previsao.split('T')[0] : '',
                observacoes_internas: ordemData.observacoes_internas || '',
                observacoes_cliente: ordemData.observacoes_cliente || '',
                laudo_tecnico: ordemData.laudo_tecnico || '',
                motivo_cancelamento: ordemData.motivo_cancelamento || '',
                itens: ordemData.itens || [],
                equipamento_fotos: ordemData.equipamento_fotos || []
            });

        } catch (error: any) {
            console.error('Erro ao carregar ordem:', error);

            // Se for erro 401 (não autorizado), redirecionar para login
            if (error.response?.status === 401) {
                toast({
                    title: "Sessão Expirada",
                    description: "Você precisa fazer login para acessar esta página",
                    variant: "destructive"
                });
                router.push('/login');
                return;
            }

            toast({
                title: "Erro",
                description: "Erro ao carregar dados da ordem de serviço",
                variant: "destructive"
            });
            router.push('/modules/ordem_servico/pages/ordens');
        } finally {
            setLoadingOrdem(false);
        }
    };

    const fetchTechnicians = async () => {
        try {
            const response = await api.get('/api/ordem_servico/ordens/technicians');
            setTechnicians(response.data);
        } catch (error) {
            console.error('Erro ao buscar técnicos:', error);
        }
    };

    const fetchTiposServico = async () => {
        try {
            const response = await api.get('/api/ordem_servico/ordens/tipos-servico');
            setTiposServico(response.data);
        } catch (error) {
            console.error('Erro ao buscar tipos de serviço:', error);
        }
    };

    const getStatusesPermitidos = () => {
        if (!ordem) return [];
        return TRANSICOES_PERMITIDAS[ordem.status] || [];
    };

    const handleGenerateLaudo = async () => {
        if (!formData.descricao) {
            toast({
                title: "Atenção",
                description: "Informe a descrição do problema para orientar a IA.",
                variant: "destructive"
            });
            return;
        }

        try {
            const laudo = await gerarLaudo(formData.descricao, formData.laudo_tecnico || '');
            setFormData(prev => ({ ...prev, laudo_tecnico: laudo }));
            toast({
                title: "Sucesso",
                description: "Laudo técnico gerado com sucesso pela IA.",
            });
        } catch (error) {
            toast({
                title: "Erro",
                description: "Não foi possível gerar o laudo com IA.",
                variant: "destructive"
            });
        }
    };

    const handleSave = async () => {
        if (!ordem) return;

        try {
            setLoading(true);

            const payload = {
                tipo_servico: formData.tipo_servico,
                prioridade: formData.prioridade,
                descricao: formData.descricao,
                observacoes_internas: formData.observacoes_internas || undefined,
                observacoes_cliente: formData.observacoes_cliente || undefined,
                valor_servico: formData.valor_servico ? parseFloat(formData.valor_servico.replace(',', '.')) : 0,
                forma_pagamento: formData.forma_pagamento || undefined,
                data_previsao: formData.data_previsao ? formData.data_previsao : undefined,
                usuario_responsavel_id: formData.usuario_responsavel_id || undefined,
                status: formData.status,
                motivo_cancelamento: formData.motivo_cancelamento || undefined,
                equipamento_tipo: formData.equipamento_tipo || undefined,
                equipamento_marca: formData.equipamento_marca || undefined,
                equipamento_modelo: formData.equipamento_modelo || undefined,
                equipamento_serie: formData.equipamento_serie || undefined,
                equipamento_fotos: formData.equipamento_fotos,
                laudo_tecnico: formData.laudo_tecnico || undefined,
                itens: formData.itens
            };

            // Remove undefined values
            Object.keys(payload).forEach(key => {
                if ((payload as any)[key] === undefined) {
                    delete (payload as any)[key];
                }
            });

            await api.put(`/api/ordem_servico/ordens/${ordemId}`, payload);

            toast({
                title: 'Sucesso!',
                description: `Ordem de Serviço #${ordem.numero} atualizada com sucesso.`,
                variant: 'default'
            });

            // router.push('/modules/ordem_servico/pages/ordens');
            // Refresh data instead of redirecting
            await loadOrdem();
        } catch (error: any) {
            console.error('Erro ao salvar OS:', error);
            const msg = error.response?.data?.message || 'Erro ao processar sua solicitação.';
            toast({
                title: 'Erro ao Salvar',
                description: msg,
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    if (loadingOrdem) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Carregando ordem de serviço...</p>
                </div>
            </div>
        );
    }

    if (!ordem) {
        return (
            <div className="p-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4 text-destructive">Ordem não encontrada</h2>
                    <Button onClick={() => router.push('/modules/ordem_servico/pages/ordens')}>
                        Voltar para Lista
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 w-full mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.push('/modules/ordem_servico/pages/ordens')}
                        title="Voltar"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Editar OS #{ordem.numero}
                        </h1>
                        <p className="text-muted-foreground">
                            Altere os dados da ordem de serviço
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => router.push('/modules/ordem_servico/pages/ordens')}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="gap-2 bg-primary hover:bg-primary/90"
                    >
                        {loading ? 'Salvando...' : <><Save className="h-4 w-4" /> Salvar Alterações</>}
                    </Button>
                </div>
            </div>

            <div className="space-y-6">

                {/* Section 1: CLIENTE (FIXO) - FULL WIDTH */}
                <Card className="shadow-sm border-2 w-full">
                    <CardHeader className="bg-muted/20 pb-4">
                        <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                            <CardTitle className="text-lg">Cliente</CardTitle>
                        </div>
                        <CardDescription>Informações do cliente (não editável)</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {ordem.cliente && (
                            <div className="bg-card rounded-lg border-2 border-muted p-5 relative shadow-sm overflow-hidden bg-gradient-to-br from-muted/20 to-transparent">

                                {/* Layout Horizontal para Cliente */}
                                <div className="flex flex-col md:flex-row gap-6 items-start">
                                    {/* Avatar e Status */}
                                    <div className="flex items-center gap-4 shrink-0">
                                        <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center border border-muted-foreground/20 shadow-inner overflow-hidden">
                                            {ordem.cliente.image_url ? (
                                                <img
                                                    src={ordem.cliente.image_url}
                                                    alt={ordem.cliente.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <User className="h-8 w-8 text-muted-foreground" />
                                            )}
                                        </div>
                                    </div>
                                    {/* Dados Principais */}
                                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <div>
                                            <h3 className="font-bold text-xl leading-tight text-foreground truncate">
                                                {ordem.cliente.name}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Badge variant="secondary" className="text-[10px] h-5">
                                                    Cliente Fixo
                                                </Badge>
                                                {ordem.cliente.is_active ? (
                                                    <Badge variant="outline" className="text-[10px] h-5 border-emerald-500/50 text-emerald-600 bg-emerald-50/50">
                                                        Ativo
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="destructive" className="text-[10px] h-5">
                                                        Inativo
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground font-medium mt-1">
                                                {ordem.cliente.document || 'Sem documento'}
                                            </p>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contatos</p>
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                                                <span className="text-sm font-medium">{ordem.cliente.phone_primary}</span>
                                            </div>
                                            {ordem.cliente.phone_secondary && (
                                                <div className="flex items-center gap-2 pl-6">
                                                    <span className="text-sm text-muted-foreground">{ordem.cliente.phone_secondary}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Endereço</p>
                                            {(ordem.cliente.address_street || ordem.cliente.address_city) ? (
                                                <div className="flex items-start gap-2">
                                                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                                    <div className="text-sm">
                                                        <p className="font-medium text-foreground/80">
                                                            {ordem.cliente.address_street}
                                                            {ordem.cliente.address_number ? `, ${ordem.cliente.address_number}` : ''}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {[
                                                                ordem.cliente.address_city,
                                                                ordem.cliente.address_state
                                                            ]
                                                                .filter(Boolean)
                                                                .join(' - ')}
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-muted-foreground italic">Endereço não cadastrado</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

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
                            <Select
                                value={formData.tipo_servico}
                                onValueChange={(v: string) => setFormData({ ...formData, tipo_servico: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tipo de serviço" />
                                </SelectTrigger>
                                <SelectContent>
                                    {tiposServico.map((tipo) => (
                                        <SelectItem key={tipo.id} value={tipo.nome}>
                                            {tipo.nome}
                                            {tipo.is_default && <span className="text-xs text-muted-foreground ml-2">(Padrão)</span>}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Status *</Label>
                            <Select
                                value={formData.status.toString()}
                                onValueChange={(v) => setFormData({ ...formData, status: parseInt(v) })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {/* Status atual sempre disponível */}
                                    <SelectItem value={ordem.status.toString()}>
                                        {STATUS_LABELS[ordem.status]} (Atual)
                                    </SelectItem>
                                    {/* Transições permitidas */}
                                    {getStatusesPermitidos().map((status) => (
                                        <SelectItem key={status} value={status.toString()}>
                                            {STATUS_LABELS[status]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Prioridade</Label>
                            <Select
                                value={formData.prioridade}
                                onValueChange={(v: any) => setFormData({ ...formData, prioridade: v })}
                            >
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
                            <Label>Técnico Responsável</Label>
                            <Select
                                value={formData.usuario_responsavel_id || 'NONE'}
                                onValueChange={(v) => setFormData({ ...formData, usuario_responsavel_id: v === 'NONE' ? '' : v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um técnico" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NONE">Nenhum técnico selecionado</SelectItem>
                                    {technicians.map(t => (
                                        <SelectItem key={t.id} value={t.id}>
                                            {t.name}
                                            {t.email && <span className="text-xs text-muted-foreground ml-2">({t.email})</span>}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Data de Entrada</Label>
                            <Input
                                value={ordem.data_abertura ? new Date(ordem.data_abertura).toLocaleDateString('pt-BR') : '-'}
                                disabled
                                className="bg-muted opacity-80"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Data de Previsão</Label>
                            <Input
                                type="date"
                                value={formData.data_previsao}
                                onChange={(e) => setFormData({ ...formData, data_previsao: e.target.value })}
                            />
                        </div>

                        <div className="col-span-full space-y-2">
                            <div className="flex justify-between items-center">
                                <Label>Descrição do Problema / Serviço Solicitado *</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-2 text-primary border-primary/20 hover:bg-primary/5"
                                    onClick={handleAIAnalyze}
                                    disabled={analyzing || !formData.descricao}
                                >
                                    {analyzing ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Brain className="h-3.5 w-3.5" />
                                    )}
                                    {analyzing ? 'Analisando...' : 'Analisar com IA'}
                                </Button>
                            </div>
                            <RichTextEditor
                                value={formData.descricao || ''}
                                onChange={(content) => setFormData(prev => ({ ...prev, descricao: content }))}
                                disabled={loading || analyzing}
                            />

                            {aiAnalysis && (
                                <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex items-center gap-2 mb-3 text-primary font-semibold text-sm">
                                        <Brain className="h-4 w-4" />
                                        Sugestão da Inteligência Artificial
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                        <div className="space-y-1">
                                            <span className="font-bold block uppercase text-[10px] text-muted-foreground">Resumo Técnico</span>
                                            <p className="text-foreground leading-relaxed">
                                                {typeof aiAnalysis === 'string' ? aiAnalysis : aiAnalysis.resumo || aiAnalysis.text}
                                            </p>
                                        </div>
                                        {aiAnalysis.causas && (
                                            <div className="space-y-1">
                                                <span className="font-bold block uppercase text-[10px] text-muted-foreground">Possíveis Causas</span>
                                                <p className="text-foreground leading-relaxed">{aiAnalysis.causas}</p>
                                            </div>
                                        )}
                                        {aiAnalysis.sugestoes && (
                                            <div className="space-y-1">
                                                <span className="font-bold block uppercase text-[10px] text-muted-foreground">Peças/Serviços Sugeridos</span>
                                                <p className="text-foreground leading-relaxed">{aiAnalysis.sugestoes}</p>
                                            </div>
                                        )}
                                        {aiAnalysis.complexidade && (
                                            <div className="space-y-1">
                                                <span className="font-bold block uppercase text-[10px] text-muted-foreground">Complexidade Estimada</span>
                                                <span className={`px-2 py-0.5 rounded-full inline-block font-medium ${aiAnalysis.complexidade === 'Baixo' ? 'bg-green-500/10 text-green-600' :
                                                    aiAnalysis.complexidade === 'Médio' ? 'bg-yellow-500/10 text-yellow-600' :
                                                        'bg-red-500/10 text-red-600'
                                                    }`}>
                                                    {aiAnalysis.complexidade}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="mt-3 h-7 text-[10px] text-muted-foreground hover:text-foreground p-0 h-auto"
                                        onClick={() => setAiAnalysis(null)}
                                    >
                                        Limpar sugestão
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Motivo de Cancelamento (se status for cancelada) */}
                        {formData.status === StatusOS.CANCELADA && (
                            <div className="col-span-full space-y-2">
                                <Label>Motivo do Cancelamento *</Label>
                                <Textarea
                                    placeholder="Descreva o motivo do cancelamento..."
                                    value={formData.motivo_cancelamento}
                                    onChange={(e) => setFormData({ ...formData, motivo_cancelamento: e.target.value })}
                                />
                            </div>
                        )}

                    </CardContent>
                </Card>



                {/* Section 4: EQUIPAMENTO (Moved UP) */}
                <Card className="shadow-sm border-2">
                    <CardHeader className="bg-muted/20 pb-4">
                        <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
                            <CardTitle className="text-lg">Equipamento</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label>Tipo de Equipamento</Label>
                                <Input
                                    placeholder="Notebook, Smartphone..."
                                    value={formData.equipamento_tipo}
                                    onChange={(e) => setFormData({ ...formData, equipamento_tipo: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Marca</Label>
                                <Input
                                    placeholder="Dell, HP, Samsung..."
                                    value={formData.equipamento_marca}
                                    onChange={(e) => setFormData({ ...formData, equipamento_marca: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Modelo</Label>
                                <Input
                                    placeholder="Vostro 3500, Galaxy S21..."
                                    value={formData.equipamento_modelo}
                                    onChange={(e) => setFormData({ ...formData, equipamento_modelo: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Número de Série</Label>
                                <Input
                                    placeholder="S/N ou IMEI..."
                                    value={formData.equipamento_serie}
                                    onChange={(e) => setFormData({ ...formData, equipamento_serie: e.target.value })}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Section: FOTOS DO EQUIPAMENTO */}
                <Card className="shadow-sm border-2">
                    <CardHeader className="bg-muted/20 pb-4">
                        <div className="flex items-center gap-2">
                            <ImageIcon className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg">Fotos do Equipamento</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="flex flex-wrap gap-2">
                            {formData.equipamento_fotos?.map((photo, index) => (
                                <div key={index} className="relative group w-24 h-24">
                                    <img
                                        src={photo}
                                        alt={`Foto ${index + 1}`}
                                        className="w-full h-full object-cover rounded-md border cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => setPreviewImage(photo)}
                                    />
                                    <button
                                        onClick={() => handleRemovePhoto(index)}
                                        className="absolute top-1 right-1 bg-destructive/90 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remover foto"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                            <div className="flex items-center justify-center border-2 border-dashed rounded-md w-24 h-24 hover:bg-muted/50 transition-colors">
                                <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                        disabled={uploading}
                                    />
                                    {uploading ? (
                                        <div className="animate-spin h-5 w-5 border-b-2 border-primary rounded-full" />
                                    ) : (
                                        <>
                                            <Plus className="h-6 w-6 text-muted-foreground" />
                                            <span className="text-[10px] text-muted-foreground font-medium mt-1">Add</span>
                                        </>
                                    )}
                                </label>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Section 3: LAUDO TÉCNICO (Moved DOWN) */}
                <Card className="shadow-sm border-2">
                    <CardHeader className="bg-muted/20 pb-4">
                        <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">4</span>
                            <CardTitle className="text-lg">Laudo Técnico</CardTitle>
                        </div>
                        <CardDescription>Diagnóstico e observações técnicas</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label>Conteúdo do Laudo</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleGenerateLaudo}
                                    disabled={loading || analyzing}
                                    className="gap-2 border-primary/50 hover:border-primary hover:bg-primary/5"
                                >
                                    {analyzing ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Sparkles className="h-4 w-4 text-primary" />
                                    )}
                                    {analyzing ? 'Gerando...' : 'Gerar com IA'}
                                </Button>
                            </div>
                            <RichTextEditor
                                value={formData.laudo_tecnico || ''}
                                onChange={(content) => setFormData(prev => ({ ...prev, laudo_tecnico: content }))}
                                disabled={loading || analyzing}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Section 5: PRODUTOS E SERVIÇOS */}
                <Card className="shadow-sm border-2">
                    <CardHeader className="bg-muted/20 pb-4">
                        <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">5</span>
                            <CardTitle className="text-lg">Produtos e Serviços</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">

                        {/* Adicionar Item */}
                        {/* Adicionar Item - Layout Unificado */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-muted/30 p-4 rounded-lg border border-dashed">

                            {/* Descrição com Autocomplete */}
                            <div className="md:col-span-6 space-y-2 relative">
                                <Label>Descrição do Item / Produto</Label>
                                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                    <PopoverAnchor asChild>
                                        <div className="relative">
                                            <Input
                                                value={itemTemp.descricao}
                                                onChange={e => {
                                                    handleDescriptionChange(e.target.value);
                                                }}
                                                onKeyDown={e => {
                                                    if (e.key === 'ArrowDown') {
                                                        e.preventDefault();
                                                        setSelectedIndex(prev => (prev + 1) % filteredProducts.length);
                                                    } else if (e.key === 'ArrowUp') {
                                                        e.preventDefault();
                                                        setSelectedIndex(prev => (prev - 1 + filteredProducts.length) % filteredProducts.length);
                                                    } else if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        // If filtered products has items and an index is selected
                                                        if (filteredProducts.length > 0 && selectedIndex >= 0 && selectedIndex < filteredProducts.length) {
                                                            handleProductClick(filteredProducts[selectedIndex]);
                                                            return;
                                                        }

                                                        // If it's a custom item (no match or user ignored matches)
                                                        if (itemTemp.descricao && itemTemp.descricao.length > 0) {
                                                            setOpenCombobox(false);
                                                            valueInputRef.current?.focus();
                                                        }
                                                    }
                                                }}
                                                ref={descriptionInputRef}
                                                placeholder="Digite para buscar ou descrever o item..."
                                                className="w-full"
                                                autoComplete="off"
                                            />
                                            {debouncedSearch.length >= 2 && filteredProducts.length === 0 && !itemTemp.produto_id && (
                                                <div className="absolute right-3 top-2.5 flex items-center gap-2" title="Item personalizado (não cadastrado)">
                                                    <span className="text-xs text-blue-500 font-medium hidden sm:inline-block">Item personalizado</span>
                                                    <Info className="h-5 w-5 text-blue-500 cursor-help" />
                                                </div>
                                            )}
                                        </div>
                                    </PopoverAnchor>
                                    <PopoverContent className="p-0 w-[400px]" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                                        <div className="max-h-[200px] overflow-y-auto p-1 bg-popover border rounded-md shadow-md">
                                            {filteredProducts.length > 0 ? (
                                                filteredProducts.map((p, index) => (
                                                    <div
                                                        key={p.id}
                                                        className={`px-3 py-2 cursor-pointer text-sm rounded-sm flex justify-between ${index === selectedIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"}`}
                                                        onClick={() => handleProductClick(p)}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{p.name}</span>
                                                            {p.description && <span className="text-xs text-muted-foreground">{p.description}</span>}
                                                        </div>
                                                        <span className="text-muted-foreground font-mono ml-2">R$ {Number(p.price).toFixed(2)}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-3 text-sm text-muted-foreground bg-blue-50/50 flex items-center gap-2">
                                                    <Info className="h-4 w-4 text-blue-500" />
                                                    <span>Item personalizado (não cadastrado)</span>
                                                </div>
                                            )}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="md:col-span-3 space-y-2">
                                <Label>Valor Unit.</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground">R$</span>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="pl-9"
                                        value={itemTemp.valor_unitario}
                                        onChange={e => setItemTemp({ ...itemTemp, valor_unitario: Number(e.target.value) })}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                quantityInputRef.current?.focus();
                                            }
                                        }}
                                        ref={valueInputRef}
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <Label>Qtd</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={itemTemp.quantidade}
                                    onChange={e => setItemTemp({ ...itemTemp, quantidade: Number(e.target.value) })}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddItem();
                                        }
                                    }}
                                    ref={quantityInputRef}
                                />
                            </div>

                            <div className="md:col-span-1">
                                <Button onClick={handleAddItem} className="w-full" title="Adicionar">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Lista de Itens */}
                        <div className="border rounded-md overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted text-muted-foreground font-medium">
                                    <tr>
                                        <th className="p-3 w-16 text-center">Foto</th>
                                        <th className="p-3">Descrição</th>
                                        <th className="p-3 w-24 text-center">Qtd</th>
                                        <th className="p-3 w-32 text-right">Valor Unit.</th>
                                        <th className="p-3 w-32 text-right">Total</th>
                                        <th className="p-3 w-16 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {formData.itens && formData.itens.length > 0 ? (
                                        formData.itens.map((item, index) => (
                                            <tr key={index} className="hover:bg-muted/10">
                                                <td className="p-3 text-center">
                                                    {item.image_url ? (
                                                        <img
                                                            src={item.image_url}
                                                            alt="Miniatura"
                                                            className="h-10 w-10 object-cover rounded-md cursor-pointer border hover:scale-105 transition-transform mx-auto"
                                                            onClick={() => setPreviewImage(item.image_url || null)}
                                                        />
                                                    ) : (
                                                        <div className="h-10 w-10 bg-muted rounded-md flex items-center justify-center text-muted-foreground mx-auto">
                                                            <ImageIcon className="h-5 w-5" />
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-3">{item.descricao}</td>
                                                <td className="p-3 text-center">
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        className="h-8 w-20 text-center mx-auto"
                                                        value={item.quantidade}
                                                        onChange={(e) => handleUpdateItemQuantity(index, parseInt(e.target.value) || 0)}
                                                    />
                                                </td>
                                                <td className="p-3 text-right">R$ {Number(item.valor_unitario).toFixed(2)}</td>
                                                <td className="p-3 text-right font-medium">R$ {Number(item.valor_total).toFixed(2)}</td>
                                                <td className="p-3 text-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 text-destructive hover:text-destructive/90"
                                                        onClick={() => handleRemoveItem(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                                Nenhum item adicionado.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot className="bg-muted/50 font-bold border-t">
                                    <tr>
                                        <td colSpan={4} className="p-3 text-right">Total Geral:</td>
                                        <td className="p-3 text-right text-primary text-base">
                                            R$ {formData.itens ? formData.itens.reduce((acc, i) => acc + i.valor_total, 0).toFixed(2) : '0.00'}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                    </CardContent>
                </Card>

                {/* Section 5: VALORES E OBSERVAÇÕES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* VALORES */}
                    <Card className="shadow-sm border-2">
                        <CardHeader className="bg-slate-50/50 pb-4">
                            <div className="flex items-center gap-2">
                                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">6</span>
                                <CardTitle className="text-lg">Valores</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-2">
                                <Label>Valor do Serviço (R$)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="0,00"
                                        className="pl-9"
                                        value={formData.valor_servico}
                                        onChange={(e) => setFormData({ ...formData, valor_servico: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Forma de Pagamento</Label>
                                <Select
                                    value={formData.forma_pagamento}
                                    onValueChange={(v) => setFormData({ ...formData, forma_pagamento: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                                        <SelectItem value="PIX">PIX</SelectItem>
                                        <SelectItem value="CARTAO_DEBITO">Cartão de Débito</SelectItem>
                                        <SelectItem value="CARTAO_CREDITO">Cartão de Crédito</SelectItem>
                                        <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* OBSERVAÇÕES */}
                    <Card className="shadow-sm border-2">
                        <CardHeader className="bg-slate-50/50 pb-4">
                            <div className="flex items-center gap-2">
                                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">7</span>
                                <CardTitle className="text-lg">Observações</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    Observações Internas <Badge variant="secondary" className="text-[9px] h-4">Privado</Badge>
                                </Label>
                                <RichTextEditor
                                    value={formData.observacoes_internas || ''}
                                    onChange={(content) => setFormData(prev => ({ ...prev, observacoes_internas: content }))}
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    Observações para o Cliente <Badge variant="outline" className="text-[9px] h-4">Visível</Badge>
                                </Label>
                                <RichTextEditor
                                    value={formData.observacoes_cliente || ''}
                                    onChange={(content) => setFormData(prev => ({ ...prev, observacoes_cliente: content }))}
                                    disabled={loading}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Section 7: AÇÕES */}
                <div className="flex flex-col md:flex-row gap-4 pt-4 pb-12">
                    <Button
                        className="flex-1 gap-2 h-12 text-lg active:scale-95 transition-transform"
                        size="lg"
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <>Salvando...</>
                        ) : (
                            <><Save className="h-5 w-5" /> Salvar Alterações</>
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        className="h-12 text-lg"
                        size="lg"
                        onClick={() => router.push('/modules/ordem_servico/pages/ordens')}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                </div>

            </div>

            {/* Business Rules Summary Footer */}
            <div className="bg-muted/30 p-6 rounded-xl border border-dashed text-sm text-muted-foreground grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    <p><strong>Edição:</strong> Apenas campos editáveis podem ser alterados. O cliente permanece fixo.</p>
                </div>
                <div className="flex gap-3">
                    <Info className="h-5 w-5 text-blue-500 shrink-0" />
                    <p><strong>Status:</strong> Apenas transições válidas são permitidas conforme regras de negócio.</p>
                </div>
                <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-500 shrink-0" />
                    <p><strong>Histórico:</strong> Todas as alterações são registradas no histórico da ordem.</p>
                </div>
            </div>

            {/* Image Preview Modal */}
            {previewImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
                    <div className="relative max-w-4xl max-h-[90vh] p-2 animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>

                        <button
                            className="absolute -top-4 -right-4 bg-white text-black rounded-full p-1 shadow-lg hover:bg-gray-200 transition-colors z-10"
                            onClick={() => setPreviewImage(null)}
                        >
                            <X className="h-6 w-6" />
                        </button>

                        <div className="relative flex items-center justify-center">
                            {/* Previous Button */}
                            {formData.equipamento_fotos && formData.equipamento_fotos.length > 1 && (
                                <button
                                    className="absolute left-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const currentPhotos = formData.equipamento_fotos || [];
                                        const currentIndex = currentPhotos.indexOf(previewImage);
                                        const prevIndex = (currentIndex - 1 + currentPhotos.length) % currentPhotos.length;
                                        setPreviewImage(currentPhotos[prevIndex]);
                                    }}
                                >
                                    <ChevronLeft className="h-8 w-8" />
                                </button>
                            )}

                            <img src={previewImage} alt="Full Preview" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />

                            {/* Next Button */}
                            {formData.equipamento_fotos && formData.equipamento_fotos.length > 1 && (
                                <button
                                    className="absolute right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const currentPhotos = formData.equipamento_fotos || [];
                                        const currentIndex = currentPhotos.indexOf(previewImage);
                                        const nextIndex = (currentIndex + 1) % currentPhotos.length;
                                        setPreviewImage(currentPhotos[nextIndex]);
                                    }}
                                >
                                    <ChevronRight className="h-8 w-8" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}