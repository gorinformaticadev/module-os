'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PrintTemplateA4 } from '../../../components/PrintTemplateA4';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api, { API_URL } from '@/lib/api';

interface OrdemServico {
    id: string;
    numero: string;
    data_abertura: string;
    data_previsao?: string;
    status: number;
    garantia_dias?: number;
    cliente?: any;
    tipo_servico: string;
    descricao: string;
    observacoes_cliente?: string;
    itens?: any[];
    valor_servico: number;
    equipamento_tipo?: string;
    equipamento_marca?: string;
    equipamento_modelo?: string;
    equipamento_serie?: string;
}

interface TenantInfo {
    name: string;
    document?: string;
    address?: string;
    phone?: string;
    email?: string;
    logo_url?: string;
}

export default function PrintPreviewPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const ordemId = searchParams.get('id');

    const [loading, setLoading] = useState(true);
    const [ordem, setOrdem] = useState<OrdemServico | null>(null);
    const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
    const [condicoesExecucao, setCondicoesExecucao] = useState<string>('');
    const [error, setError] = useState<string>('');

    useEffect(() => {
        if (!ordemId) {
            setError('ID da ordem não fornecido');
            setLoading(false);
            return;
        }

        loadPrintData();
    }, [ordemId, user]);

    const loadPrintData = async () => {
        try {
            setLoading(true);

            const ordemResponse = await api.get(`/api/ordem_servico/ordens/${ordemId}`);
            setOrdem(ordemResponse.data);

            if (user?.tenant) {
                const logoUrl = user.tenant.logoUrl
                    ? `${API_URL}/uploads/logos/${user.tenant.logoUrl}?t=${Date.now()}`
                    : undefined;

                setTenantInfo({
                    name: user.tenant.nomeFantasia || 'Empresa',
                    document: user.tenant.cnpjCpf || '',
                    address: '',
                    phone: user.tenant.telefone || '',
                    email: user.tenant.email || '',
                    logo_url: logoUrl
                });
            } else {
                setTenantInfo({
                    name: 'Empresa',
                    document: '',
                    address: '',
                    phone: '',
                    email: '',
                    logo_url: undefined
                });
            }

            try {
                const configResponse = await api.get('/api/ordem_servico/config/settings');
                const condicoesConfig = configResponse.data.find((c: any) => c.config_key === 'condicoes_execucao');
                if (condicoesConfig) {
                    setCondicoesExecucao(condicoesConfig.config_value);
                }
            } catch (err) {
                console.log('Condições de execução não encontradas');
            }

        } catch (err: any) {
            console.error('Erro ao carregar dados:', err);
            setError('Erro ao carregar dados da ordem de serviço');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Carregando dados para impressão...</p>
                </div>
            </div>
        );
    }

    if (error || !ordem || !tenantInfo) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4 text-destructive">Erro</h2>
                    <p className="text-muted-foreground mb-4">{error || 'Dados não encontrados'}</p>
                    <Button onClick={() => router.push('/modules/ordem_servico/pages/ordens')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar para Ordens
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="no-print sticky top-0 z-50 bg-background border-b p-4 flex justify-between items-center shadow-sm">
                <Button variant="outline" onClick={() => router.push('/modules/ordem_servico/pages/ordens')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                </Button>
                <div className="flex gap-2">
                    <Button onClick={handlePrint} className="gap-2">
                        <Printer className="h-4 w-4" />
                        Imprimir
                    </Button>
                </div>
            </div>

            <PrintTemplateA4
                ordem={ordem}
                tenantInfo={tenantInfo}
                condicoesExecucao={condicoesExecucao}
            />

            <style jsx global>{`
                @media print {
                    body {
                        margin: 0;
                        padding: 0;
                    }
                    
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
