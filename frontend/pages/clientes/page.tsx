"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Search, Plus, Edit, Trash2, Phone, MapPin, FileText } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';

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
        is_active: true
    });

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchClients();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, statusFilter]);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (searchTerm) params.search = searchTerm;
            if (statusFilter !== 'all') params.status = statusFilter === 'active' ? 'true' : 'false';

            const response = await api.get('/api/ordem_servico/clientes', { params });
            setClients(response.data);
        } catch (error) {
            console.error(error);
            toast({
                title: 'Erro ao carregar',
                description: 'Não foi possível carregar a lista de clientes.',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
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
            is_active: true
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
            is_active: client.is_active
        });
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
        if (!formData.name || !formData.phone_primary) {
            toast({
                title: 'Campos obrigatórios',
                description: 'Preencha o Nome e o Telefone Principal.',
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
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{client.name}</span>
                                                        {client.document && (
                                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                <FileText className="h-3 w-3" />
                                                                {client.document}
                                                            </div>
                                                        )}
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
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
                        <DialogDescription>
                            {editingId ? 'Atualize as informações do cliente.' : 'Preencha os dados obrigatórios para cadastrar.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-2">
                                <Label htmlFor="name">Nome Completo *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Nome do cliente"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="document">CPF / CNPJ</Label>
                                <Input
                                    id="document"
                                    value={formData.document}
                                    onChange={(e) => setFormData({ ...formData, document: maskDocument(e.target.value) })}
                                    placeholder="000.000.000-00"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="active">Status</Label>
                                <div className="flex items-center space-x-2 h-10">
                                    <Switch
                                        id="active"
                                        checked={formData.is_active}
                                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                    />
                                    <Label htmlFor="active">{formData.is_active ? 'Ativo' : 'Inativo'}</Label>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone1">Telefone Principal *</Label>
                                <Input
                                    id="phone1"
                                    value={formData.phone_primary}
                                    onChange={(e) => setFormData({ ...formData, phone_primary: maskPhone(e.target.value) })}
                                    placeholder="(00) 00000-0000"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone2">Telefone Secundário</Label>
                                <Input
                                    id="phone2"
                                    value={formData.phone_secondary}
                                    onChange={(e) => setFormData({ ...formData, phone_secondary: maskPhone(e.target.value) })}
                                    placeholder="(00) 00000-0000"
                                />
                            </div>

                            <div className="col-span-2">
                                <Label className="font-semibold text-lg">Endereço</Label>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="zip">CEP</Label>
                                <Input
                                    id="zip"
                                    value={formData.address_zip}
                                    onChange={(e) => setFormData({ ...formData, address_zip: e.target.value })}
                                    placeholder="00000-000"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="street">Rua</Label>
                                <Input
                                    id="street"
                                    value={formData.address_street}
                                    onChange={(e) => setFormData({ ...formData, address_street: e.target.value })}
                                    placeholder="Rua / Avenida"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="number">Número</Label>
                                <Input
                                    id="number"
                                    value={formData.address_number}
                                    onChange={(e) => setFormData({ ...formData, address_number: e.target.value })}
                                    placeholder="123"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="neighborhood">Bairro</Label>
                                <Input
                                    id="neighborhood"
                                    value={formData.address_neighborhood}
                                    onChange={(e) => setFormData({ ...formData, address_neighborhood: e.target.value })}
                                    placeholder="Bairro"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="complement">Complemento</Label>
                                <Input
                                    id="complement"
                                    value={formData.address_complement}
                                    onChange={(e) => setFormData({ ...formData, address_complement: e.target.value })}
                                    placeholder="Apto, Sala, etc."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="city">Cidade</Label>
                                <Input
                                    id="city"
                                    value={formData.address_city}
                                    onChange={(e) => setFormData({ ...formData, address_city: e.target.value })}
                                    placeholder="Cidade"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="state">UF</Label>
                                <Input
                                    id="state"
                                    value={formData.address_state}
                                    onChange={(e) => setFormData({ ...formData, address_state: e.target.value })}
                                    placeholder="UF"
                                    maxLength={2}
                                />
                            </div>
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
                    </DialogHeader>
                    <div className="py-4 text-center">
                        <Trash2 className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <p className="text-muted-foreground">
                            Tem certeza que deseja excluir este cliente?
                            <br />
                            Essa ação não pode ser desfeita.
                        </p>
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
