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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
    Brain,
    Wrench,
    Clock,
    Package,
    AlertTriangle,
    History,
    Printer,
    Receipt,
    MessageCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import ProtectedModuleImage from '../../../components/ProtectedModuleImage';
import { ModulePageGuard } from '../../../components/ModulePageGuard';
import { RichTextEditor } from '../../../components/ui/rich-text-editor';
import { useAI } from '../../../hooks/useAI';

// Componentes de Retirada/Abandono
import { StatusTimeline } from '../../../components/StatusTimeline';
import { ConservacaoCard } from '../../../components/ConservacaoCard';
import { PagamentosModal } from '../../../components/PagamentosModal';
import { AlertasAbandonoModal } from '../../../components/AlertasAbandonoModal';
import { PrintModal } from '../../../components/PrintModal';
import { WhatsAppModal } from '../../../components/WhatsAppModal';

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
    CANCELADA = 7,
    RETIRADO = 8,
    ABANDONADO = 9
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
    [StatusOS.CANCELADA]: 'Cancelada',
    [StatusOS.RETIRADO]: 'Retirado',
    [StatusOS.ABANDONADO]: 'Abandonado'
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
    [StatusOS.FINALIZADA]: [StatusOS.RETIRADO, StatusOS.ABANDONADO],
    [StatusOS.CANCELADA]: [],
    [StatusOS.RETIRADO]: [],
    [StatusOS.ABANDONADO]: []
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

    // Estados dos modais de Retirada/Abandono
    const [isRetiradaModalOpen, setIsRetiradaModalOpen] = useState(false);
    const [isAbandonoModalOpen, setIsAbandonoModalOpen] = useState(false);

    // Print Modal State
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [printFormat, setPrintFormat] = useState<'a4' | 'thermal'>('a4');

    // WhatsApp Modal State
    const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

    const ordemId = searchParams.get('id');

    // Estados principais
    const [ordem, setOrdem] = useState<OrdemServico | null>(null);
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [tiposServico, setTiposServico] = useState<{ id: string; nome: string; is_default: boolean }[]>([]);
    const [tiposEquipamento, setTiposEquipamento] = useState<{ id: string; nome: string }[]>([]);

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
    const [sessionUploadedPhotos, setSessionUploadedPhotos] = useState<string[]>([]);
    const pendingUploadsStorageKey = ordemId ? `ordem_servico_pending_uploads:${ordemId}` : '';
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
        equipamento_fotos: [] as string[],
        garantia_dias: 0,
        // Formatação
        formatacao_so: '',
        formatacao_backup: false,
        formatacao_backup_descricao: '',
        formatacao_senha: '',
        equipamento_acessorios: '',
        equipamento_estado: '',
    });

    const readPendingUploadedPhotos = (): string[] => {
        if (!pendingUploadsStorageKey || typeof window === 'undefined') {
            return [];
        }

        try {
            const rawValue = window.sessionStorage.getItem(pendingUploadsStorageKey);
            if (!rawValue) {
                return [];
            }

            const parsedValue = JSON.parse(rawValue);
            if (!Array.isArray(parsedValue)) {
                return [];
            }

            return parsedValue
                .filter((value) => typeof value === 'string' && value.trim().length > 0)
                .map((value) => value.trim());
        } catch {
            return [];
        }
    };

    useEffect(() => {
        setSessionUploadedPhotos(readPendingUploadedPhotos());
    }, [pendingUploadsStorageKey]);

    useEffect(() => {
        if (!pendingUploadsStorageKey || typeof window === 'undefined') {
            return;
        }

        if (sessionUploadedPhotos.length === 0) {
            window.sessionStorage.removeItem(pendingUploadsStorageKey);
            return;
        }

        window.sessionStorage.setItem(
            pendingUploadsStorageKey,
            JSON.stringify(Array.from(new Set(sessionUploadedPhotos))),
        );
    }, [pendingUploadsStorageKey, sessionUploadedPhotos]);

    const cleanupServerUploads = async (urls: string[]) => {
        const uniqueUrls = Array.from(
            new Set(urls.filter((url) => typeof url === 'string' && url.trim().length > 0).map((url) => url.trim())),
        );
        if (uniqueUrls.length === 0) {
            return;
        }

        try {
            await api.post('/api/ordem_servico/ordens/uploads/cleanup', { urls: uniqueUrls });
        } catch {
            // Cleanup failure should not block user navigation.
        }
    };

    const clearPendingUploadState = () => {
        setSessionUploadedPhotos([]);
        if (pendingUploadsStorageKey && typeof window !== 'undefined') {
            window.sessionStorage.removeItem(pendingUploadsStorageKey);
        }
    };

    const handleCancelNavigation = async () => {
        await cleanupServerUploads(sessionUploadedPhotos);
        clearPendingUploadState();
        router.push('/modules/ordem_servico/pages/ordens');
    };

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
        fetchTiposEquipamento();
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
                const img = new window.Image();
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
        const sessionNewPhotos: string[] = [];

        try {
            for (let i = 0; i < files.length; i++) {
                const blob = await compressImage(files[i]);
                const formDataUpload = new FormData();
                formDataUpload.append('file', blob, `foto-${i}.jpg`);
                if (ordemId) {
                    formDataUpload.append('ordemId', ordemId);
                }
                if (ordem?.numero) {
                    formDataUpload.append('ordemNumero', ordem.numero);
                }

                const { data } = await api.post('/api/ordem_servico/ordens/upload', formDataUpload, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });

                newPhotos.push(data.url);
                sessionNewPhotos.push(data.url);
            }

            setFormData({ ...formData, equipamento_fotos: newPhotos });
            if (sessionNewPhotos.length > 0) {
                setSessionUploadedPhotos((prev) => Array.from(new Set([...prev, ...sessionNewPhotos])));
            }
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

    const handleRemovePhoto = async (index: number) => {
        const currentPhotos = [...(formData.equipamento_fotos || [])];
        const removedPhoto = currentPhotos[index];
        currentPhotos.splice(index, 1);
        setFormData({ ...formData, equipamento_fotos: currentPhotos });

        if (removedPhoto && sessionUploadedPhotos.includes(removedPhoto)) {
            setSessionUploadedPhotos((prev) => prev.filter((url) => url !== removedPhoto));
            await cleanupServerUploads([removedPhoto]);
        }
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
            const pendingUploadedPhotos = readPendingUploadedPhotos();

            setOrdem(ordemData);

            // Preencher formulário com dados da ordem
            setFormData({
                tipo_servico: ordemData.tipo_servico || '',
                prioridade: ordemData.prioridade || 'MEDIA',
                descricao: ordemData.descricao || '',
                status: ordemData.status ?? StatusOS.ABERTA,
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
                equipamento_fotos: Array.from(
                    new Set([...(ordemData.equipamento_fotos || []), ...pendingUploadedPhotos]),
                ),
                garantia_dias: ordemData.garantia_dias ?? 0,
                formatacao_so: ordemData.formatacao_so || '',
                formatacao_backup: !!ordemData.formatacao_backup,
                formatacao_backup_descricao: ordemData.formatacao_backup_descricao || '',
                formatacao_senha: ordemData.formatacao_senha || '',
                equipamento_acessorios: ordemData.equipamento_acessorios || '',
                equipamento_estado: ordemData.equipamento_estado || '',
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

    const fetchTiposEquipamento = async () => {
        try {
            const response = await api.get('/api/ordem_servico/ordens/tipos-equipamento');
            setTiposEquipamento(response.data);
        } catch (error) {
            console.error('Erro ao buscar tipos de equipamento:', error);
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

            const parsedValorServico = formData.valor_servico
                ? Number.parseFloat(String(formData.valor_servico).replace(',', '.'))
                : undefined;
            const valorServico = Number.isFinite(parsedValorServico as number) ? parsedValorServico : undefined;

            const parsedStatus = Number(formData.status);
            const statusValido = Number.isInteger(parsedStatus) && parsedStatus >= 0 && parsedStatus <= 9
                ? parsedStatus
                : undefined;
            const statusPayload = statusValido !== undefined && statusValido !== ordem.status
                ? statusValido
                : undefined;

            const parsedGarantiaDias = Number(formData.garantia_dias);
            const garantiaDias = Number.isInteger(parsedGarantiaDias) && parsedGarantiaDias >= 0
                ? parsedGarantiaDias
                : undefined;

            const origemSolicitacaoValida = Object.values(OrigemSolicitacao).includes(formData.origem_solicitacao)
                ? formData.origem_solicitacao
                : undefined;

            const dataPrevisao = formData.data_previsao
                ? new Date(`${formData.data_previsao}T00:00:00.000Z`)
                : undefined;
            const dataPrevisaoPayload = dataPrevisao && !Number.isNaN(dataPrevisao.getTime())
                ? dataPrevisao.toISOString()
                : undefined;

            const equipamentoFotosPayload = Array.isArray(formData.equipamento_fotos)
                ? formData.equipamento_fotos.filter((foto) => typeof foto === 'string' && foto.trim().length > 0)
                : undefined;

            const itensPayload = Array.isArray(formData.itens)
                ? formData.itens.map((item) => ({
                    produto_id: item.produto_id || undefined,
                    descricao: item.descricao,
                    valor_unitario: Number(item.valor_unitario || 0),
                    quantidade: Number(item.quantidade || 0),
                    valor_total: Number(item.valor_total || 0),
                }))
                : undefined;

            // Create payload matching the DTO structure exactly
            const payload = {
                tipo_servico: formData.tipo_servico,
                prioridade: formData.prioridade,
                descricao: formData.descricao,
                observacoes_internas: formData.observacoes_internas || undefined,
                observacoes_cliente: formData.observacoes_cliente || undefined,
                valor_servico: valorServico,
                origem_solicitacao: origemSolicitacaoValida,
                status: statusPayload,
                usuario_responsavel_id: formData.usuario_responsavel_id || undefined,

                // Equipment fields
                equipamento_tipo: formData.equipamento_tipo || undefined,
                equipamento_marca: formData.equipamento_marca || undefined,
                equipamento_modelo: formData.equipamento_modelo || undefined,
                equipamento_serie: formData.equipamento_serie || undefined,
                equipamento_acessorios: formData.equipamento_acessorios || undefined,
                equipamento_estado: formData.equipamento_estado || undefined,

                // Formatting fields
                formatacao_so: formData.formatacao_so || undefined,
                formatacao_backup: typeof formData.formatacao_backup === 'boolean'
                    ? formData.formatacao_backup
                    : undefined,
                formatacao_backup_descricao: formData.formatacao_backup_descricao || undefined,
                formatacao_senha: formData.formatacao_senha || undefined,
                garantia_dias: garantiaDias,
                forma_pagamento: formData.forma_pagamento || undefined,
                data_previsao: dataPrevisaoPayload,
                motivo_cancelamento: formData.motivo_cancelamento || undefined,
                equipamento_fotos: equipamentoFotosPayload,
                laudo_tecnico: formData.laudo_tecnico || undefined,
                itens: itensPayload,
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
            clearPendingUploadState();
            await loadOrdem();
        } catch (error: any) {
            console.error('Erro ao salvar OS:', error);
            const backendMessage = error?.response?.data?.message;
            const msg = Array.isArray(backendMessage)
                ? backendMessage.filter((item) => typeof item === 'string' && item.trim().length > 0).join(' | ')
                : typeof backendMessage === 'string' && backendMessage.trim().length > 0
                    ? backendMessage
                    : typeof error?.response?.data?.error === 'string' && error.response.data.error.trim().length > 0
                        ? error.response.data.error
                        : 'Erro ao processar sua solicitação.';
            toast({
                title: 'Erro ao Salvar',
                description: msg,
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    // Refs for handlers to avoid stale closures in useEffect
    const handleSaveRef = React.useRef(handleSave);

    // Update ref whenever handleSave changes
    useEffect(() => {
        handleSaveRef.current = handleSave;
    }, [handleSave]);

    const handlePrintA4 = () => {
        if (!ordemId) return;
        setPrintFormat('a4');
        setIsPrintModalOpen(true);
    };

    const handlePrint80mm = () => {
        if (!ordemId) return;
        setPrintFormat('thermal');
        setIsPrintModalOpen(true);
    };

    const handleWhatsApp = () => {
        if (!ordem?.cliente?.phone_primary) {
            toast({
                title: 'Erro',
                description: 'O cliente não possui um telefone principal cadastrado.',
                variant: 'destructive',
            });
            return;
        }
        setIsWhatsAppModalOpen(true);
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Save: Ctrl + S or Cmd + S
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSaveRef.current();
            }

            // Print A4: Ctrl + P or Cmd + P
            if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'p') {
                e.preventDefault();
                handlePrintA4();
            }

            // Print 80mm: Ctrl + Shift + P or Cmd + Shift + P
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'p' || e.key === 'P')) {
                e.preventDefault();
                handlePrint80mm();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (loadingOrdem) {
        return (
            <ModulePageGuard resource="orders" action="edit">
                <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-skin-text-muted">Carregando ordem de serviço...</p>
                </div>
            </div>
            </ModulePageGuard>
        );
    }

    if (!ordem) {
        return (
            <ModulePageGuard resource="orders" action="edit">
                <div className="p-6">
                <div className="text-center">
                    <h2 className="mb-4 text-2xl font-bold text-skin-danger">Ordem não encontrada</h2>
                    <Button onClick={handleCancelNavigation}>
                        Voltar para Lista
                    </Button>
                </div>
            </div>
            </ModulePageGuard>
        );
    }

    return (
        <ModulePageGuard resource="orders" action="edit">
            <div className="p-4 md:p-8 w-full mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCancelNavigation}
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
                    <Button variant="outline" onClick={() => handleWhatsApp()} title="Enviar WhatsApp" className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        WhatsApp
                    </Button>
                    <Button variant="outline" onClick={() => handlePrintA4()} title="Imprimir em A4 (Ctrl+P)">
                        <Printer className="h-4 w-4 mr-2" />
                        A4
                    </Button>
                    <Button variant="outline" onClick={() => handlePrint80mm()} title="Imprimir em 80mm (Ctrl+Shift+P)">
                        <Receipt className="h-4 w-4 mr-2" />
                        80mm
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleCancelNavigation}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="gap-2 bg-primary hover:bg-primary/90"
                        title="Salvar (Ctrl+S)"
                    >
                        {loading ? 'Salvando...' : <><Save className="h-4 w-4" /> Salvar Alterações</>}
                    </Button>
                </div>
            </div>

            <div className="space-y-6">

                {/* Alerta: Status Terminal (Somente Leitura) */}
                {(ordem.status === StatusOS.RETIRADO || ordem.status === StatusOS.ABANDONADO || ordem.status === StatusOS.CANCELADA) && (
                    <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                        <div>
                            <p className="font-medium text-amber-800">
                                Esta ordem está com status {STATUS_LABELS[ordem.status]} (somente leitura)
                            </p>
                            <p className="text-sm text-amber-600">
                                Ordens com status terminal não podem ser editadas.
                            </p>
                        </div>
                    </div>
                )}

                {/* Seção: Ações de Finalização (quando status = FINALIZADA) */}
                {ordem.status === StatusOS.FINALIZADA && (
                    <Card className="shadow-sm border-2 border-emerald-200 bg-emerald-50/30">
                        <CardHeader className="bg-emerald-100/50 pb-4">
                            <div className="flex items-center gap-2">
                                <Package className="h-5 w-5 text-emerald-600" />
                                <CardTitle className="text-lg text-emerald-800">Ações de Finalização</CardTitle>
                                <TooltipProvider>
                                    <Popover>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <PopoverTrigger asChild>
                                                    <Info className="h-4 w-4 text-emerald-600 cursor-pointer hover:text-emerald-700 transition-colors" />
                                                </PopoverTrigger>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>A ordem está finalizada. Registre a retirada pelo cliente ou inicie o processo de abandono.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        <PopoverContent className="w-80 p-3 text-sm">
                                            <p>A ordem está finalizada. Registre a retirada pelo cliente ou inicie o processo de abandono.</p>
                                        </PopoverContent>
                                    </Popover>
                                </TooltipProvider>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Conservação Card */}
                                <ConservacaoCard
                                    ordemId={ordemId!}
                                    valorServico={parseFloat(formData.valor_servico) || 0}
                                />

                                {/* Botões de Ação */}
                                <div className="space-y-4">
                                    <div className="p-4 bg-white rounded-lg border shadow-sm space-y-3">
                                        <h4 className="font-semibold text-sm flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                            Registrar Retirada
                                        </h4>
                                        <p className="text-xs text-muted-foreground">
                                            O cliente compareceu para retirar o equipamento. Registre os pagamentos e finalize a entrega.
                                        </p>
                                        <Button
                                            className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                                            onClick={() => setIsRetiradaModalOpen(true)}
                                        >
                                            <Package className="h-4 w-4" />
                                            Registrar Retirada
                                        </Button>
                                    </div>

                                    <div className="p-4 bg-white rounded-lg border shadow-sm space-y-3">
                                        <h4 className="font-semibold text-sm flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                                            Processo de Abandono
                                        </h4>
                                        <p className="text-xs text-muted-foreground">
                                            O cliente não compareceu? Inicie o processo de abandono com 3 tentativas de contato.
                                        </p>
                                        <Button
                                            variant="outline"
                                            className="w-full gap-2 border-amber-300 text-amber-700 hover:bg-amber-50"
                                            onClick={() => setIsAbandonoModalOpen(true)}
                                        >
                                            <Clock className="h-4 w-4" />
                                            Alertas de Abandono
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}



                {/* Section 1: CLIENTE (FIXO) - FULL WIDTH */}
                <Card className="shadow-sm border-2 w-full">
                    <CardHeader className="bg-skin-background-elevated/50 pb-4">
                        <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                            <CardTitle className="text-lg">Cliente</CardTitle>
                            <TooltipProvider>
                                <Popover>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <PopoverTrigger asChild>
                                                <Info className="h-4 w-4 cursor-pointer text-skin-text-muted transition-colors hover:text-skin-text" />
                                            </PopoverTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Informações do cliente (não editável)</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <PopoverContent className="w-80 p-3 text-sm">
                                        <p>Informações do cliente (não editável)</p>
                                    </PopoverContent>
                                </Popover>
                            </TooltipProvider>
                        </div>
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
                                                <ProtectedModuleImage
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
                    <CardHeader className="bg-skin-background-elevated/50 pb-4">
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
                                onValueChange={(v: string) => setFormData({ ...formData, status: parseInt(v) })}
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
                                onValueChange={(v: string) => setFormData({ ...formData, usuario_responsavel_id: v === 'NONE' ? '' : v })}
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
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, data_previsao: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Garantia (dias)</Label>
                            <Input
                                type="number"
                                placeholder="0"
                                min="0"
                                value={formData.garantia_dias || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, garantia_dias: parseInt(e.target.value) || 0 })}
                            />
                            <p className="text-[10px] text-muted-foreground italic">Período de garantia em dias para o serviço realizado.</p>
                        </div>

                        {/* Campos Condicionais: FORMATAÇÃO */}
                        {formData.tipo_servico === 'Formatação' && (
                            <div className="col-span-full mt-4 p-4 border-2 border-primary/20 bg-primary/5 rounded-lg space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Wrench className="h-4 w-4 text-primary" />
                                    <h4 className="text-sm font-semibold uppercase tracking-wider">Detalhes da Formatação</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <Label>Sistema Operacional</Label>
                                        <Select value={formData.formatacao_so} onValueChange={(v: string) => setFormData({ ...formData, formatacao_so: v })}>
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
                                            onValueChange={(v: string) => setFormData({ ...formData, formatacao_backup: v === "sim" })}
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
                                            onValueChange={(v: string) => {
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
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, formatacao_senha: e.target.value })}
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
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, formatacao_backup_descricao: e.target.value })}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

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
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, motivo_cancelamento: e.target.value })}
                                />
                            </div>
                        )}

                    </CardContent>
                </Card>



                {/* Section 4: EQUIPAMENTO (Moved UP) */}
                <Card className="shadow-sm border-2">
                    <CardHeader className="bg-skin-background-elevated/50 pb-4">
                        <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
                            <CardTitle className="text-lg">Equipamento</CardTitle>
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
                                        {tiposEquipamento.map((tipo) => (
                                            <SelectItem key={tipo.id} value={tipo.nome}>
                                                {tipo.nome}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Marca</Label>
                                <Input
                                    placeholder="Dell, HP, Samsung..."
                                    value={formData.equipamento_marca}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, equipamento_marca: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Modelo</Label>
                                <Input
                                    placeholder="Vostro 3500, Galaxy S21..."
                                    value={formData.equipamento_modelo}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, equipamento_modelo: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Número de Série</Label>
                                <Input
                                    placeholder="S/N ou IMEI..."
                                    value={formData.equipamento_serie}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, equipamento_serie: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-dashed">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    Acessórios / Outros
                                    <span className="text-[10px] text-muted-foreground font-normal">(Cabos, capas, carregador...)</span>
                                </Label>
                                <Textarea
                                    placeholder="Descreva o que foi deixado com o equipamento..."
                                    className="min-h-[80px] resize-none"
                                    value={formData.equipamento_acessorios}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, equipamento_acessorios: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    Estado de Entrega / Obs
                                    <span className="text-[10px] text-muted-foreground font-normal">(Riscos, trincas, marcas...)</span>
                                </Label>
                                <Textarea
                                    placeholder="Descreva o estado físico do equipamento..."
                                    className="min-h-[80px] resize-none"
                                    value={formData.equipamento_estado}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, equipamento_estado: e.target.value })}
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
                                    <ProtectedModuleImage
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
                            <div className="flex h-24 w-24 items-center justify-center rounded-md border-2 border-dashed border-skin-border hover:bg-skin-surface-hover transition-colors">
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
                                            <Plus className="h-6 w-6 text-skin-text-muted" />
                                            <span className="mt-1 text-[10px] font-medium text-skin-text-muted">Add</span>
                                        </>
                                    )}
                                </label>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Section 3: LAUDO TÉCNICO (Moved DOWN) */}
                <Card className="shadow-sm border-2">
                    <CardHeader className="bg-skin-background-elevated/50 pb-4">
                        <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">4</span>
                            <CardTitle className="text-lg">Laudo Técnico</CardTitle>
                            <TooltipProvider>
                                <Popover>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <PopoverTrigger asChild>
                                                <Info className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
                                            </PopoverTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Diagnóstico e observações técnicas</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <PopoverContent className="w-80 p-3 text-sm">
                                        <p>Diagnóstico e observações técnicas</p>
                                    </PopoverContent>
                                </Popover>
                            </TooltipProvider>
                        </div>
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
                        <div className="grid grid-cols-1 items-end gap-4 rounded-lg border border-dashed border-skin-border bg-skin-background-elevated/50 p-4 md:grid-cols-12">

                            {/* Descrição com Autocomplete */}
                            <div className="md:col-span-6 space-y-2 relative">
                                <Label>Descrição do Item / Produto</Label>
                                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                    <PopoverAnchor asChild>
                                        <div className="relative">
                                            <Input
                                                value={itemTemp.descricao}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                    handleDescriptionChange(e.target.value);
                                                }}
                                                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
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
                                    <PopoverContent className="p-0 w-[400px]" align="start" onOpenAutoFocus={(e: Event) => e.preventDefault()}>
                                        <div className="max-h-[200px] overflow-y-auto rounded-md border border-skin-border bg-skin-surface p-1 shadow-md">
                                            {filteredProducts.length > 0 ? (
                                                filteredProducts.map((p, index) => (
                                                    <div
                                                        key={p.id}
                                                        className={`flex justify-between rounded-sm px-3 py-2 text-sm cursor-pointer ${index === selectedIndex ? "bg-skin-surface-hover text-skin-text" : "hover:bg-skin-surface-hover hover:text-skin-text"}`}
                                                        onClick={() => handleProductClick(p)}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{p.name}</span>
                                                            {p.description && <span className="text-xs text-skin-text-muted">{p.description}</span>}
                                                        </div>
                                                        <span className="ml-2 font-mono text-skin-text-muted">R$ {Number(p.price).toFixed(2)}</span>
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
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setItemTemp({ ...itemTemp, valor_unitario: Number(e.target.value) })}
                                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
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
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setItemTemp({ ...itemTemp, quantidade: Number(e.target.value) })}
                                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
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
                                <thead className="bg-skin-background-elevated text-skin-text-muted font-medium">
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
                                            <tr key={index} className="hover:bg-skin-surface-hover/60">
                                                <td className="p-3 text-center">
                                                    {item.image_url ? (
                                                        <ProtectedModuleImage
                                                            src={item.image_url}
                                                            alt="Miniatura"
                                                            className="h-10 w-10 object-cover rounded-md cursor-pointer border hover:scale-105 transition-transform mx-auto"
                                                            onClick={() => setPreviewImage(item.image_url || null)}
                                                        />
                                                    ) : (
                                                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-skin-background-elevated text-skin-text-muted">
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
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateItemQuantity(index, parseInt(e.target.value) || 0)}
                                                    />
                                                </td>
                                                <td className="p-3 text-right">R$ {Number(item.valor_unitario).toFixed(2)}</td>
                                                <td className="p-3 text-right font-medium">R$ {Number(item.valor_total).toFixed(2)}</td>
                                                <td className="p-3 text-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 text-skin-danger hover:text-skin-danger/90"
                                                        onClick={() => handleRemoveItem(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-skin-text-muted">
                                                Nenhum item adicionado.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot className="border-t border-skin-border bg-skin-background-elevated/60 font-bold">
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
                    <CardHeader className="bg-skin-background-elevated/50 pb-4">
                            <div className="flex items-center gap-2">
                                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">6</span>
                                <CardTitle className="text-lg">Valores</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-2">
                                <Label>Valor do Serviço (R$)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-skin-text-muted" />
                                    <Input
                                        placeholder="0,00"
                                        className="pl-9"
                                        value={formData.valor_servico}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, valor_servico: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Forma de Pagamento</Label>
                                <Select
                                    value={formData.forma_pagamento}
                                    onValueChange={(v: string) => setFormData({ ...formData, forma_pagamento: v })}
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
                    <CardHeader className="bg-skin-background-elevated/50 pb-4">
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

                {/* Histórico de Status */}
                <Card className="shadow-sm border-2">
                    <CardHeader className="bg-skin-background-elevated/50 pb-4">
                        <div className="flex items-center gap-2">
                            <History className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg">Histórico de Status</CardTitle>
                            <TooltipProvider>
                                <Popover>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <PopoverTrigger asChild>
                                                <Info className="h-4 w-4 cursor-pointer text-skin-text-muted transition-colors hover:text-skin-text" />
                                            </PopoverTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Linha do tempo com todas as alterações de status desta ordem</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <PopoverContent className="w-80 p-3 text-sm">
                                        <p>Linha do tempo com todas as alterações de status desta ordem</p>
                                    </PopoverContent>
                                </Popover>
                            </TooltipProvider>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {/* Print Modal */}
                        <PrintModal
                            isOpen={isPrintModalOpen}
                            onClose={() => setIsPrintModalOpen(false)}
                            ordemId={ordemId}
                            format={printFormat}
                        />

                        <StatusTimeline ordemId={ordemId!} />
                    </CardContent>
                </Card>

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
                        onClick={handleCancelNavigation}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                </div>

            </div>

            {/* Business Rules Summary Footer */}
            <div className="grid grid-cols-1 gap-6 rounded-xl border border-dashed border-skin-border bg-skin-background-elevated/50 p-6 text-sm text-skin-text-muted md:grid-cols-3">
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

                            <ProtectedModuleImage
                                src={previewImage}
                                alt="Full Preview"
                                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                            />

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

            {/* Modais de Retirada e Abandono */}
            {ordem && (
                <>
                    <PagamentosModal
                        isOpen={isRetiradaModalOpen}
                        onClose={() => setIsRetiradaModalOpen(false)}
                        ordem={{
                            id: ordem.id,
                            numero: ordem.numero,
                            valor_servico: parseFloat(formData.valor_servico) || 0
                        }}
                        onSuccess={() => {
                            setIsRetiradaModalOpen(false);
                            loadOrdem();
                        }}
                    />
                    <AlertasAbandonoModal
                        isOpen={isAbandonoModalOpen}
                        onClose={() => setIsAbandonoModalOpen(false)}
                        ordemId={ordem.id}
                        ordemNumero={ordem.numero}
                        onSuccess={() => {
                            setIsAbandonoModalOpen(false);
                            loadOrdem();
                        }}
                    />
                </>
            )}

            <PrintModal
                isOpen={isPrintModalOpen}
                onClose={() => setIsPrintModalOpen(false)}
                ordemId={ordemId || ''}
                format={printFormat}
            />

            <WhatsAppModal
                isOpen={isWhatsAppModalOpen}
                onClose={() => setIsWhatsAppModalOpen(false)}
                ordem={ordem ? {
                    ...ordem,
                    ...formData,
                    // Garante que campos numéricos sejam passados corretamente
                    valor_servico: typeof formData.valor_servico === 'string'
                        ? parseFloat(formData.valor_servico.replace(',', '.') || '0')
                        : formData.valor_servico,
                    status: Number(formData.status),
                    // Mantém o cliente original pois não está no formData de edição direta
                    cliente: ordem.cliente
                } as any : null}
            />
            </div>
        </ModulePageGuard>
    );
}
