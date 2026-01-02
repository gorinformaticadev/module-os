"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Search, Plus, Edit, RefreshCw, UploadCloud, Image as ImageIcon, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function OrdemServicoProdutosPage() {
    const { toast } = useToast();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Dialog State
    const [isOpen, setIsOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    // Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('ALL'); // ALL | ACTIVE | INACTIVE
    const [filterType, setFilterType] = useState<string>('ALL'); // ALL | PRODUCT | SERVICE

    const [formData, setFormData] = useState({
        code: '',
        name: '',
        price: '0,00',
        cost_price: '0,00',
        profit_margin: '', // New field
        description: '',
        type: 'PRODUCT',
        image_url: '',
        is_active: true
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/ordem_servico/produtos');
            console.log('🔍 DEBUG: Produtos recebidos:', response.data);
            
            // Debug das URLs de imagem
            response.data.forEach((product: any) => {
                if (product.image_url) {
                    console.log(`🖼️ Produto ${product.code}: URL = "${product.image_url}"`);
                }
            });
            
            setProducts(response.data);
        } catch (error) {
            console.error('Erro get produtos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenNew = () => {
        setEditingId(null);
        setFormData({
            code: '',
            name: '',
            price: '0,00',
            cost_price: '0,00',
            profit_margin: '',
            description: '',
            type: 'PRODUCT',
            image_url: '',
            is_active: true
        });
        setIsOpen(true);
    };

    const generateRandomCode = () => {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        setFormData(prev => ({ ...prev, code: `ITEM-${randomNum}` }));
    };

    const formatCurrencyInput = (value: string) => {
        const digits = value.replace(/\D/g, '');
        if (!digits) return '0,00';
        const number = parseFloat(digits) / 100;
        return number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const parseMoney = (val: string) => {
        if (!val) return 0;
        return parseFloat(val.replace(/\./g, '').replace(',', '.'));
    };

    const formatMoney = (val: number) => {
        return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = formatCurrencyInput(e.target.value);
        const cost = parseMoney(val);

        let newPrice = formData.price;
        const margin = parseFloat(formData.profit_margin.replace(',', '.')) || 0;

        if (margin && cost > 0) {
            const priceVal = cost * (1 + margin / 100);
            newPrice = formatMoney(priceVal);
        }

        setFormData(prev => ({ ...prev, cost_price: val, price: newPrice }));
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = formatCurrencyInput(e.target.value);
        const price = parseMoney(val);
        const cost = parseMoney(formData.cost_price);

        let newMargin = formData.profit_margin;

        if (cost > 0 && price > 0) {
            const marginVal = ((price - cost) / cost) * 100;
            newMargin = marginVal.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
        }

        setFormData(prev => ({ ...prev, price: val, profit_margin: newMargin }));
    };

    const handleMarginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const margin = parseFloat(val.replace(',', '.'));
        const cost = parseMoney(formData.cost_price);

        let newPrice = formData.price;

        if (!isNaN(margin) && cost > 0) {
            const priceVal = cost * (1 + margin / 100);
            newPrice = formatMoney(priceVal);
        }

        setFormData(prev => ({ ...prev, profit_margin: val, price: newPrice }));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const data = new FormData();
            data.append('file', file);

            try {
                setUploading(true);
                const res = await api.post('/api/ordem_servico/produtos/upload', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setFormData(prev => ({ ...prev, image_url: res.data.url }));
                toast({ title: 'Imagem enviada com sucesso!' });
            } catch (err) {
                toast({ title: 'Erro no upload', variant: 'destructive' });
            } finally {
                setUploading(false);
            }
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            const priceVal = parseFloat(formData.price.replace(/\./g, '').replace(',', '.'));
            const costVal = parseFloat(formData.cost_price.replace(/\./g, '').replace(',', '.')); // New

            if (isNaN(priceVal)) {
                toast({ title: 'Preço inválido', variant: 'destructive' });
                return;
            }

            const payload = {
                ...formData,
                price: priceVal,
                cost_price: costVal
            };

            if (editingId) {
                await api.put(`/api/ordem_servico/produtos/${editingId}`, payload);
                toast({ title: 'Atualizado com sucesso!' });
            } else {
                await api.post('/api/ordem_servico/produtos', payload);
                toast({ title: 'Criado com sucesso!' });
            }
            setIsOpen(false);
            fetchProducts();
        } catch (error: any) {
            toast({
                title: 'Erro',
                description: error.response?.data?.message || 'Erro ao salvar',
                variant: 'destructive'
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id: string) => {
        setDeleteId(id);
        setIsDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/api/ordem_servico/produtos/${deleteId}`);
            toast({ title: 'Item excluído com sucesso!' });
            fetchProducts();
        } catch (error) {
            toast({ title: 'Erro ao excluir', variant: 'destructive' });
        } finally {
            setIsDeleteOpen(false);
            setDeleteId(null);
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = (
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.code.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const matchesStatus =
            filterStatus === 'ALL' ? true :
                filterStatus === 'ACTIVE' ? p.is_active :
                    !p.is_active;

        const matchesType =
            filterType === 'ALL' ? true :
                p.type === filterType;

        return matchesSearch && matchesStatus && matchesType;
    });

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Produtos e Serviços</h1>
                    <p className="text-muted-foreground mt-2">
                        Gerenciamento de catálogo
                    </p>
                </div>

                <Button
                    onClick={handleOpenNew}
                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <Plus className="h-4 w-4" />
                    CADASTRAR NOVO ITEM
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Lista de Itens</CardTitle>
                    <div className="flex flex-col md:flex-row gap-4 mt-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Pesquisar por Nome ou Código..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <div className="w-full md:w-48">
                            <select
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value)}
                            >
                                <option value="ALL">Todos Status</option>
                                <option value="ACTIVE">Ativos</option>
                                <option value="INACTIVE">Inativos</option>
                            </select>
                        </div>
                        <div className="w-full md:w-48">
                            <select
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={filterType}
                                onChange={e => setFilterType(e.target.value)}
                            >
                                <option value="ALL">Todos Tipos</option>
                                <option value="PRODUCT">Produtos</option>
                                <option value="SERVICE">Serviços</option>
                            </select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="p-4 text-center">Carregando...</div>
                    ) : (
                        <div className="border rounded-md">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted">
                                    <tr>
                                        <th className="p-3 w-16">Img</th>
                                        <th className="p-3">Código</th>
                                        <th className="p-3">Nome</th>
                                        <th className="p-3">Tipo</th>
                                        <th className="p-3">Preço</th>
                                        <th className="p-3">Status</th>
                                        <th className="p-3 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map(p => (
                                        <tr key={p.id} className="border-t hover:bg-muted/50">
                                            <td className="p-3">
                                                {p.image_url && p.image_url.trim() !== '' ? (
                                                    <img 
                                                        src={p.image_url} 
                                                        alt="Prod" 
                                                        className="h-8 w-8 object-cover rounded bg-muted" 
                                                        onError={(e) => {
                                                            console.error('Image load error:', p.image_url);
                                                            e.currentTarget.style.display = 'none';
                                                            e.currentTarget.nextElementSibling.style.display = 'flex';
                                                        }}
                                                        onLoad={() => console.log('Image loaded successfully:', p.image_url)}
                                                    />
                                                ) : null}
                                                <div className="h-8 w-8 bg-muted rounded flex items-center justify-center" style={{display: (p.image_url && p.image_url.trim() !== '') ? 'none' : 'flex'}}>
                                                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                            </td>
                                            <td className="p-3 font-mono">{p.code}</td>
                                            <td className="p-3">{p.name}</td>
                                            <td className="p-3">
                                                <Badge variant="outline" className={p.type === 'SERVICE' ? 'border-orange-500 text-orange-600' : 'border-blue-500 text-blue-600'}>
                                                    {p.type === 'SERVICE' ? 'Serviço' : 'Produto'}
                                                </Badge>
                                            </td>
                                            <td className="p-3 text-green-600 font-bold">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price)}
                                            </td>
                                            <td className="p-3">
                                                <Badge variant={p.is_active ? 'default' : 'secondary'}>
                                                    {p.is_active ? 'Ativo' : 'Inativo'}
                                                </Badge>
                                            </td>
                                            <td className="p-3 text-right">
                                                <Button size="icon" variant="ghost" onClick={() => {
                                                    setEditingId(p.id);
                                                    setFormData({
                                                        code: p.code,
                                                        name: p.name,
                                                        price: new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(p.price),
                                                        cost_price: new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(p.cost_price || 0),
                                                        profit_margin: (p.cost_price > 0 && p.price > 0)
                                                            ? (((Number(p.price) - Number(p.cost_price)) / Number(p.cost_price)) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })
                                                            : '',
                                                        description: p.description,
                                                        type: p.type || 'PRODUCT',
                                                        image_url: p.image_url || '',
                                                        is_active: p.is_active
                                                    });
                                                    setIsOpen(true);
                                                }}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(p.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredProducts.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                                Nenhum produto cadastrado.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Editar' : 'Novo'} Item</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">

                        {/* Tipo: Produto ou Serviço */}
                        <div className="flex items-center justify-between border p-3 rounded-md">
                            <Label className="text-base">É um Serviço?</Label>
                            <div className="flex items-center gap-2">
                                <span className={formData.type === 'PRODUCT' ? 'font-bold' : 'text-muted-foreground'}>Produto</span>
                                <Switch
                                    checked={formData.type === 'SERVICE'}
                                    onCheckedChange={c => setFormData({ ...formData, type: c ? 'SERVICE' : 'PRODUCT' })}
                                />
                                <span className={formData.type === 'SERVICE' ? 'font-bold' : 'text-muted-foreground'}>Serviço</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Código <span className="text-red-500">*</span></Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                                        placeholder="Código"
                                    />
                                    <Button variant="outline" size="icon" onClick={generateRandomCode} title="Gerar Código">
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Nome <span className="text-red-500">*</span></Label>
                                <Input
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Nome do item"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Preço Custo (R$)</Label>
                                <Input
                                    value={formData.cost_price}
                                    onChange={handleCostChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Lucro (%)</Label>
                                <Input
                                    value={formData.profit_margin}
                                    onChange={handleMarginChange}
                                    placeholder="%"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Preço Venda (R$) <span className="text-red-500">*</span></Label>
                                <Input
                                    value={formData.price}
                                    onChange={handlePriceChange}
                                    className="font-bold"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Imagem (Opcional)</Label>
                            <div className="flex items-center gap-4">
                                {formData.image_url && formData.image_url.trim() !== '' && (
                                    <div className="relative">
                                        <img 
                                            src={formData.image_url} 
                                            alt="Preview" 
                                            className="h-16 w-16 object-cover rounded border" 
                                            onError={(e) => {
                                                console.error('Preview image load error:', formData.image_url);
                                                e.currentTarget.style.display = 'none';
                                            }}
                                            onLoad={() => console.log('Preview image loaded:', formData.image_url)}
                                        />
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="destructive"
                                            className="absolute -top-2 -right-2 h-6 w-6"
                                            onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                                        >
                                            ×
                                        </Button>
                                    </div>
                                )}
                                <div className="flex-1">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        disabled={uploading}
                                    />
                                    {uploading && <p className="text-xs text-muted-foreground mt-1">Enviando...</p>}
                                    {formData.image_url && formData.image_url.trim() !== '' && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            URL: {formData.image_url}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Input
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <Switch
                                id="status"
                                checked={formData.is_active}
                                onCheckedChange={c => setFormData({ ...formData, is_active: c })}
                            />
                            <Label htmlFor="status">Ativo no Sistema</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={saving || uploading}>Salvar</Button>
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
                            Tem certeza que deseja excluir este item permanentemente?
                            <br />
                            Essa ação não pode ser desfeita.
                        </p>
                    </div>
                    <DialogFooter className="flex gap-2 justify-center sm:justify-center">
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Excluir Item</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
