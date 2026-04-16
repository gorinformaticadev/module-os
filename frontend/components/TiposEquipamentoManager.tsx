"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, AlertTriangle } from 'lucide-react';

import api from '@/lib/api';

// Componentes UI
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`rounded-xl border border-border/50 bg-card/90 dark:bg-card/60 backdrop-blur-sm text-card-foreground shadow-sm hover:shadow-md transition-all duration-300 ${className || ''}`}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={`flex flex-col space-y-1 p-3 ${className || ''}`} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={`text-sm font-semibold leading-none tracking-tight ${className || ''}`} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={`text-xs text-muted-foreground ${className || ''}`} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={`p-3 pt-0 ${className || ''}`} {...props} />
  )
);
CardContent.displayName = "CardContent";

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}>(({ className, variant = "default", size = "default", ...props }, ref) => {
  const baseClasses = "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 hover:shadow-md";
  const sizeClasses = size === "sm" ? "h-9 rounded-md px-3" : size === "lg" ? "h-11 rounded-md px-8" : size === "icon" ? "h-10 w-10" : "h-10 px-4 py-2";
  const variantClasses = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground hover:shadow-none",
    link: "text-primary underline-offset-4 hover:underline hover:shadow-none",
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses[variant]} ${className || ''}`}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

const useToast = () => ({
  toast: ({ title, description, variant }: { title: string; description?: string; variant?: string }) => {
    // Toast is handled by UI
  }
});

interface TipoEquipamento {
  id: string;
  nome: string;
  created_at: string;
}

export function TiposEquipamentoManager() {
  const { toast } = useToast();
  const [tipos, setTipos] = useState<TipoEquipamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nome: ''
  });

  useEffect(() => {
    fetchTipos();
  }, []);

  const fetchTipos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/ordem_servico/tipos-equipamento');
      setTipos(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erro ao carregar tipos de equipamento:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os tipos de equipamento.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome é obrigatório.',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (editingId) {
        await api.put(`/api/ordem_servico/tipos-equipamento/${editingId}`, formData);
        toast({ title: 'Tipo de equipamento atualizado com sucesso!' });
      } else {
        await api.post('/api/ordem_servico/tipos-equipamento', formData);
        toast({ title: 'Tipo de equipamento criado com sucesso!' });
      }

      setFormData({ nome: '' });
      setEditingId(null);
      setShowForm(false);
      fetchTipos();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao salvar o tipo de equipamento.',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (tipo: TipoEquipamento) => {
    setFormData({
      nome: tipo.nome
    });
    setEditingId(tipo.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir o tipo "${nome}"?`)) {
      return;
    }

    try {
      await api.delete(`/api/ordem_servico/tipos-equipamento/${id}`);
      toast({ title: 'Tipo de equipamento excluído com sucesso!' });
      fetchTipos();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o tipo de equipamento.',
        variant: 'destructive'
      });
    }
  };

  const handleCancel = () => {
    setFormData({ nome: '' });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Tipos de Equipamento
          <Button
            size="sm"
            onClick={() => setShowForm(true)}
            disabled={showForm}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Tipo
          </Button>
        </CardTitle>
        <CardDescription>
          Gerencie os tipos de equipamento disponíveis. Apenas o nome é necessário.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-2 p-2 border rounded-lg bg-muted/50">
            <div className="space-y-1">
              <label className="text-xs font-medium">Nome *</label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Servidor"
                className="h-7 text-xs"
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="h-6 text-xs px-2">
                <Save className="h-3 w-3 mr-1" />
                {editingId ? 'Atualizar' : 'Criar'}
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-6 text-xs px-2" onClick={handleCancel}>
                <X className="h-3 w-3 mr-1" />
                Cancelar
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-center py-3 text-muted-foreground text-xs">Carregando...</div>
        ) : tipos.length === 0 ? (
          <div className="text-center py-3 text-muted-foreground border-2 border-dashed rounded-lg">
            <AlertTriangle className="h-8 w-8 mx-auto mb-1 opacity-50" />
            <p className="text-xs font-medium">Nenhum tipo encontrado</p>
            <p className="text-xs opacity-75">Clique em "Novo Tipo"</p>
          </div>
        ) : (
          <div className="space-y-1 pr-2 custom-scrollbar" style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {tipos.map((tipo) => (
              <div key={tipo.id} className="flex items-center justify-between p-1.5 border rounded hover:bg-muted/50 transition-colors min-h-[32px]">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{tipo.nome}</span>
                  </div>
                </div>
                <div className="flex gap-2 ml-2">
                  <Edit2
                    className="h-4 w-4 text-muted-foreground hover:text-primary cursor-pointer transition-colors"
                    onClick={() => handleEdit(tipo)}
                  />
                  <Trash2
                    className="h-4 w-4 text-muted-foreground hover:text-destructive cursor-pointer transition-colors"
                    onClick={() => handleDelete(tipo.id, tipo.nome)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}