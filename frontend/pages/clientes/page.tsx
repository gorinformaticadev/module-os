"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Search, Plus, Edit, Trash2, Phone, MapPin, FileText, Camera, Loader2, User } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface Client {
    id: string;
    name: string;
    document: string;
    phone_primary: string;
    phone_secondary: string;
    // New Address Fields
    address_zip?: string;
    address_street?: string;
    address_number?: string;
    address_complement?: string;
    address_neighborhood?: string;
    address_city?: string;
    address_state?: string;
    observations?: string;
    image_url?: string;
    is_active: boolean;
    created_at: string;
}

export default function OrdemServicoClientesPage() {
    const { toast } = useToast();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [compressing, setCompressing] = useState(false);
    const [showAddress, setShowAddress] = useState(false);
    const [validationErrors, setValidationErrors] = useState({
        phone_primary: '',
        document: ''
    });

    const [formData, setFormData] = useState({
        name: '',
        document: '',
        phone_primary: '',
        phone_secondary: '',
        address_zip: '',
        address_street: '',
        address_number: '',
        address_complement: '',
        address_neighborhood: '',
        address_city: '',
        address_state: '',
        observations: '',
        image_url: '',
        is_active: true
    });

        useEffect(() => {
    if (!searchTerm || searchTerm.trim().length < 2) {
        setClients([]);
        return;
    }

    const timer = setTimeout(() => {
        fetchClients(searchTerm.trim());
    }, 500);

    return () => clearTimeout(timer);
    }, [searchTerm]);


    const fetchClients = async (term: string) => {
    try {
        const response = await api.get(
        '/api/ordem_servico/clientes',
        { params: { search: term, status: true } }
        );
        setClients(response.data || []);
    } catch (error) {
        console.error(error);
        setClients([]);
    }
    };


    const handleClearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
    };

    const maskPhone = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/^(\d{2})(\d)/g, '($1) $2')
            .replace(/(\d)(\d{4})$/, '$1-$2')
            .slice(0, 15);
    };

    const maskDocument = (value: string) => {
        const v = value.replace(/\D/g, '');
        if (v.length <= 11) {
            return v
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
                .slice(0, 14);
        }
        return v
            .replace(/^(\d{2})(\d)/, '$1.$2')
            .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d)/, '.$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .slice(0, 18);
    };

    const validatePhone = (phone: string) => {
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length < 10) {
            return 'Telefone deve ter pelo menos 10 dígitos';
        }
        if (cleanPhone.length > 11) {
            return 'Telefone deve ter no máximo 11 dígitos';
        }
        return '';
    };

    const validateDocument = (document: string) => {
        if (!document) return '';

        const cleanDoc = document.replace(/\D/g, '');

        if (cleanDoc.length === 11) {
            // Validação CPF
            if (!/^\d{11}$/.test(cleanDoc)) return 'CPF inválido';

            // Verifica se todos os dígitos são iguais
            if (/^(\d)\1{10}$/.test(cleanDoc)) return 'CPF inválido';

            // Validação dos dígitos verificadores
            let sum = 0;
            for (let i = 0; i < 9; i++) {
                sum += parseInt(cleanDoc.charAt(i)) * (10 - i);
            }
            let digit1 = 11 - (sum % 11);
            if (digit1 > 9) digit1 = 0;

            sum = 0;
            for (let i = 0; i < 10; i++) {
                sum += parseInt(cleanDoc.charAt(i)) * (11 - i);
            }
            let digit2 = 11 - (sum % 11);
            if (digit2 > 9) digit2 = 0;

            if (parseInt(cleanDoc.charAt(9)) !== digit1 || parseInt(cleanDoc.charAt(10)) !== digit2) {
                return 'CPF inválido';
            }
        } else if (cleanDoc.length === 14) {
            // Validação CNPJ
            if (!/^\d{14}$/.test(cleanDoc)) return 'CNPJ inválido';

            // Verifica se todos os dígitos são iguais
            if (/^(\d)\1{13}$/.test(cleanDoc)) return 'CNPJ inválido';

            // Validação dos dígitos verificadores
            const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
            const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

            let sum = 0;
            for (let i = 0; i < 12; i++) {
                sum += parseInt(cleanDoc.charAt(i)) * weights1[i];
            }
            let digit1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);

            sum = 0;
            for (let i = 0; i < 13; i++) {
                sum += parseInt(cleanDoc.charAt(i)) * weights2[i];
            }
            let digit2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);

            if (parseInt(cleanDoc.charAt(12)) !== digit1 || parseInt(cleanDoc.charAt(13)) !== digit2) {
                return 'CNPJ inválido';
            }
        } else {
            return 'Documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)';
        }

        return '';
    };

    const compressImage = (file: File): Promise<Blob> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const max_size = 400; // Avatar size

                    if (width > height) {
                        if (width > max_size) {
                            height *= max_size / width;
                            width = max_size;
                        }
                    } else {
                        if (height > max_size) {
                            width *= max_size / height;
                            height = max_size;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        if (blob) resolve(blob);
                    }, 'image/jpeg', 0.7);
                };
            };
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setCompressing(true);
            const blob = await compressImage(file);

            const formDataUpload = new FormData();
            formDataUpload.append('file', blob, file.name || 'avatar.jpg');

            const { data } = await api.post('/api/ordem_servico/clientes/upload', formDataUpload, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setFormData({ ...formData, image_url: data.url });

            toast({
                title: 'Sucesso',
                description: 'Imagem processada com sucesso.',
                variant: 'default'
            });
        } catch (error) {
            console.error('Erro no upload:', error);
            toast({
                title: 'Erro na imagem',
                description: 'Não foi possível enviar a imagem.',
                variant: 'destructive'
            });
        } finally {
            setCompressing(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            document: '',
            phone_primary: '',
            phone_secondary: '',
            address_zip: '',
            address_street: '',
            address_number: '',
            address_complement: '',
            address_neighborhood: '',
            address_city: '',
            address_state: '',
            observations: '',
            image_url: '',
            is_active: true
        });
        setShowAddress(false);
        setValidationErrors({
            phone_primary: '',
            document: ''
        });
        setEditingId(null);
    };

    const openNew = () => {
        resetForm();
        setIsDialogOpen(true);
    };

    const openEdit = (client: Client) => {
        setFormData({
            name: client.name,
            document: client.document || '',
            phone_primary: client.phone_primary,
            phone_secondary: client.phone_secondary || '',
            address_zip: client.address_zip || '',
            address_street: client.address_street || '',
            address_number: client.address_number || '',
            address_complement: client.address_complement || '',
            address_neighborhood: client.address_neighborhood || '',
            address_city: client.address_city || '',
            address_state: client.address_state || '',
            observations: client.observations || '',
            image_url: client.image_url || '',
            is_active: client.is_active
        });
        setShowAddress(!!(client.address_zip || client.address_street || client.address_city));
        setEditingId(client.id);
        setIsDialogOpen(true);
        setIsDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        setDeleteId(id);
        setIsDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;

        try {
            await api.delete(`/api/ordem_servico/clientes/${deleteId}`);
            toast({ title: 'Cliente excluído com sucesso' });
            fetchClients();
            setIsDeleteOpen(false);
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Erro ao excluir cliente.';
            toast({
                title: 'Erro ao excluir',
                description: msg,
                variant: 'destructive'
            });
        }
    };

    const handleSave = async () => {
        // Validações
        const phoneError = validatePhone(formData.phone_primary);
        const documentError = validateDocument(formData.document);

        setValidationErrors({
            phone_primary: phoneError,
            document: documentError
        });

        if (!formData.name || !formData.phone_primary) {
            toast({
                title: 'Campos obrigatórios',
                description: 'Preencha o Nome e o Telefone Principal.',
                variant: 'destructive'
            });
            return;
        }

        if (phoneError || documentError) {
            toast({
                title: 'Dados inválidos',
                description: 'Corrija os erros nos campos destacados.',
                variant: 'destructive'
            });
            return;
        }

        try {
            setSaving(true);
            if (editingId) {
                await api.put(`/api/ordem_servico/clientes/${editingId}`, formData);
                toast({ title: 'Cliente atualizado com sucesso!' });
            } else {
                await api.post('/api/ordem_servico/clientes', formData);
                toast({ title: 'Cliente cadastrado com sucesso!' });
            }
            setIsDialogOpen(false);
            fetchClients();
        } catch (error) {
            toast({
                title: 'Erro ao salvar',
                description: 'Ocorreu um erro ao salvar o cliente.',
                variant: 'destructive'
            });
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (client: Client) => {
        try {
            await api.put(`/api/ordem_servico/clientes/${client.id}`, {
                ...client,
                is_active: !client.is_active
            });
            toast({ title: `Cliente ${!client.is_active ? 'ativado' : 'inativado'} com sucesso` });
            fetchClients();
        } catch (error) {
            toast({ title: 'Erro ao alterar status', variant: 'destructive' });
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Clientes</h1>
                    <p className="text-muted-foreground mt-2">
                        Gerencie sua carteira de clientes
                    </p>
                </div>
                <Button onClick={openNew} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Cliente
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div>
                            <CardTitle>Base de Clientes</CardTitle>
                            <CardDescription>
                                Visualize e busque clientes cadastrados
                            </CardDescription>
                        </div>
                        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por nome, cpf ou telefone..."
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full md:w-32">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="active">Ativos</SelectItem>
                                    <SelectItem value="inactive">Inativos</SelectItem>
                                </SelectContent>
                            </Select>

                            {(searchTerm || statusFilter !== 'all') && (
                                <Button variant="ghost" onClick={handleClearFilters} className="px-3" title="Limpar Filtros">
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-slate-900">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Nome / Documento</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Contato</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                                                <div className="flex justify-center items-center gap-2">
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                                    Carregando clientes...
                                                </div>
                                            </td>
                                        </tr>
                                    ) : clients.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                                                <div className="flex flex-col items-center gap-3">
                                                    <p className="text-lg font-semibold">Nenhum cliente encontrado</p>
                                                    <p className="text-sm max-w-sm mx-auto">
                                                        Não há clientes cadastrados no sistema. Clique em "Novo Cliente" para começar.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        clients.map((client) => (
                                            <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                                            {client.image_url ? (
                                                                <img src={client.image_url} alt={client.name} className="h-full w-full object-cover" />
                                                            ) : (
                                                                <User className="h-5 w-5 text-primary" />
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="font-semibold truncate text-slate-900 dark:text-slate-100">{client.name}</span>
                                                            {client.document && (
                                                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                                                                    <FileText className="h-2.5 w-2.5" />
                                                                    {client.document}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-1 text-sm">
                                                            <Phone className="h-3 w-3" />
                                                            {client.phone_primary}
                                                        </div>
                                                        {(client.address_street || client.address_city || client.address_state) && (
                                                            <div className="flex items-center gap-1 text-xs text-muted-foreground truncate max-w-[200px]" title={`${client.address_street || ''}${client.address_street && client.address_number ? ', ' : ''}${client.address_number || ''}`}>
                                                                <MapPin className="h-3 w-3" />
                                                                {client.address_city || ''}{client.address_city && client.address_state ? ' - ' : ''}{client.address_state || ''}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge
                                                        variant={client.is_active ? 'default' : 'secondary'}
                                                        className="cursor-pointer"
                                                        onClick={() => handleToggleStatus(client)}
                                                    >
                                                        {client.is_active ? 'Ativo' : 'Inativo'}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => openEdit(client)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(client.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
                        <DialogDescription>
                            {editingId ? 'Atualize as informações do cliente.' : 'Preencha os dados obrigatórios para cadastrar.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-6">
                        {/* Imagem de Perfil */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative group">
                                <div className="h-32 w-32 rounded-3xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50 shadow-inner">
                                    {formData.image_url ? (
                                        <>
                                            <img src={formData.image_url} alt="Logo" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full" onClick={() => setFormData({ ...formData, image_url: '' })}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-1 text-muted-foreground">
                                            {compressing ? (
                                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                            ) : (
                                                <>
                                                    <User className="h-12 w-12 opacity-20" />
                                                    <span className="text-[10px] font-medium uppercase tracking-tighter text-slate-400">Sem Foto</span>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="secondary"
                                    className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full border-4 border-background shadow-lg hover:scale-110 transition-transform active:scale-95"
                                    onClick={() => document.getElementById('image-upload')?.click()}
                                    disabled={compressing}
                                >
                                    <Camera className="h-4 w-4" />
                                </Button>
                                <input
                                    id="image-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground text-center uppercase tracking-widest font-bold">Foto do Cliente</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-500">Nome Completo *</Label>
                                <Input
                                    id="name"
                                    className="h-11 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
                                    value={formData.name}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Nome do cliente"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="document" className="text-xs font-bold uppercase tracking-wider text-slate-500">CPF / CNPJ</Label>
                                <Input
                                    id="document"
                                    className={`h-11 bg-slate-50/50 dark:bg-slate-900/50 ${validationErrors.document ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-800'}`}
                                    value={formData.document}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        const maskedValue = maskDocument(e.target.value);
                                        setFormData({ ...formData, document: maskedValue });
                                        const error = validateDocument(maskedValue);
                                        setValidationErrors(prev => ({ ...prev, document: error }));
                                    }}
                                    placeholder="000.000.000-00"
                                />
                                {validationErrors.document && (
                                    <p className="text-[10px] text-red-500 font-bold ml-1">{validationErrors.document}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Status da Conta</Label>
                                <div className="flex items-center space-x-3 h-11 px-3 rounded-lg bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                                    <Switch
                                        id="active"
                                        checked={formData.is_active}
                                        onCheckedChange={(checked: boolean) => setFormData({ ...formData, is_active: checked })}
                                    />
                                    <Label htmlFor="active" className="text-sm cursor-pointer">{formData.is_active ? 'Ativo' : 'Inativo'}</Label>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone1" className="text-xs font-bold uppercase tracking-wider text-slate-500">Telefone Principal *</Label>
                                <Input
                                    id="phone1"
                                    className={`h-11 bg-slate-50/50 dark:bg-slate-900/50 ${validationErrors.phone_primary ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-800'}`}
                                    value={formData.phone_primary}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        const maskedValue = maskPhone(e.target.value);
                                        setFormData({ ...formData, phone_primary: maskedValue });
                                        const error = validatePhone(maskedValue);
                                        setValidationErrors(prev => ({ ...prev, phone_primary: error }));
                                    }}
                                    placeholder="(00) 00000-0000"
                                />
                                {validationErrors.phone_primary && (
                                    <p className="text-[10px] text-red-500 font-bold ml-1">{validationErrors.phone_primary}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone2" className="text-xs font-bold uppercase tracking-wider text-slate-500">Telefone Secundário</Label>
                                <Input
                                    id="phone2"
                                    className="h-11 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
                                    value={formData.phone_secondary}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, phone_secondary: maskPhone(e.target.value) })}
                                    placeholder="(00) 00000-0000"
                                />
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="observations" className="text-xs font-bold uppercase tracking-wider text-slate-500">Observações Gerais</Label>
                                <Textarea
                                    id="observations"
                                    className="min-h-[100px] bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 resize-none"
                                    value={formData.observations}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, observations: e.target.value })}
                                    placeholder="Notas sobre o cliente, preferências, histórico relevante..."
                                />
                            </div>

                            <div className="md:col-span-2 pt-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full flex justify-between items-center group hover:bg-slate-100 dark:hover:bg-slate-800"
                                    onClick={() => setShowAddress(!showAddress)}
                                >
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Informações de Endereço</span>
                                    {showAddress ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </Button>
                            </div>

                            {showAddress && (
                                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-2">
                                        <Label htmlFor="zip" className="text-xs font-bold uppercase tracking-wider text-slate-500">CEP</Label>
                                        <Input
                                            id="zip"
                                            className="h-11 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
                                            value={formData.address_zip}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, address_zip: e.target.value })}
                                            placeholder="00000-000"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="street" className="text-xs font-bold uppercase tracking-wider text-slate-500">Rua</Label>
                                        <Input
                                            id="street"
                                            className="h-11 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
                                            value={formData.address_street}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, address_street: e.target.value })}
                                            placeholder="Rua / Avenida"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="number" className="text-xs font-bold uppercase tracking-wider text-slate-500">Número</Label>
                                        <Input
                                            id="number"
                                            className="h-11 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
                                            value={formData.address_number}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, address_number: e.target.value })}
                                            placeholder="123"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="complement" className="text-xs font-bold uppercase tracking-wider text-slate-500">Complemento</Label>
                                        <Input
                                            id="complement"
                                            className="h-11 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
                                            value={formData.address_complement}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, address_complement: e.target.value })}
                                            placeholder="Apto, Sala, etc."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="neighborhood" className="text-xs font-bold uppercase tracking-wider text-slate-500">Bairro</Label>
                                        <Input
                                            id="neighborhood"
                                            className="h-11 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
                                            value={formData.address_neighborhood}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, address_neighborhood: e.target.value })}
                                            placeholder="Bairro"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="city" className="text-xs font-bold uppercase tracking-wider text-slate-500">Cidade</Label>
                                        <Input
                                            id="city"
                                            className="h-11 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
                                            value={formData.address_city}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, address_city: e.target.value })}
                                            placeholder="Cidade"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="state" className="text-xs font-bold uppercase tracking-wider text-slate-500">UF</Label>
                                        <Input
                                            id="state"
                                            className="h-11 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
                                            value={formData.address_state}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, address_state: e.target.value })}
                                            placeholder="UF"
                                            maxLength={2}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirmar Exclusão</DialogTitle>
                        <DialogDescription className="text-center pt-4">
                            Tem certeza que deseja excluir este cliente?
                            <br />
                            Essa ação não pode ser desfeita.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2 text-center">
                        <Trash2 className="h-12 w-12 text-red-500 mx-auto" />
                    </div>
                    <DialogFooter className="flex gap-2 justify-center sm:justify-center">
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Excluir Cliente</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
