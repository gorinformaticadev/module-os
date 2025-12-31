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

interface Client {
    id: string;
    name: string;
    document: string;
    phone_primary: string;
    phone_secondary: string;
    address: string;
    is_active: boolean;
    created_at: string;
}

export default function OrdemServicoClientesPage() {
    const { toast } = useToast();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        document: '',
        phone_primary: '',
        phone_secondary: '',
        address: '',
        is_active: true
    });

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/ordem_servico/clientes');
            setClients(response.data);
        } catch (error) {
            toast({
                title: 'Erro ao carregar',
                description: 'Não foi possível carregar a lista de clientes.',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/ordem_servico/clientes', {
                params: { search: searchTerm }
            });
            setClients(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
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
            address: '',
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
            address: client.address || '',
            is_active: client.is_active
        });
        setEditingId(client.id);
        setIsDialogOpen(true);
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
                        <div className="flex gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por nome, documento ou telefone..."
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <Button variant="secondary" onClick={handleSearch}>
                                Buscar
                            </Button>
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
                                                        {client.address && (
                                                            <div className="flex items-center gap-1 text-xs text-muted-foreground truncate max-w-[200px]" title={client.address}>
                                                                <MapPin className="h-3 w-3" />
                                                                {client.address}
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

                            <div className="col-span-2 space-y-2">
                                <Label htmlFor="address">Endereço Completo</Label>
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Rua, Número, Bairro, Cidade - UF"
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
        </div>
    );
}
