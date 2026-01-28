-- Migration 003: Notificações Avançadas (Regras, Histórico e Estados)

-- Tabela de Regras de Notificação
CREATE TABLE mod_ordem_servico_notif_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT true,
    trigger_type TEXT NOT NULL, -- 'EVENT', 'CRON', 'CONDITION'
    trigger_config JSONB NOT NULL DEFAULT '{}',
    channel TEXT NOT NULL, -- 'EMAIL', 'WHATSAPP'
    recipients JSONB NOT NULL DEFAULT '[]',
    message_template TEXT NOT NULL,
    max_executions INTEGER,
    current_executions INTEGER DEFAULT 0,
    last_execution_at TIMESTAMP WITH TIME ZONE,
    next_execution_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Histórico de Notificações
CREATE TABLE mod_ordem_servico_notif_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    rule_id UUID NOT NULL REFERENCES mod_ordem_servico_notif_rules(id) ON DELETE CASCADE,
    ordem_servico_id UUID,
    channel TEXT NOT NULL,
    recipient TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT NOT NULL, -- 'SUCCESS', 'ERROR', 'PAUSED', 'EXPIRED'
    error_message TEXT,
    fingerprint TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Estados para Controle de Notificações Condicionais (ex: Fora do Prazo)
CREATE TABLE mod_ordem_servico_notif_states (
    tenant_id TEXT NOT NULL,
    rule_id UUID NOT NULL REFERENCES mod_ordem_servico_notif_rules(id) ON DELETE CASCADE,
    ordem_servico_id UUID NOT NULL,
    last_state JSONB NOT NULL,
    last_notified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tenant_id, rule_id, ordem_servico_id)
);

-- Índices para Performance
CREATE INDEX idx_mod_os_notif_rules_tenant ON mod_ordem_servico_notif_rules(tenant_id);
CREATE INDEX idx_mod_os_notif_rules_trigger ON mod_ordem_servico_notif_rules(trigger_type);
CREATE INDEX idx_mod_os_notif_history_tenant ON mod_ordem_servico_notif_history(tenant_id);
CREATE INDEX idx_mod_os_notif_history_rule ON mod_ordem_servico_notif_history(rule_id);
CREATE INDEX idx_mod_os_notif_history_os ON mod_ordem_servico_notif_history(ordem_servico_id);
CREATE INDEX idx_mod_os_notif_history_fingerprint ON mod_ordem_servico_notif_history(fingerprint);

-- Comentários
COMMENT ON TABLE mod_ordem_servico_notif_rules IS 'Define as regras de notificação automatizada do módulo OS';
COMMENT ON TABLE mod_ordem_servico_notif_history IS 'Auditoria de todos os disparos de notificação realizados';
COMMENT ON TABLE mod_ordem_servico_notif_states IS 'Snapshots de estado para controle de recorrência em notificações baseadas em condições';
