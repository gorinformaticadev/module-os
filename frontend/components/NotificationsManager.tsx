import React, { useState, useEffect } from 'react';
import DurationPicker from './DurationPicker';
import {
    Bell,
    Calendar,
    Clock,
    Plus,
    Trash2,
    Edit2,
    History as HistoryIcon,
    ChevronRight,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Mail,
    MessageSquare,
    RefreshCw,
    Search,
    HelpCircle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const InfoTooltip = ({ text }: { text: string }) => (
    <div className="group relative inline-block ml-1.5 align-middle cursor-help">
        <HelpCircle className="h-4 w-4 text-skin-text-muted/70 hover:text-primary transition-colors" />
        <div className="invisible group-hover:visible absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 bg-popover text-popover-foreground text-xs p-2 rounded-md shadow-md border z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            {text}
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 bg-popover border-r border-b rotate-45" />
        </div>
    </div>
);

export function NotificationsManager({ api, toast, user }: any) {
    const [activeSubTab, setActiveSubTab] = useState<'rules' | 'history'>('rules');
    const [loading, setLoading] = useState(false);
    const [rules, setRules] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentRule, setCurrentRule] = useState<any>(null);

    const INTERNAL_CHANNELS = ['SYSTEM', 'PUSH'];

    const isInternalChannel = (channel?: string) => INTERNAL_CHANNELS.includes(channel || 'SYSTEM');

    const getDefaultRecipientsForChannel = (channel?: string) => (
        isInternalChannel(channel) ? [{ type: 'TECHNICIAN' }] : [{ type: 'CLIENT' }]
    );

    const sanitizeRecipientsForChannel = (channel?: string, recipients?: any[]) => {
        const allowedTypes = isInternalChannel(channel)
            ? ['TECHNICIAN', 'ADMIN', 'SUPER_ADMIN']
            : ['CLIENT', 'TECHNICIAN', 'ADMIN', 'SUPER_ADMIN'];

        const safeRecipients = Array.isArray(recipients)
            ? recipients.filter((recipient: any) => allowedTypes.includes(recipient?.type))
            : [];

        return safeRecipients.length > 0 ? safeRecipients : getDefaultRecipientsForChannel(channel);
    };

    const buildEmptyRule = () => ({
        title: '',
        description: '',
        enabled: true,
        trigger_type: 'EVENT',
        trigger_config: {},
        channel: 'SYSTEM',
        recipients: getDefaultRecipientsForChannel('SYSTEM'),
        message_template: ''
    });

    const applyTemplate = (config: any) => {
        const channel = config?.channel || 'SYSTEM';
        setCurrentRule({
            ...config,
            enabled: true,
            recipients: sanitizeRecipientsForChannel(channel, config?.recipients)
        });
    };

    const updateRecipients = (type: string, checked: boolean) => {
        const currentRecipients = currentRule?.recipients || [];
        const nextRecipients = checked
            ? [...currentRecipients.filter((recipient: any) => recipient.type !== type), { type }]
            : currentRecipients.filter((recipient: any) => recipient.type !== type);

        setCurrentRule({
            ...currentRule,
            recipients: sanitizeRecipientsForChannel(currentRule?.channel, nextRecipients)
        });
    };

    const getChannelIcon = (channel?: string, className = 'h-6 w-6') => {
        if (channel === 'EMAIL') return <Mail className={className} />;
        if (isInternalChannel(channel)) return <Bell className={className} />;
        return <MessageSquare className={className} />;
    };

    const [historyFilters, setHistoryFilters] = useState({
        status: '',
        ruleId: ''
    });

    useEffect(() => {
        if (activeSubTab === 'rules') fetchRules();
        else fetchHistory();
    }, [activeSubTab, historyFilters]);

    const currentChannel = currentRule?.channel || 'SYSTEM';
    const internalChannelSelected = isInternalChannel(currentChannel);

    const fetchRules = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/ordem_servico/notificacoes/regras');
            setRules(res.data);
        } catch (err) {
            toast({ title: 'Erro', description: 'Falha ao carregar regras', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams(historyFilters as any).toString();
            const res = await api.get(`/api/ordem_servico/notificacoes/historico?${queryParams}`);
            setHistory(res.data);
        } catch (err) {
            toast({ title: 'Erro', description: 'Falha ao carregar histórico', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza?')) return;
        try {
            await api.delete(`/api/ordem_servico/notificacoes/regras/${id}`);
            toast({ title: 'Sucesso', description: 'Regra removida' });
            fetchRules();
        } catch (err) {
            toast({ title: 'Erro', variant: 'destructive' });
        }
    };

    const handleToggle = async (rule: any) => {
        try {
            await api.put(`/api/ordem_servico/notificacoes/regras/${rule.id}`, { enabled: !rule.enabled });
            fetchRules();
        } catch (err) {
            toast({ title: 'Erro ao alternar status', variant: 'destructive' });
        }
    };

    const addToken = (token: string) => {
        setCurrentRule({ ...currentRule, message_template: (currentRule?.message_template || '') + ` ${token}` });
    };

    return (
        <div className="space-y-6 text-skin-text">
            <div className="flex items-center justify-between border-b pb-4">
                <div className="flex gap-4">
                    <Button
                        variant={activeSubTab === 'rules' ? 'secondary' : 'ghost'}
                        onClick={() => setActiveSubTab('rules')}
                        className="rounded-full px-6"
                    >
                        <Bell className="h-4 w-4 mr-2" />
                        Regras de Notificação
                    </Button>
                    <Button
                        variant={activeSubTab === 'history' ? 'secondary' : 'ghost'}
                        onClick={() => setActiveSubTab('history')}
                        className="rounded-full px-6"
                    >
                        <HistoryIcon className="h-4 w-4 mr-2" />
                        Histórico de Disparos
                    </Button>
                </div>

                {activeSubTab === 'rules' && (
                    <Button onClick={() => {
                        setCurrentRule(buildEmptyRule());
                        setIsEditing(true);
                    }} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 font-bold">
                        <Plus className="h-4 w-4" />
                        Nova Regra
                    </Button>
                )}
            </div>

            {activeSubTab === 'rules' ? (
                <div className="grid grid-cols-1 gap-4">
                    {loading && rules.length === 0 ? (
                        <div className="text-center py-20 flex flex-col items-center gap-4">
                            <RefreshCw className="h-8 w-8 animate-spin text-primary opacity-50" />
                            <p className="text-skin-text-muted font-medium text-lg">Carregando agendamentos...</p>
                        </div>
                    ) : rules.length === 0 ? (
                        <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/10">
                            <Bell className="h-12 w-12 mx-auto mb-4 text-skin-text-muted opacity-20" />
                            <h3 className="text-lg font-medium">Nenhuma regra configurada</h3>
                            <p className="text-skin-text-muted mb-6">Comece criando uma regra de gatilho para suas Ordens de Serviço.</p>
                            <Button variant="outline" onClick={() => {
                                setCurrentRule(buildEmptyRule());
                                setIsEditing(true);
                            }}>Criar primeira regra</Button>
                        </div>
                    ) : (
                        rules.map((rule) => (
                            <Card key={rule.id} className="hover:border-primary/30 transition-all group overflow-hidden border-skin-border shadow-sm">
                                <CardContent className="p-5">
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-4">
                                            <div className={`p-3 rounded-lg ${rule.enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-skin-text-muted'}`}>
                                                {getChannelIcon(rule.channel)}
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-lg">{rule.title}</h4>
                                                    <Badge variant={rule.enabled ? 'outline' : 'secondary'} className={rule.enabled ? 'border-skin-success/50 bg-skin-success/10 text-skin-success dark:text-skin-success' : ''}>
                                                        {rule.enabled ? 'Ativa' : 'Inativa'}
                                                    </Badge>
                                                    <Badge variant="outline" className="opacity-70 font-normal">{rule.trigger_type}</Badge>
                                                </div>
                                                <p className="text-sm text-skin-text-muted line-clamp-1 italic">{rule.description || 'Sem descrição'}</p>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <span className="text-xs text-skin-text-muted flex items-center gap-1 font-medium">
                                                        <Clock className="h-3 w-3" />
                                                        Execuções: {rule.current_executions} {rule.max_executions ? `/ ${rule.max_executions}` : ''}
                                                    </span>
                                                    {rule.last_execution_at && (
                                                        <span className="text-xs text-skin-text-muted flex items-center gap-1 font-medium">
                                                            <Calendar className="h-3 w-3" />
                                                            Última: {new Date(rule.last_execution_at).toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => handleToggle(rule)} className="font-medium">
                                                {rule.enabled ? 'Pausar' : 'Ativar'}
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => { setCurrentRule(rule); setIsEditing(true); }} className="hover:bg-primary/10 hover:text-primary">
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 h-9 w-9 p-0" onClick={() => handleDelete(rule.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            ) : (
                <Card className="overflow-hidden border-skin-border/50 shadow-md">
                    <CardHeader className="p-4 bg-muted/30 border-b flex flex-row justify-between items-center gap-4 space-y-0">
                        <div className="flex items-center bg-skin-background rounded-lg border px-3 py-1 flex-1 max-w-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                            <Search className="h-4 w-4 text-skin-text-muted mr-2" />
                            <input className="bg-transparent border-none outline-none text-sm w-full py-1" placeholder="Buscar no histórico..." />
                        </div>
                        <div className="flex gap-2">
                            <select
                                className="bg-skin-background border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                value={historyFilters.status}
                                onChange={(e) => setHistoryFilters({ ...historyFilters, status: e.target.value })}
                            >
                                <option value="">Todos os status</option>
                                <option value="SUCCESS">Sucesso</option>
                                <option value="ERROR">Erro</option>
                                <option value="PAUSED">Pausado</option>
                            </select>
                            <Button variant="outline" size="sm" onClick={fetchHistory} className="h-9 w-9 p-0">
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-skin-text-muted font-semibold border-b">
                                    <tr>
                                        <th className="px-5 py-3 text-left">Data</th>
                                        <th className="px-5 py-3 text-left">Regra</th>
                                        <th className="px-5 py-3 text-left">Canal</th>
                                        <th className="px-5 py-3 text-left">Destinatário</th>
                                        <th className="px-5 py-3 text-left">Status</th>
                                        <th className="px-5 py-3 text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y border-b">
                                    {history.map(item => (
                                        <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-skin-text/80">{new Date(item.sent_at).toLocaleDateString()}</span>
                                                    <span className="text-[10px] text-skin-text-muted">{new Date(item.sent_at).toLocaleTimeString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 font-bold text-primary/80">Regra #{item.rule_id.substring(0, 8)}</td>
                                            <td className="px-5 py-4">
                                                <Badge variant="outline" className="gap-1.5 font-medium">
                                                    {getChannelIcon(item.channel, 'h-3.5 w-3.5')}
                                                    {item.channel}
                                                </Badge>
                                            </td>
                                            <td className="px-5 py-4 truncate max-w-[150px] font-medium text-skin-text/70">{item.recipient}</td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-tighter">
                                                    {item.status === 'SUCCESS' ? (
                                                        <><CheckCircle2 className="h-4 w-4 text-skin-success" /> <span className="text-skin-success dark:text-skin-success">Sucesso</span></>
                                                    ) : item.status === 'ERROR' ? (
                                                        <><XCircle className="h-4 w-4 text-destructive" /> <span className="text-destructive">Erro</span></>
                                                    ) : (
                                                        <><AlertCircle className="h-4 w-4 text-skin-warning" /> <span className="text-skin-warning dark:text-skin-warning">{item.status}</span></>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/10 transition-colors"><ChevronRight className="h-4 w-4" /></Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {history.length === 0 && !loading && (
                                <div className="py-24 text-center text-skin-text-muted font-medium flex flex-col items-center gap-2 italic">
                                    <Bell className="h-10 w-10 opacity-10 mb-2" />
                                    Nenhum registro encontrado no período.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {isEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-skin-background/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <Card className="w-full max-w-3xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] border-primary/10">
                        <CardHeader className="p-6 border-b flex flex-row justify-between items-center bg-card">
                            <div>
                                <CardTitle className="text-xl font-bold">{currentRule?.id ? 'Editar Regra' : 'Nova Regra de Notificação'}</CardTitle>
                                <p className="text-sm text-skin-text-muted">Configure quando e como as notificações serão enviadas.</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)} className="rounded-full hover:bg-destructive/10 hover:text-destructive">
                                <XCircle className="h-6 w-6" />
                            </Button>
                        </CardHeader>

                        <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
                            {!currentRule.id && (
                                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 mb-4">
                                    <h4 className="text-sm font-bold mb-3 flex items-center gap-2 text-primary">
                                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                        Comece com um Modelo
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { label: '🔔 Nova OS (Sistema)', config: { title: 'Nova OS Registrada', trigger_type: 'EVENT', trigger_config: { events: ['CREATED'] }, channel: 'SYSTEM', message_template: 'Nova OS #{{numero}} criada para {{cliente}}.' } },
                                            { label: '⏰ Vence em 24h', config: { title: 'Alerta de Vencimento', trigger_type: 'OFFSET', trigger_config: { value: 24, unit: 'HOURS', reference: 'BEFORE_DEADLINE' }, channel: 'EMAIL', message_template: 'Sua OS #{{numero}} vence em 24 horas.' } },
                                            { label: '⚠️ OS Atrasada', config: { title: 'OS Fora do Prazo', trigger_type: 'CONDITION', trigger_config: { condition: 'OVERDUE' }, channel: 'SYSTEM', message_template: 'Atenção: OS #{{numero}} está atrasada!' } },
                                            { label: '✅ Finalizada (Zap)', config: { title: 'OS Concluída', trigger_type: 'EVENT', trigger_config: { events: ['STATUS_CHANGED'], status_to: 'CONCLUIDO' }, channel: 'WHATSAPP', message_template: 'Olá {{cliente}}, sua OS #{{numero}} foi finalizada!' } },
                                        ].map((t, i) => (
                                            <Button key={i} variant="outline" size="sm" onClick={() => applyTemplate(t.config)} className="bg-skin-background hover:bg-primary/10 hover:border-primary/30 transition-all font-medium">{t.label}</Button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-sm font-semibold flex items-center">
                                        Título da Regra
                                        <InfoTooltip text="Um nome interno para você identificar esta regra facilmente." />
                                    </label>
                                    <Input
                                        value={currentRule?.title || ''}
                                        onChange={(e) => setCurrentRule({ ...currentRule, title: e.target.value })}
                                        placeholder="Ex: Alerta de OS Atrasada"
                                        className="font-medium"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold flex items-center">
                                        Tipo de Gatilho
                                        <InfoTooltip text="O evento ou condição que dispara esta notificação." />
                                    </label>
                                    <select
                                        className="w-full bg-skin-background border rounded-lg px-4 py-2 h-10 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                        value={currentRule?.trigger_type || 'EVENT'}
                                        onChange={(e) => setCurrentRule({ ...currentRule, trigger_type: e.target.value, trigger_config: {} })}
                                    >
                                        <option value="EVENT">⚡ Evento (Imediato)</option>
                                        <option value="OFFSET">🕒 Tempo Relativo (Offset)</option>
                                        <option value="CONDITION">🔍 Condição (Estado)</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold flex items-center">
                                        Canal de Envio
                                        <InfoTooltip text="Por onde o destinatário receberá a mensagem." />
                                    </label>
                                    <select
                                        className="w-full bg-skin-background border rounded-lg px-4 py-2 h-10 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                        value={currentChannel}
                                        onChange={(e) => {
                                            const nextChannel = e.target.value;
                                            setCurrentRule({
                                                ...currentRule,
                                                channel: nextChannel,
                                                recipients: sanitizeRecipientsForChannel(nextChannel, currentRule?.recipients)
                                            });
                                        }}
                                    >
                                        <option value="SYSTEM">🔔 Sistema (Interna + Push Central)</option>
                                        <option value="EMAIL">📧 E-mail</option>
                                        <option value="WHATSAPP">📱 WhatsApp</option>
                                    </select>
                                    <p className="text-[11px] text-skin-text-muted leading-relaxed">
                                        {internalChannelSelected
                                            ? 'Sistema usa o hub central de notificações e entrega somente para usuários internos do tenant.'
                                            : 'Canais externos podem atender cliente e, quando fizer sentido, usuários internos.'}
                                    </p>
                                </div>

                                <div className="col-span-2 space-y-2">
                                    <label className="text-sm font-semibold flex items-center">
                                        Destinatários
                                        <InfoTooltip text="Quem deve receber esta mensagem?" />
                                    </label>
                                    <div className="flex flex-wrap gap-4 p-4 bg-muted/20 rounded-xl border items-center">
                                        <label className={`flex items-center gap-2 select-none font-medium text-sm ${internalChannelSelected ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-skin-text-muted text-primary focus:ring-primary transition-all"
                                                disabled={internalChannelSelected}
                                                checked={currentRule?.recipients?.some((r: any) => r.type === 'CLIENT')}
                                                onChange={(e) => updateRecipients('CLIENT', e.target.checked)}
                                            />
                                            <span>Cliente</span>
                                        </label>

                                        <label className="flex items-center gap-2 cursor-pointer select-none font-medium text-sm">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-skin-text-muted text-primary focus:ring-primary transition-all"
                                                checked={currentRule?.recipients?.some((r: any) => r.type === 'TECHNICIAN')}
                                                onChange={(e) => updateRecipients('TECHNICIAN', e.target.checked)}
                                            />
                                            <span>Técnico Responsável</span>
                                        </label>

                                        <label className="flex items-center gap-2 cursor-pointer select-none font-medium text-sm">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-skin-text-muted text-primary focus:ring-primary transition-all"
                                                checked={currentRule?.recipients?.some((r: any) => r.type === 'ADMIN')}
                                                onChange={(e) => updateRecipients('ADMIN', e.target.checked)}
                                            />
                                            <span>Administradores</span>
                                        </label>

                                        {user?.role === 'SUPER_ADMIN' && (
                                            <label className="flex items-center gap-2 cursor-pointer select-none text-skin-danger font-bold text-sm">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-skin-danger text-skin-danger focus:ring-skin-danger transition-all"
                                                    checked={currentRule?.recipients?.some((r: any) => r.type === 'SUPER_ADMIN')}
                                                    onChange={(e) => updateRecipients('SUPER_ADMIN', e.target.checked)}
                                                />
                                                <span>Super Admins (Global)</span>
                                            </label>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-skin-text-muted">
                                        {internalChannelSelected
                                            ? 'Para notificações internas, use Técnico Responsável, Administradores ou Super Admin. Cliente fica bloqueado neste canal.'
                                            : 'Para e-mail e WhatsApp, Cliente pode ser usado normalmente.'}
                                    </p>
                                </div>

                                <div className="col-span-2 border rounded-xl p-5 bg-muted/20 space-y-4">
                                    <h5 className="text-[10px] font-bold uppercase text-primary tracking-widest flex items-center mb-2">
                                        Configuração do Gatilho
                                        <InfoTooltip text="Defina os detalhes específicos de quando a regra deve disparar." />
                                    </h5>

                                    {currentRule?.trigger_type === 'EVENT' && (
                                        <div className="space-y-3">
                                            <label className="text-sm font-semibold">Eventos Observados</label>
                                            <div className="flex flex-wrap gap-3">
                                                {Object.entries({
                                                    'CREATED': '✨ Nova OS Criada',
                                                    'STATUS_CHANGED': '🔄 Mudança de Status',
                                                    'ASSIGNED': '👤 Técnico Atribuído',
                                                    'FINISHED': '✅ OS Finalizada'
                                                }).map(([evt, label]) => (
                                                    <label key={evt} className="flex items-center gap-2 bg-skin-background px-4 py-2 rounded-lg border cursor-pointer hover:border-primary/50 transition-all shadow-sm">
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4 text-primary focus:ring-primary rounded"
                                                            checked={currentRule?.trigger_config?.events?.includes(evt) ?? false}
                                                            onChange={(e) => {
                                                                const events = currentRule?.trigger_config?.events || [];
                                                                const newEvents = e.target.checked
                                                                    ? [...events, evt]
                                                                    : events.filter((x: string) => x !== evt);
                                                                setCurrentRule({ ...currentRule, trigger_config: { ...currentRule.trigger_config, events: newEvents } });
                                                            }}
                                                        />
                                                        <span className="text-sm font-medium">{label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {currentRule?.trigger_type === 'OFFSET' && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <DurationPicker
                                                    label="Tempo de Deslocamento"
                                                    value={currentRule?.trigger_config?.offset_duration || { days: 0, hours: 0, minutes: 0, seconds: 0 }}
                                                    onChange={(val) => setCurrentRule({
                                                        ...currentRule,
                                                        trigger_config: { ...currentRule.trigger_config, offset_duration: val }
                                                    })}
                                                />

                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold flex items-center">
                                                        Referência
                                                        <InfoTooltip text="Quando este tempo deve ser contado?" />
                                                    </label>
                                                    <select
                                                        className="w-full bg-skin-background border rounded-lg px-4 py-2 h-[58px] outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                                        value={currentRule?.trigger_config?.reference || 'BEFORE_DEADLINE'}
                                                        onChange={(e) => setCurrentRule({ ...currentRule, trigger_config: { ...currentRule.trigger_config, reference: e.target.value } })}
                                                    >
                                                        <option value="BEFORE_DEADLINE">Antes do Prazo (Vencimento)</option>
                                                        <option value="AFTER_DEADLINE">Depois do Prazo</option>
                                                        <option value="AFTER_CREATED">Após Criação</option>
                                                        <option value="AFTER_UPDATE">Após Última Atualização</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {currentRule?.trigger_type === 'CONDITION' && (
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold">Condição</label>
                                            <select
                                                className="w-full bg-skin-background border rounded-lg px-4 py-2 h-10 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                                value={currentRule?.trigger_config?.condition || 'OVERDUE'}
                                                onChange={(e) => setCurrentRule({ ...currentRule, trigger_config: { ...currentRule.trigger_config, condition: e.target.value } })}
                                            >
                                                <option value="OVERDUE">🚫 Está Atrasada (Fora do Prazo)</option>
                                                <option value="NO_TECHNICIAN">👤 Sem Técnico por X tempo</option>
                                                <option value="STUCK">🛑 Parada em Status (X dias)</option>
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div className="col-span-2 space-y-5 border-t pt-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase text-skin-text-muted flex items-center tracking-widest">
                                                Limite de Execuções
                                                <InfoTooltip text="Número máximo de vezes que esta regra pode ser acionada. Deixe vazio para infinito." />
                                            </label>
                                            <Input
                                                type="number"
                                                placeholder="Infinito"
                                                value={currentRule?.max_executions || ''}
                                                onChange={(e) => setCurrentRule({ ...currentRule, max_executions: e.target.value ? parseInt(e.target.value) : null })}
                                                className="font-medium"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase text-skin-text-muted flex items-center tracking-widest">
                                                Janela de Silêncio
                                                <InfoTooltip text="Horário em que as notificações serão pausadas (ex: não enviar de madrugada)." />
                                            </label>
                                            <div className="flex gap-2">
                                                <Input
                                                    type="time"
                                                    value={currentRule?.trigger_config?.silence_window?.start || ''}
                                                    onChange={(e) => setCurrentRule({
                                                        ...currentRule,
                                                        trigger_config: {
                                                            ...currentRule.trigger_config,
                                                            silence_window: { ...currentRule.trigger_config?.silence_window, start: e.target.value }
                                                        }
                                                    })}
                                                    className="font-medium"
                                                />
                                                <Input
                                                    type="time"
                                                    value={currentRule?.trigger_config?.silence_window?.end || ''}
                                                    onChange={(e) => setCurrentRule({
                                                        ...currentRule,
                                                        trigger_config: {
                                                            ...currentRule.trigger_config,
                                                            silence_window: { ...currentRule.trigger_config?.silence_window, end: e.target.value }
                                                        }
                                                    })}
                                                    className="font-medium"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <DurationPicker
                                            label="Frequência de Repetição (Recorrência)"
                                            value={currentRule?.trigger_config?.frequency || { days: 0, hours: 0, minutes: 0, seconds: 0 }}
                                            onChange={(val) => setCurrentRule({
                                                ...currentRule,
                                                trigger_config: { ...currentRule.trigger_config, frequency: val }
                                            })}
                                        />
                                        <p className="text-[10px] text-skin-text-muted mt-2 ml-1 italic font-medium">* Deixe tudo zerado para executar apenas uma vez.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <label className="text-sm font-bold flex items-center">
                                    Template da Mensagem
                                    <InfoTooltip text="Use as variáveis abaixo para personalizar a mensagem. Elas serão substituídas pelos dados reais da OS." />
                                </label>
                                <Textarea
                                    className="min-h-[120px] font-mono text-sm leading-relaxed p-4 bg-muted/30 border-primary/10 focus:border-primary/30"
                                    value={currentRule?.message_template || ''}
                                    onChange={(e) => setCurrentRule({ ...currentRule, message_template: e.target.value })}
                                    placeholder="Ex: Olá {{cliente}}, sua OS #{{numero}} mudou para {{status}}."
                                />
                                <div className="flex flex-wrap gap-2 text-[10px] text-skin-text-muted font-bold">
                                    <span className="bg-primary/10 text-primary px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-primary/20 transition-all border border-primary/5" onClick={() => addToken('{{cliente}}')}>{'{{cliente}}'}</span>
                                    <span className="bg-primary/10 text-primary px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-primary/20 transition-all border border-primary/5" onClick={() => addToken('{{numero}}')}>{'{{numero}}'}</span>
                                    <span className="bg-primary/10 text-primary px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-primary/20 transition-all border border-primary/5" onClick={() => addToken('{{status}}')}>{'{{status}}'}</span>
                                    <span className="bg-primary/10 text-primary px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-primary/20 transition-all border border-primary/5" onClick={() => addToken('{{data_previsao}}')}>{'{{data_previsao}}'}</span>
                                </div>
                            </div>
                        </CardContent>

                        <div className="flex-none p-6 border-t bg-muted/5 flex justify-end gap-3 rounded-b-xl">
                            <Button variant="outline" onClick={() => setIsEditing(false)} className="px-8 transition-colors">Cancelar</Button>
                            <Button className="px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/10" onClick={async () => {
                                try {
                                    const method = currentRule.id ? 'put' : 'post';
                                    const url = currentRule.id ? `/api/ordem_servico/notificacoes/regras/${currentRule.id}` : '/api/ordem_servico/notificacoes/regras';

                                    const payload = {
                                        ...currentRule,
                                        title: currentRule.title || 'Nova Regra',
                                        description: currentRule.description || '',
                                        enabled: currentRule.enabled !== false,
                                        trigger_type: currentRule.trigger_type || 'EVENT',
                                        trigger_config: currentRule.trigger_config || {},
                                        channel: currentChannel,
                                        max_executions: currentRule.max_executions || null,
                                        recipients: sanitizeRecipientsForChannel(currentChannel, currentRule.recipients),
                                        message_template: currentRule.message_template || ''
                                    };

                                    await (api as any)[method](url, payload);
                                    toast({ title: 'Sucesso', description: 'Regra salva com sucesso' });
                                    setIsEditing(false);
                                    fetchRules();
                                } catch (err) {
                                    console.error(err);
                                    toast({ title: 'Erro ao salvar', variant: 'destructive' });
                                }
                            }}>
                                {currentRule.id ? 'Salvar Alterações' : 'Criar Regra'}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
