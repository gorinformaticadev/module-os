"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Plus, Edit, Trash2, Phone, MapPin, FileText, User, ClipboardList } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import ClientModal from '../../components/ClientModal';
import ClientEditModal from '../../components/ClientEditModal';

interface Client {
    id: string;
    name: string;
    document: string;
    phone_primary: string;
    phone_secondary: string;
    email?: string;
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
    const router = useRouter();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

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

    const openNew = () => {
        setIsClientModalOpen(true);
    };

    const goToOrders = () => {
        router.push('/modules/ordem_servico/pages/ordens');
    };

    const openEdit = (client: Client) => {
        setEditingClient(client);
        setIsEditModalOpen(true);
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

    const handleClientCreated = (client: Client) => {
        fetchClients(); // Recarregar lista
        toast({ title: 'Cliente cadastrado com sucesso!' });
    };

    const handleClientUpdated = (client: Client) => {
        fetchClients(); // Recarregar lista
        toast({ title: 'Cliente atualizado com sucesso!' });
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
                <div className="flex gap-2">
                    <Button onClick={goToOrders} variant="outline" className="gap-2">
                        <ClipboardList className="h-4 w-4" />
                        Ordens de Serviço
                    </Button>
                    <Button onClick={openNew} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Novo Cliente
                    </Button>
                </div>
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

            {/* Modal de Novo Cliente */}
            <ClientModal
                isOpen={isClientModalOpen}
                onClose={() => setIsClientModalOpen(false)}
                onClientCreated={handleClientCreated}
            />

            {/* Modal de Editar Cliente */}
            <ClientEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                client={editingClient}
                onClientUpdated={handleClientUpdated}
            />

            {/* Modal de Confirmação de Exclusão */}
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
