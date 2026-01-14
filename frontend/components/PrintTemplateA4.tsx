'use client';

import React from 'react';

interface ItemOrdem {
    descricao: string;
    valor_unitario: number;
    quantidade: number;
    valor_total: number;
}

interface Cliente {
    name: string;
    phone_primary: string;
    phone_secondary?: string;
    email?: string;
    document?: string;
}

interface OrdemServico {
    id: string;
    numero: string;
    data_abertura: string;
    data_previsao?: string;
    status: number;
    garantia_dias?: number;
    cliente?: Cliente;
    tipo_servico: string;
    descricao: string;
    observacoes_cliente?: string;
    itens?: ItemOrdem[];
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

interface PrintTemplateA4Props {
    ordem: OrdemServico;
    tenantInfo: TenantInfo;
    condicoesExecucao?: string;
}

const STATUS_LABELS: Record<number, string> = {
    0: 'Orçamento',
    1: 'Aberto',
    2: 'Em Análise',
    3: 'Aguardando Cliente',
    4: 'Aguardando Peças',
    5: 'Em Execução',
    6: 'Finalizado',
    7: 'Cancelado'
};

export const PrintTemplateA4: React.FC<PrintTemplateA4Props> = ({ ordem, tenantInfo, condicoesExecucao }) => {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR')}`;
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    return (
        <div className="print-container">
            <style jsx>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 15mm;
                    }
                    
                    body {
                        font-family: Arial, sans-serif;
                        font-size: 11pt;
                        color: #000 !important;
                        background: white !important;
                    }
                    
                    .no-print {
                        display: none !important;
                    }

                    .print-container {
                        width: 100%;
                        max-width: 210mm;
                        margin: 0 auto;
                        background: white !important;
                        color: #000 !important;
                    }
                }

                @media screen {
                    .print-container {
                        width: 210mm;
                        min-height: 297mm;
                        margin: 10px auto;
                        padding: 8mm;
                        background: white !important;
                        color: #000 !important;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                    }
                }

                /* Header com bordas sutis */
                .header-box {
                    border: 1px solid #a1a1a1ff;
                    padding: 10px;
                    margin-bottom: 1px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-radius: 4px;
                }

                .logo-section {
                    width: 140px;
                    height: 70px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-right: 1px solid #e0e0e0;
                    padding-right: 20px;
                }

                .logo-section img {
                    max-width: 130px;
                    max-height: 65px;
                    object-fit: contain;
                }

                .company-data {
                    flex: 1;
                    padding: 0 20px;
                    text-align: center;
                }

                .company-name {
                    font-size: 16px;
                    font-weight: bold;
                    color: #000 !important;
                    margin-bottom: 6px;
                }

                .company-info {
                    font-size: 10px;
                    color: #682525ff !important;
                    line-height: 1.5;
                }

                .contact-section {
                    text-align: right;
                    font-size: 10px;
                    color: #682525ff !important;
                    min-width: 140px;
                }

                /* Título da OS */
                .os-title-bar {
                    background: #d8d7d7ff;
                    border: 1px solid #a5a5a5ff;
                    border-radius: 4px;
                    padding: 10px 15px;
                    margin-bottom: 15px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .os-title {
                    font-size: 14px;
                    font-weight: bold;
                    color: #000 !important;
                }

                .os-emission {
                    font-size: 10px;
                    color: #666 !important;
                }

                /* Tabela de informações */
                .info-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 15px;
                    border: 1px solid #a5a5a5ff;
                    border-radius: 4px;
                    overflow: hidden;
                }

                .info-table th {
                    background: #f8f8f8;
                    border: 1px solid #dfdedeff;
                    padding: 8px 12px;
                    font-size: 10px;
                    font-weight: 600;
                    color: #333 !important;
                    text-align: center;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }

                .info-table td {
                    border: 1px solid #dfdedeff;
                    padding: 1px 12px;
                    font-size: 10px;
                    color: #000 !important;
                    text-align: center;
                }

                /* Seções */
                .section-header {
                    background: #d8d7d7ff;
                    border: 1px solid #a5a5a5ff;
                    border-bottom: none;
                    border-radius: 4px 4px 0 0;
                    padding: 3px 12px;
                    font-size: 10px;
                    font-weight: 600;
                    color: #333 !important;
                    margin-top: 1px;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }

                .section-content {
                    border: 1px solid #e0e0e0;
                    border-radius: 0 0 4px 4px;
                    padding: 12px;
                    font-size: 11px;
                    color: #000 !important;
                    line-height: 1.6;
                    min-height: 40px;
                }

                /* Tabela de itens */
                .items-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 5px;
                    border: 1px solid #868585ff;
                    border-radius: 4px;
                    overflow: hidden;
                }

                .items-table thead {
                    background: #a39e9eff;
                }

                .items-table th {
                    border: 1px solid #e0e0e0;
                    padding: 8px 10px;
                    font-size: 10px;
                    font-weight: 600;
                    color: #333 !important;
                    text-align: left;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }

                .items-table td {
                    border: 1px solid #e0e0e0;
                    padding: 8px 10px;
                    font-size: 10px;
                    color: #000 !important;
                }

                .items-table tbody tr:hover {
                    background: #fafafa;
                }

                .items-table tfoot {
                    background: #f5f5f5;
                }

                .items-table tfoot td {
                    font-weight: 600;
                    font-size: 11px;
                    border-top: 2px solid #d0d0d0;
                }

                /* Assinaturas */
                .signatures {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 40px;
                    margin-top: 60px;
                    page-break-inside: avoid;
                }

                .signature-box {
                    text-align: center;
                }

                .signature-line {
                    border-top: 1px solid #999;
                    padding-top: 6px;
                    margin-top: 50px;
                    font-size: 10px;
                    font-weight: 600;
                    color: #666 !important;
                }

                /* Força cores */
                .print-container * {
                    color: #000 !important;
                }

                .print-container strong {
                    color: #000 !important;
                }
            `}</style>

            {/* Header */}
            <div className="header-box">
                <div className="logo-section">
                    {tenantInfo.logo_url ? (
                        <img src={tenantInfo.logo_url} alt="Logo" />
                    ) : (
                        <div style={{ fontSize: '11px', color: '#ccc', fontWeight: 600 }}>LOGO</div>
                    )}
                </div>
                <div className="company-data">
                    <div className="company-name">{tenantInfo.name}</div>
                    <div className="company-info">
                        {tenantInfo.document && <div>CNPJ: {tenantInfo.document}</div>}
                        {tenantInfo.address && <div>{tenantInfo.address}</div>}
                    </div>
                </div>
                <div className="contact-section">
                    {tenantInfo.phone && <div><strong>Tel:</strong> {tenantInfo.phone}</div>}
                    {tenantInfo.email && <div>{tenantInfo.email}</div>}
                </div>
            </div>

            {/* Título da OS */}
            <div className="os-title-bar">
                <div className="os-title">ORDEM DE SERVIÇO #{ordem.numero}</div>
                <div className="os-emission">Emissão: {formatDateTime(ordem.data_abertura)}</div>
            </div>

            {/* Tabela de Informações */}
            <table className="info-table">
                <thead>
                    <tr>
                        <th>Status</th>
                        <th>Data Inicial</th>
                        <th>Data Prevista</th>
                        <th>Garantia</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{STATUS_LABELS[ordem.status]}</td>
                        <td>{formatDate(ordem.data_abertura)}</td>
                        <td>{ordem.data_previsao ? formatDate(ordem.data_previsao) : '-'}</td>
                        <td>{ordem.garantia_dias ? `${ordem.garantia_dias} dia(s)` : '-'}</td>
                    </tr>
                </tbody>
            </table>

            {/* Dados do Cliente */}
            {ordem.cliente && (
                <>
                    <div className="section-header">Dados do Cliente</div>
                    <div className="section-content">
                        <strong>Nome:</strong> {ordem.cliente.name}
                        {' | '}
                        <strong>Telefone:</strong> {ordem.cliente.phone_primary}
                        {ordem.cliente.email && (
                            <>
                                {' | '}
                                <strong>Email:</strong> {ordem.cliente.email}
                            </>
                        )}
                    </div>
                </>
            )}

            {/* Descrição Produto/Serviço */}
            <div className="section-header">Descrição Produto/Serviço</div>
            <div className="section-content">
                {ordem.equipamento_tipo && (
                    <>
                        <strong>{ordem.equipamento_tipo}</strong>
                        {ordem.equipamento_marca && <span> | <strong>Marca:</strong> {ordem.equipamento_marca}</span>}
                        {ordem.equipamento_modelo && <span> | <strong>Modelo:</strong> {ordem.equipamento_modelo}</span>}
                        {ordem.equipamento_serie && <span> | <strong>Série:</strong> {ordem.equipamento_serie}</span>}
                        <br /><br />
                    </>
                )}
                <strong>Tipo de Serviço:</strong> {ordem.tipo_servico}
            </div>

            {/* Defeito/Solicitação */}
            <div className="section-header">Defeito/Solicitação</div>
            <div className="section-content" dangerouslySetInnerHTML={{ __html: ordem.descricao }} />

            {/* Produtos/Serviços */}
            {ordem.itens && ordem.itens.length > 0 && (
                <>
                    <div className="section-header">Produtos e Serviços</div>
                    <table className="items-table">
                        <thead>
                            <tr>
                                <th>Descrição</th>
                                <th style={{ width: '70px', textAlign: 'center' }}>Qtd</th>
                                <th style={{ width: '100px', textAlign: 'right' }}>Valor Unit.</th>
                                <th style={{ width: '100px', textAlign: 'right' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ordem.itens.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.descricao}</td>
                                    <td style={{ textAlign: 'center' }}>{item.quantidade}</td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.valor_unitario)}</td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.valor_total)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={3} style={{ textAlign: 'right' }}>VALOR TOTAL:</td>
                                <td style={{ textAlign: 'right' }}>{formatCurrency(ordem.valor_servico)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </>
            )}

            {/* Condições de Execução */}
            {condicoesExecucao && (
                <>
                    <div className="section-header">Condições de Execução</div>
                    <div className="section-content">{condicoesExecucao}</div>
                </>
            )}

            {/* Observações */}
            {ordem.observacoes_cliente && (
                <>
                    <div className="section-header">Observações</div>
                    <div className="section-content" dangerouslySetInnerHTML={{ __html: ordem.observacoes_cliente }} />
                </>
            )}

            {/* Assinaturas */}
            <div className="signatures">
                <div className="signature-box">
                    <div className="signature-line">Assinatura do Atendente</div>
                </div>
                <div className="signature-box">
                    <div className="signature-line">Assinatura do Cliente</div>
                </div>
            </div>
        </div>
    );
};
