'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Printer, Loader2, Download } from 'lucide-react';
import { PrintTemplateA4 } from './PrintTemplateA4';
import { PrintTemplateThermal } from './PrintTemplateThermal';
import api, { API_URL } from '@/lib/api';
import { resolveTenantLogoSrc } from '@/lib/tenant-logo';
import { useAuth } from '@/contexts/AuthContext';

interface PrintModalProps {
    isOpen: boolean;
    onClose: () => void;
    ordemId: string | null;
    format: 'a4' | 'thermal';
}

export const PrintModal: React.FC<PrintModalProps> = ({ isOpen, onClose, ordemId, format }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [economicPrint, setEconomicPrint] = useState(false);
    const [data, setData] = useState<{
        ordem: any;
        tenantInfo: any;
        condicoesExecucao: string;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadPrintData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const [ordemRes, configRes] = await Promise.all([
                api.get(`/api/ordem_servico/ordens/${ordemId}`),
                api.get('/api/ordem_servico/config/settings')
            ]);

            const ordem = ordemRes.data;
            const condicoesConfig = configRes.data.find((c: { config_key: string, config_value: string }) => c.config_key === 'condicoes_execucao');
            const condicoesExecucao = condicoesConfig ? condicoesConfig.config_value : '';

            const logoUrl = resolveTenantLogoSrc(user?.tenant?.logoUrl);

            const tenantInfo = {
                name: user?.tenant?.nomeFantasia || 'Empresa',
                document: user?.tenant?.cnpjCpf || '',
                address: '',
                phone: user?.tenant?.telefone || '',
                email: user?.tenant?.email || '',
                logo_url: logoUrl
            };

            setData({ ordem, tenantInfo, condicoesExecucao });
        } catch (err) {
            console.error('Erro ao carregar dados de impressao:', err);
            setError('Nao foi possivel carregar os dados para impressao.');
        } finally {
            setLoading(false);
        }
    }, [ordemId, user]);

    useEffect(() => {
        if (isOpen && ordemId) {
            loadPrintData();
        } else {
            setData(null);
            setError(null);
            setEconomicPrint(false);
        }
    }, [isOpen, ordemId, loadPrintData]);

    useEffect(() => {
        if (format !== 'a4') {
            setEconomicPrint(false);
        }
    }, [format]);

    const handlePrint = () => {
        const printContent = document.getElementById('modal-print-area');
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
            .map(style => style.outerHTML)
            .join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Impressao OS #${data?.ordem?.numero}</title>
                    ${styles}
                    <style>
                        @media print {
                            @page {
                                margin: ${format === 'thermal' ? '0' : economicPrint ? '2mm' : '3mm'};
                                size: ${format === 'thermal' ? '80mm auto' : economicPrint ? 'A4 landscape' : 'A4 portrait'};
                            }
                            body { margin: 0; padding: 0; }
                            .no-print { display: none !important; }
                        }
                    </style>
                </head>
                <body>
                    <div id="print-content">
                        ${printContent.innerHTML}
                    </div>
                    <script>
                        window.onload = () => {
                            window.print();
                            window.onafterprint = () => window.close();
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleDownloadPDF = async () => {
        if (!ordemId) return;
        try {
            const pdfUrl = `${API_URL}/api/ordem_servico/ordens/${ordemId}/pdf${format === 'thermal' ? '?format=thermal' : ''}`;
            const response = await api.get(pdfUrl, { responseType: 'blob' });
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `OS_${data?.ordem?.numero || ordemId}${format === 'thermal' ? '-thermal' : ''}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (downloadError) {
            console.error('Erro ao baixar PDF:', downloadError);
            alert('Erro ao baixar PDF.');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
            <DialogContent className={`${format === 'thermal' ? 'max-w-xs' : economicPrint ? 'w-[calc(100vw-2rem)] max-w-7xl' : 'max-w-4xl'} max-h-[95vh] flex flex-col p-0 overflow-hidden`}>
                <DialogHeader className="p-4 border-b bg-muted/20 no-print">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <DialogTitle className="text-lg font-bold">
                            Previa de Impressao ({format === 'thermal' ? '80mm' : 'A4'})
                        </DialogTitle>
                        {format === 'a4' && (
                            <div className="flex items-center gap-2 rounded-md border bg-background/80 px-3 py-2">
                                <Checkbox
                                    id="economic-print"
                                    checked={economicPrint}
                                    onCheckedChange={(checked) => setEconomicPrint(checked === true)}
                                />
                                <Label htmlFor="economic-print" className="cursor-pointer text-sm">
                                    Impressao economica
                                </Label>
                            </div>
                        )}
                    </div>
                    <DialogDescription className="sr-only">
                        Visualize a ordem de servico antes de imprimir ou gerar o PDF.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-auto p-4 bg-gray-100 flex justify-center">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg shadow w-full">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                            <p className="text-sm text-muted-foreground">Preparando documento...</p>
                        </div>
                    ) : error ? (
                        <div className="p-8 bg-white rounded-lg shadow text-center w-full">
                            <p className="text-destructive font-medium">{error}</p>
                            <Button variant="outline" onClick={loadPrintData} className="mt-4">
                                Tentar novamente
                            </Button>
                        </div>
                    ) : data ? (
                        <div
                            id="modal-print-area"
                            className={`${format === 'thermal' ? 'w-[80mm]' : economicPrint ? 'w-[297mm]' : 'w-[210mm]'} bg-white shadow-lg origin-top scale-[0.55] sm:scale-[0.7] lg:scale-[0.85] 2xl:scale-100`}
                        >
                            {format === 'thermal' ? (
                                <PrintTemplateThermal
                                    ordem={data.ordem}
                                    tenantInfo={data.tenantInfo}
                                    condicoesExecucao={data.condicoesExecucao}
                                />
                            ) : (
                                <PrintTemplateA4
                                    ordem={data.ordem}
                                    tenantInfo={data.tenantInfo}
                                    condicoesExecucao={data.condicoesExecucao}
                                    economicMode={economicPrint}
                                />
                            )}
                        </div>
                    ) : null}
                </div>

                <DialogFooter className="p-2 border-t flex flex-row items-center justify-between gap-2 no-print bg-muted/5">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 h-8 text-[10px] border-red-200 text-red-500 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-all font-medium px-1"
                    >
                        CANCELAR
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={handleDownloadPDF}
                        disabled={loading || !data}
                        className="flex-1 h-8 gap-1 shadow-sm text-[10px] px-1"
                    >
                        <Download className="h-3 w-3" />
                        {format === 'a4' && economicPrint ? 'PDF padrao' : 'PDF'}
                    </Button>
                    <Button
                        onClick={handlePrint}
                        disabled={loading || !data}
                        className="flex-1 h-8 gap-1 shadow-md bg-primary hover:bg-primary/90 text-[10px] px-1"
                    >
                        <Printer className="h-3 w-3" />
                        IMPRIMIR
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
