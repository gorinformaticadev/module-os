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
    equipamento_acessorios?: string;
    equipamento_estado?: string;
    usuario_responsavel?: { name: string };
    formatacao_so?: string;
    formatacao_backup?: boolean;
    formatacao_backup_descricao?: string;
    formatacao_senha?: string;
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
    1: 'Aberta',
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
        return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}`;
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    // Função para verificar se HTML está vazio
    const isHtmlEmpty = (html?: string): boolean => {
        if (!html || !html.trim()) return true;
        // Remove tags HTML e verifica se sobrou conteúdo
        const textContent = html.replace(/<[^>]*>/g, '').trim();
        return textContent.length === 0;
    };

    // Função para formatar CPF/CNPJ
    const formatCpfCnpj = (document?: string): string => {
        if (!document) return '';
        const numbers = document.replace(/\D/g, '');

        if (numbers.length === 11) {
            // CPF: 000.000.000-00
            return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        } else if (numbers.length === 14) {
            // CNPJ: 00.000.000/0000-00
            return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
        }

        return document; // Retorna original se não for CPF nem CNPJ
    };

    // Componente interno para renderizar uma única via
    // Aceita um id opcional para facilitar seleção na geração de PDF
    const SingleCopy = ({ isSecondCopy = false, id }: { isSecondCopy?: boolean; id?: string }) => (
        <div id={id} className="single-copy-wrapper">
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
                        {tenantInfo.document && <div>CNPJ: {formatCpfCnpj(tenantInfo.document)}</div>}
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
                <div className="os-title">ORDEM DE SERVIÇO #{ordem.numero} {isSecondCopy ? '(2ª Via)' : ''}</div>
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
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '4px' }}>
                            {ordem.equipamento_acessorios && (
                                <div style={{ flexShrink: 0 }}>
                                    <strong>Acessórios / Outros:</strong> {ordem.equipamento_acessorios}
                                </div>
                            )}
                            {ordem.equipamento_estado && (
                                <div style={{ flexShrink: 0 }}>
                                    <strong>Estado de Entrega / Obs:</strong> {ordem.equipamento_estado}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Defeito/Solicitação */}
            <div className="section-header">Defeito/Solicitação</div>
            <div className="section-content">
                {/* Linha com campos de formatação */}
                {(ordem.tipo_servico || ordem.formatacao_so || ordem.formatacao_backup !== undefined || ordem.formatacao_senha) && (
                    <div style={{ marginBottom: '12px', fontWeight: 600 }}>
                        {ordem.tipo_servico}
                        {ordem.formatacao_so && <span> - {ordem.formatacao_so}</span>}
                        {ordem.formatacao_backup !== undefined && (
                            <span> - Backup: {ordem.formatacao_backup ? 'Sim' : 'Não'}</span>
                        )}
                        {ordem.formatacao_backup && ordem.formatacao_backup_descricao && (
                            <span> ({ordem.formatacao_backup_descricao})</span>
                        )}
                        {ordem.formatacao_senha && <span> - Senha: {ordem.formatacao_senha}</span>}
                    </div>
                )}
                {/* Descrição do defeito */}
                <div dangerouslySetInnerHTML={{ __html: ordem.descricao }} />
            </div>

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
            {!isHtmlEmpty(condicoesExecucao) && (
                <>
                    <div className="section-header">Condições de Execução</div>
                    <div className="section-content conditions-text" dangerouslySetInnerHTML={{ __html: condicoesExecucao || '' }} />
                </>
            )}

            {/* Observações */}
            {!isHtmlEmpty(ordem.observacoes_cliente) && (
                <>
                    <div className="section-header">Observações</div>
                    <div className="section-content" dangerouslySetInnerHTML={{ __html: ordem.observacoes_cliente! }} />
                </>
            )}

            {/* Assinaturas */}
            <div className="signatures" style={isSecondCopy ? { marginTop: '0px', marginBottom: '2px' } : {}}>
                <div className="signature-box">
                    <div className="signature-line">
                        {ordem.usuario_responsavel?.name || 'Atendente'}
                        <br />
                        <span style={{ fontSize: '9px', color: '#999' }}>Assinatura do Atendente</span>
                    </div>
                </div>
                <div className="signature-box">
                    <div className="signature-line">
                        {ordem.cliente?.name || 'Cliente'}
                        <br />
                        <span style={{ fontSize: '9px', color: '#999' }}>Assinatura do Cliente</span>
                    </div>
                </div>
            </div>

            {/* Declaração de Recebimento - Apenas 2ª Via */}
            {isSecondCopy && (
                <div className="declaration-box">
                    <div className="declaration-header">
                        Declaração de Recebimento de Equipamento
                    </div>
                    <div className="declaration-content">
                        <p style={{ marginBottom: '5px' }}>
                            Eu, <strong>{ordem.cliente?.name || '__________________________'}</strong>, declaro que recebi da empresa <strong>{tenantInfo.name}</strong>, o equipamento acima descrito após realização dos serviços contratados.
                        </p>
                        <p style={{ marginBottom: '8px' }}>
                            <strong>Status do serviço:</strong> &nbsp;
                            ( &nbsp; ) Consertado &nbsp;&nbsp;
                            ( &nbsp; ) Sem conserto &nbsp;&nbsp;
                            ( &nbsp; ) Cancelado
                        </p>
                        <div className="declaration-row">
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '10px' }}>
                                    Data de retirada: ______/______/________
                                </div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div className="declaration-field" style={{ width: '100%' }}></div>
                                <div className="declaration-label">Assinatura do Cliente / Responsável</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Rodapé com marca d'água */}
            {!isSecondCopy && (
                <div className="footer-watermark">
                    Sistema de Ordem de Serviço | Desenvolvido por: GOR Informática | {new Date().getFullYear()} - {formatDateTime(new Date().toISOString())}
                </div>
            )}
        </div>
    );

    return (
        <div className="print-container">
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page {
                        size: A4;
                        margin: 10mm; /* Ajustado para 10mm para coincidir com a tela */
                    }
                    
                    body {
                        font-family: Arial, sans-serif;
                        font-size: 10pt;
                        color: #000 !important;
                        background: white !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    
                    .no-print {
                        display: none !important;
                    }

                    .page-break {
                        page-break-after: always;
                        height: 0;
                        display: block;
                        clear: both;
                    }

                    .print-container {
                        width: 100%;
                        max-width: 210mm;
                        margin: 0 auto;
                        background: white !important;
                        color: #000 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }

                @media screen {
                    .print-container {
                        width: 210mm;
                        min-height: 297mm;
                        margin: 10px auto;
                        padding: 10mm; /* Ajustado para 10mm para coincidir com a impressão */
                        background: white !important;
                        color: #000 !important;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                        position: relative;
                        margin-bottom: 2rem;
                        box-sizing: border-box; /* Garante cálculo correto da largura */
                    }

                    .page-break {
                        height: 20px;
                        background: #f0f0f0;
                        border-top: 1px dashed #ccc;
                        border-bottom: 1px dashed #ccc;
                        margin: 20px 0;
                        text-align: center;
                        color: #666;
                        font-size: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .page-break::after {
                        content: 'Quebra de Página (2ª Via)';
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
                    padding: 8px 12px;
                    margin-bottom: 8px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .os-title {
                    font-size: 13px;
                    font-weight: bold;
                    color: #000 !important;
                }

                .os-emission {
                    font-size: 9px;
                    color: #666 !important;
                }

                /* Tabela de informações */
                .info-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 10px;
                    border: 1px solid #a5a5a5ff;
                    border-radius: 4px;
                    overflow: hidden;
                }

                .info-table th {
                    background: #f8f8f8;
                    border: 1px solid #dfdedeff;
                    padding: 4px 10px;
                    font-size: 9px;
                    font-weight: 600;
                    color: #333 !important;
                    text-align: center;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }

                .info-table td {
                    border: 1px solid #dfdedeff;
                    padding: 4px 10px;
                    font-size: 9px;
                    color: #000 !important;
                    text-align: center;
                }

                /* Seções */
                .section-header {
                    background: #d8d7d7ff;
                    border: 1px solid #a5a5a5ff;
                    border-bottom: none;
                    border-radius: 4px 4px 0 0;
                    padding: 2px 12px;
                    font-size: 9px;
                    font-weight: 600;
                    color: #333 !important;
                    margin-top: 1px;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }

                .section-content {
                    border: 1px solid #e0e0e0;
                    border-radius: 0 0 4px 4px;
                    padding: 8px 12px;
                    font-size: 10px;
                    color: #000 !important;
                    line-height: 1.4;
                    min-height: 20px;
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
                    border-bottom: 1px solid #d0d0d0;
                }

                .items-table th {
                    border: 1px solid #e0e0e0;
                    padding: 4px 8px;
                    font-size: 9px;
                    font-weight: 600;
                    color: #333 !important;
                    text-align: left;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }

                .items-table td {
                    border: 1px solid #e0e0e0;
                    padding: 4px 8px;
                    font-size: 9px;
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
                    font-size: 10px;
                    border-top: 2px solid #d0d0d0;
                }

                /* Assinaturas */
                .signatures {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 40px;
                    margin-top: 10px;
                    margin-bottom: 15px;
                    page-break-inside: avoid;
                }

                .signature-box {
                    text-align: center;
                }

                .signature-line {
                    border-top: 1px solid #999;
                    padding-top: 6px;
                    margin-top: 35px;
                    font-size: 10px;
                    font-weight: 600;
                    color: #666 !important;
                }

                /* Rodapé com marca d'água */
                .footer-watermark {
                    margin-top: auto;
                    padding-top: 5px;
                    border-top: 1px solid #e0e0e0;
                    text-align: right;
                    font-size: 10px;
                    color: #999 !important;
                }

                /* Força cores */
                .print-container * {
                    color: #000 !important;
                }

                .print-container strong {
                    color: #000 !important;
                }

                /* Condições de execução compactas */
                .conditions-text {
                    font-size: 10px !important;
                    text-align: justify !important;
                }
                .conditions-text * {
                    font-size: 10px !important;
                    line-height: 1.2 !important;
                    margin-bottom: 2px !important;
                    text-align: justify !important;
                }
                /* Estilos da Declaração de Recebimento */
                .declaration-box {
                    margin-top: 5px;
                    border: 1px dashed #000;
                    padding: 5px;
                    page-break-inside: avoid;
                }
                .declaration-header {
                    font-size: 10px;
                    font-weight: bold;
                    text-align: center;
                    margin-bottom: 5px;
                    text-transform: uppercase;
                    background-color: #f0f0f0;
                    padding: 3px;
                    border: 1px solid #ccc;
                }
                .declaration-content {
                    font-size: 10px;
                }
                .declaration-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                }
                .declaration-field {
                    border-bottom: 1px solid #000;
                    min-width: 200px;
                    height: 16px; /* Altura para alinhar borda com texto da esquerda */
                }
                .declaration-label {
                    font-size: 8px;
                    color: #666;
                    margin-top: 2px;
                }

                /* Wrapper para cada via (escopo de posicionamento) */
                .single-copy-wrapper {
                    position: relative;
                    min-height: 255mm; /* Reduzido ainda mais para garantir caber em uma página */
                    display: flex;
                    flex-direction: column;
                }
            `}} />

            <SingleCopy id="print-copy-1" />

            <div className="page-break" />

            <SingleCopy isSecondCopy={true} />
        </div>
    );
};
