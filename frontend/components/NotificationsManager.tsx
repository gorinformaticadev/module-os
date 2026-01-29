import React, { useState, useEffect } from 'react';
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
    Filter
} from 'lucide-react';

// Reuse existing UI components if possible, or define local mini-components
// (Assuming these are available via global styles or local definitions in page.tsx)
const Button = ({ children, variant = 'default', className = '', ...props }: any) => {
    const base = "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:ring-2 disabled:opacity-50";
    const variants = {
        default: "bg-primary text-white hover:bg-primary/90",
        outline: "border border-input bg-background hover:bg-accent text-foreground",
        ghost: "hover:bg-accent text-foreground",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    };
    return <button className={`${base} ${(variants as any)[variant]} ${className}`} {...props}>{children}</button>;
};

const Card = ({ children, className = '' }: any) => (
    <div className={`rounded-xl border border-border/50 bg-card/90 dark:bg-card/60 backdrop-blur-sm shadow-sm ${className}`}>
        {children}
    </div>
);

const Badge = ({ children, variant = 'default', className = '' }: any) => {
    const variants = {
        default: "bg-primary/10 text-primary border-primary/20",
        secondary: "bg-secondary/10 text-secondary border-secondary/20",
        destructive: "bg-destructive/10 text-destructive border-destructive/20",
        outline: "border-border text-foreground",
        success: "bg-green-500/10 text-green-600 border-green-200 dark:border-green-500/20"
    };
    return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${(variants as any)[variant]} ${className}`}>{children}</span>;
};

export function NotificationsManager({ api, toast }: any) {
    const [activeSubTab, setActiveSubTab] = useState<'rules' | 'history'>('rules');
    const [loading, setLoading] = useState(false);
    const [rules, setRules] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentRule, setCurrentRule] = useState<any>(null);

    // Pagination for history
    const [historyFilters, setHistoryFilters] = useState({
        status: '',
        ruleId: ''
    });

    useEffect(() => {
        if (activeSubTab === 'rules') fetchRules();
        else fetchHistory();
    }, [activeSubTab, historyFilters]);

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

    return (
        <div className="space-y-6">
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
                    <Button onClick={() => { setCurrentRule({}); setIsEditing(true); }} className="gap-2">
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
                            <p className="text-muted-foreground">Carregando instâncias...</p>
                        </div>
                    ) : rules.length === 0 ? (
                        <div className="text-center py-20 border-2 border-dashed rounded-xl">
                            <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                            <h3 className="text-lg font-medium">Nenhuma regra configurada</h3>
                            <p className="text-muted-foreground mb-6">Comece criando uma regra de gatilho para suas Ordens de Serviço.</p>
                            <Button variant="outline" onClick={() => { setCurrentRule({}); setIsEditing(true); }}>Criar primeira regra</Button>
                        </div>
                    ) : (
                        rules.map((rule) => (
                            <Card key={rule.id} className="p-5 hover:border-primary/30 transition-all group">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-4">
                                        <div className={`p-3 rounded-lg ${rule.enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                            {rule.channel === 'EMAIL' ? <Mail className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-lg">{rule.title}</h4>
                                                <Badge variant={rule.enabled ? 'success' : 'secondary'}>{rule.enabled ? 'Ativa' : 'Inativa'}</Badge>
                                                <Badge variant="outline" className="opacity-70">{rule.trigger_type}</Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-1">{rule.description || 'Sem descrição'}</p>
                                            <div className="flex items-center gap-4 mt-2">
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    Execuções: {rule.current_executions} {rule.max_executions ? `/ ${rule.max_executions}` : ''}
                                                </span>
                                                {rule.last_execution_at && (
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        Ultima: {new Date(rule.last_execution_at).toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => handleToggle(rule)}>
                                            {rule.enabled ? 'Pausar' : 'Ativar'}
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => { setCurrentRule(rule); setIsEditing(true); }}>
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(rule.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            ) : (
                <Card className="overflow-hidden">
                    <div className="p-4 bg-muted/30 border-b flex justify-between items-center gap-4">
                        <div className="flex items-center bg-background rounded-lg border px-3 py-1 flex-1 max-w-sm">
                            <Search className="h-4 w-4 text-muted-foreground mr-2" />
                            <input className="bg-transparent border-none outline-none text-sm w-full py-1" placeholder="Buscar no histórico..." />
                        </div>
                        <div className="flex gap-2">
                            <select
                                className="bg-background border rounded-lg px-3 py-1.5 text-sm"
                                value={historyFilters.status}
                                onChange={(e) => setHistoryFilters({ ...historyFilters, status: e.target.value })}
                            >
                                <option value="">Todos os status</option>
                                <option value="SUCCESS">Sucesso</option>
                                <option value="ERROR">Erro</option>
                                <option value="PAUSED">Pausado</option>
                            </select>
                            <Button variant="outline" size="sm" onClick={fetchHistory}>
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
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
                                                <span>{new Date(item.sent_at).toLocaleDateString()}</span>
                                                <span className="text-[10px] text-muted-foreground">{new Date(item.sent_at).toLocaleTimeString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 font-medium">Rule #{item.rule_id.substring(0, 8)}</td>
                                        <td className="px-5 py-4">
                                            <Badge variant="outline" className="gap-1">
                                                {item.channel === 'EMAIL' ? <Mail className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                                                {item.channel}
                                            </Badge>
                                        </td>
                                        <td className="px-5 py-4 truncate max-w-[150px]">{item.recipient}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-1.5 font-medium">
                                                {item.status === 'SUCCESS' ? (
                                                    <><CheckCircle2 className="h-4 w-4 text-green-500" /> <span className="text-green-600">Sucesso</span></>
                                                ) : item.status === 'ERROR' ? (
                                                    <><XCircle className="h-4 w-4 text-destructive" /> <span className="text-destructive">Erro</span></>
                                                ) : (
                                                    <><AlertCircle className="h-4 w-4 text-yellow-500" /> <span className="text-yellow-600">{item.status}</span></>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><ChevronRight className="h-4 w-4" /></Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {history.length === 0 && !loading && (
                            <div className="py-20 text-center text-muted-foreground">Nenhum registro encontrado no período.</div>
                        )}
                    </div>
                </Card>
            )}

            {/* Extreme simplification of Rule Form Modal - Concept Only */}
            {isEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
                    <Card className="w-full max-w-3xl shadow-2xl animate-in zoom-in-95 duration-200 my-8">
                        <div className="p-6 border-b flex justify-between items-center bg-background sticky top-0 backdrop-blur-md z-10">
                            <div>
                                <h3 className="text-xl font-bold">{currentRule?.id ? 'Editar Regra' : 'Nova Regra de Notificação'}</h3>
                                <p className="text-sm text-muted-foreground">Configure quando e como as notificações serão enviadas.</p>
                            </div>
                            <button onClick={() => setIsEditing(false)} className="text-muted-foreground hover:text-foreground">
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {!currentRule.id && (
                                <div className="bg-primary/5 p-4 rounded-lg border border-primary/10 mb-4">
                                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
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
                                            <Button key={i} variant="outline" size="sm" onClick={() => setCurrentRule({ ...t.config, enabled: true })}>{t.label}</Button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-sm font-medium">Título da Regra</label>
                                    <input
                                        className="w-full bg-background border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        value={currentRule?.title || ''}
                                        onChange={(e) => setCurrentRule({ ...currentRule, title: e.target.value })}
                                        placeholder="Ex: Alerta de OS Atrasada"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Tipo de Gatilho</label>
                                    <select
                                        className="w-full bg-background border rounded-lg px-4 py-2"
                                        value={currentRule?.trigger_type || 'EVENT'}
                                        onChange={(e) => setCurrentRule({ ...currentRule, trigger_type: e.target.value, trigger_config: {} })}
                                    >
                                        <option value="EVENT">⚡ Evento (Imediato)</option>
                                        <option value="OFFSET">🕒 Tempo Relativo (Offset)</option>
                                        <option value="CONDITION">🔍 Condição (Estado)</option>
                                        <option value="CRON">📅 Agendamento Fixo</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Canal de Envio</label>
                                    <select
                                        className="w-full bg-background border rounded-lg px-4 py-2"
                                        value={currentRule?.channel || 'SYSTEM'}
                                        onChange={(e) => setCurrentRule({ ...currentRule, channel: e.target.value })}
                                    >
                                        <option value="SYSTEM">🔔 Sistema (Notificação Interna)</option>
                                        <option value="EMAIL">📧 E-mail</option>
                                        <option value="WHATSAPP">📱 WhatsApp</option>
                                    </select>
                                </div>

                                {/* Dynamic Config Section */}
                                <div className="col-span-2 border rounded-lg p-4 bg-muted/20 space-y-4">
                                    <h5 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Configuração do Gatilho</h5>

                                    {currentRule?.trigger_type === 'EVENT' && (
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Eventos Observados</label>
                                            <div className="flex flex-wrap gap-4">
                                                {['CREATED', 'STATUS_CHANGED', 'ASSIGNED', 'FINISHED'].map(evt => (
                                                    <label key={evt} className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-md border cursor-pointer hover:border-primary">
                                                        <input
                                                            type="checkbox"
                                                            checked={currentRule?.trigger_config?.events?.includes(evt)}
                                                            onChange={(e) => {
                                                                const events = currentRule?.trigger_config?.events || [];
                                                                const newEvents = e.target.checked
                                                                    ? [...events, evt]
                                                                    : events.filter((x: string) => x !== evt);
                                                                setCurrentRule({ ...currentRule, trigger_config: { ...currentRule.trigger_config, events: newEvents } });
                                                            }}
                                                        />
                                                        <span className="text-sm">{evt}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {currentRule?.trigger_type === 'OFFSET' && (
                                        <div className="flex gap-4 items-end">
                                            <div className="flex-1 space-y-2">
                                                <label className="text-sm font-medium">Valor</label>
                                                <input
                                                    type="number"
                                                    className="w-full bg-background border rounded-lg px-4 py-2"
                                                    value={currentRule?.trigger_config?.value || 1}
                                                    onChange={(e) => setCurrentRule({ ...currentRule, trigger_config: { ...currentRule.trigger_config, value: parseInt(e.target.value) } })}
                                                />
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <label className="text-sm font-medium">Unidade</label>
                                                <select
                                                    className="w-full bg-background border rounded-lg px-4 py-2"
                                                    value={currentRule?.trigger_config?.unit || 'HOURS'}
                                                    onChange={(e) => setCurrentRule({ ...currentRule, trigger_config: { ...currentRule.trigger_config, unit: e.target.value } })}
                                                >
                                                    <option value="MINUTES">Minutos</option>
                                                    <option value="HOURS">Horas</option>
                                                    <option value="DAYS">Dias</option>
                                                </select>
                                            </div>
                                            <div className="flex-[2] space-y-2">
                                                <label className="text-sm font-medium">Referência</label>
                                                <select
                                                    className="w-full bg-background border rounded-lg px-4 py-2"
                                                    value={currentRule?.trigger_config?.reference || 'BEFORE_DEADLINE'}
                                                    onChange={(e) => setCurrentRule({ ...currentRule, trigger_config: { ...currentRule.trigger_config, reference: e.target.value } })}
                                                >
                                                    <option value="BEFORE_DEADLINE">Antes do Prazo (Vencimento)</option>
                                                    <option value="AFTER_DEADLINE">Depois do Prazo</option>
                                                    <option value="AFTER_CREATED">Após Criação</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {currentRule?.trigger_type === 'CONDITION' && (
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Condição</label>
                                            <select
                                                className="w-full bg-background border rounded-lg px-4 py-2"
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

                                {/* Limits & Window */}
                                <div className="col-span-2 grid grid-cols-2 gap-4 border-t pt-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold uppercase text-muted-foreground">Limite de Execuções</label>
                                        <input
                                            type="number"
                                            className="w-full bg-background border rounded-lg px-4 py-2"
                                            placeholder="Infinito"
                                            value={currentRule?.max_executions || ''}
                                            onChange={(e) => setCurrentRule({ ...currentRule, max_executions: e.target.value ? parseInt(e.target.value) : null })}
                                        />
                                        <p className="text-xs text-muted-foreground">Deixe vazio para ilimitado.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold uppercase text-muted-foreground">Janela de Silêncio (Inicio - Fim)</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="time"
                                                className="w-full bg-background border rounded-lg px-2 py-2"
                                                value={currentRule?.trigger_config?.silence_window?.start || ''}
                                                onChange={(e) => setCurrentRule({
                                                    ...currentRule,
                                                    trigger_config: {
                                                        ...currentRule.trigger_config,
                                                        silence_window: { ...currentRule.trigger_config?.silence_window, start: e.target.value }
                                                    }
                                                })}
                                            />
                                            <input
                                                type="time"
                                                className="w-full bg-background border rounded-lg px-2 py-2"
                                                value={currentRule?.trigger_config?.silence_window?.end || ''}
                                                onChange={(e) => setCurrentRule({
                                                    ...currentRule,
                                                    trigger_config: {
                                                        ...currentRule.trigger_config,
                                                        silence_window: { ...currentRule.trigger_config?.silence_window, end: e.target.value }
                                                    }
                                                })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Template da Mensagem</label>
                                <textarea
                                    className="w-full bg-background border rounded-lg px-4 py-2 min-h-[100px] font-mono text-sm"
                                    value={currentRule?.message_template || ''}
                                    onChange={(e) => setCurrentRule({ ...currentRule, message_template: e.target.value })}
                                    placeholder="Ex: Olá {{cliente}}, sua OS #{{numero}} mudou para {{status}}."
                                />
                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                    <span className="bg-muted px-2 py-1 rounded cursor-pointer hover:bg-muted/80" onClick={() => setCurrentRule({ ...currentRule, message_template: (currentRule.message_template || '') + ' {{cliente}}' })}>{'{{cliente}}'}</span>
                                    <span className="bg-muted px-2 py-1 rounded cursor-pointer hover:bg-muted/80" onClick={() => setCurrentRule({ ...currentRule, message_template: (currentRule.message_template || '') + ' {{numero}}' })}>{'{{numero}}'}</span>
                                    <span className="bg-muted px-2 py-1 rounded cursor-pointer hover:bg-muted/80" onClick={() => setCurrentRule({ ...currentRule, message_template: (currentRule.message_template || '') + ' {{status}}' })}>{'{{status}}'}</span>
                                    <span className="bg-muted px-2 py-1 rounded cursor-pointer hover:bg-muted/80" onClick={() => setCurrentRule({ ...currentRule, message_template: (currentRule.message_template || '') + ' {{data_previsao}}' })}>{'{{data_previsao}}'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t bg-muted/5 flex justify-end gap-3 rounded-b-xl sticky bottom-0 backdrop-blur-md">
                            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
                            <Button onClick={async () => {
                                try {
                                    const method = currentRule.id ? 'put' : 'post';
                                    const url = currentRule.id ? `/api/ordem_servico/notificacoes/regras/${currentRule.id}` : '/api/ordem_servico/notificacoes/regras';

                                    const payload = {
                                        ...currentRule,
                                        trigger_config: JSON.stringify(currentRule.trigger_config || {}), // Ensure JSON string format for backend
                                        max_executions: currentRule.max_executions || null,
                                        recipients: currentRule.recipients || JSON.stringify([{ type: 'CLIENT' }]) // Default recipient
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
