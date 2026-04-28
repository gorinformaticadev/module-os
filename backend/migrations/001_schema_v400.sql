-- ============================================================================
-- MIGRATION: Schema unico do modulo ordem_servico
-- Versao: 4.0.0
-- Data: 2026-04-28
-- Descricao: Schema completo consolidado das migrations 001, 002 e 003.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
SET search_path TO public;

DO $$
BEGIN
    IF to_regclass('mod_clientes_clients') IS NULL
       AND to_regclass('mod_ordem_servico_clients') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE mod_ordem_servico_clients RENAME TO mod_clientes_clients';
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS mod_ordem_servico_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    key VARCHAR(255) NOT NULL,
    value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mod_os_configs_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mod_integracoes_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    key VARCHAR(255) NOT NULL,
    value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mod_integracoes_configs_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

ALTER TABLE mod_integracoes_configs
    ADD COLUMN IF NOT EXISTS tenant_id TEXT,
    ADD COLUMN IF NOT EXISTS key VARCHAR(255),
    ADD COLUMN IF NOT EXISTS value TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_mod_integracoes_configs_tenant'
          AND conrelid = 'mod_integracoes_configs'::regclass
    ) THEN
        ALTER TABLE mod_integracoes_configs
            ADD CONSTRAINT fk_mod_integracoes_configs_tenant
            FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS mod_ordem_servico_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'GENERAL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    CONSTRAINT fk_mod_os_templates_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mod_clientes_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT fk_mod_clientes_groups_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mod_clientes_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    document VARCHAR(20),
    phone_primary VARCHAR(20) NOT NULL,
    phone_secondary VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    address_zip VARCHAR(10),
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state VARCHAR(2),
    person_type VARCHAR(20),
    trade_name VARCHAR(255),
    rg VARCHAR(20),
    state_registration VARCHAR(30),
    gender VARCHAR(20),
    credit_limit NUMERIC(12,2),
    settlement_day INTEGER,
    customer_group VARCHAR(100),
    customer_group_id UUID,
    birth_date DATE,
    registration_status VARCHAR(20) DEFAULT 'ACTIVE',
    observations TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by TEXT,
    updated_by TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT fk_mod_clientes_clients_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_mod_clientes_clients_customer_group FOREIGN KEY (customer_group_id) REFERENCES mod_clientes_groups(id) ON DELETE SET NULL,
    CONSTRAINT chk_mod_clientes_clients_registration_status CHECK (registration_status IN ('ACTIVE', 'INACTIVE', 'BLOCKED')),
    CONSTRAINT chk_mod_clientes_clients_person_type CHECK (person_type IS NULL OR person_type IN ('PERSON', 'COMPANY')),
    CONSTRAINT chk_mod_clientes_clients_settlement_day CHECK (settlement_day IS NULL OR settlement_day BETWEEN 1 AND 31)
);

CREATE TABLE IF NOT EXISTS mod_clientes_client_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    client_id UUID NOT NULL,
    group_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mod_clientes_client_groups_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_mod_clientes_client_groups_client FOREIGN KEY (client_id) REFERENCES mod_clientes_clients(id) ON DELETE CASCADE,
    CONSTRAINT fk_mod_clientes_client_groups_group FOREIGN KEY (group_id) REFERENCES mod_clientes_groups(id) ON DELETE CASCADE
);

ALTER TABLE mod_clientes_clients
    ADD COLUMN IF NOT EXISTS tenant_id TEXT,
    ADD COLUMN IF NOT EXISTS name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS document VARCHAR(20),
    ADD COLUMN IF NOT EXISTS phone_primary VARCHAR(20),
    ADD COLUMN IF NOT EXISTS phone_secondary VARCHAR(20),
    ADD COLUMN IF NOT EXISTS email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS address_zip VARCHAR(10),
    ADD COLUMN IF NOT EXISTS address_street VARCHAR(255),
    ADD COLUMN IF NOT EXISTS address_number VARCHAR(20),
    ADD COLUMN IF NOT EXISTS address_complement VARCHAR(100),
    ADD COLUMN IF NOT EXISTS address_neighborhood VARCHAR(100),
    ADD COLUMN IF NOT EXISTS address_city VARCHAR(100),
    ADD COLUMN IF NOT EXISTS address_state VARCHAR(2),
    ADD COLUMN IF NOT EXISTS person_type VARCHAR(20),
    ADD COLUMN IF NOT EXISTS trade_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS rg VARCHAR(20),
    ADD COLUMN IF NOT EXISTS state_registration VARCHAR(30),
    ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
    ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(12,2),
    ADD COLUMN IF NOT EXISTS settlement_day INTEGER,
    ADD COLUMN IF NOT EXISTS customer_group VARCHAR(100),
    ADD COLUMN IF NOT EXISTS customer_group_id UUID,
    ADD COLUMN IF NOT EXISTS birth_date DATE,
    ADD COLUMN IF NOT EXISTS registration_status VARCHAR(20) DEFAULT 'ACTIVE',
    ADD COLUMN IF NOT EXISTS observations TEXT,
    ADD COLUMN IF NOT EXISTS image_url TEXT,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS created_by TEXT,
    ADD COLUMN IF NOT EXISTS updated_by TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

UPDATE mod_clientes_clients
SET registration_status = CASE
    WHEN COALESCE(is_active, true) = true THEN 'ACTIVE'
    ELSE 'INACTIVE'
END
WHERE registration_status IS NULL;

ALTER TABLE mod_clientes_clients
    DROP CONSTRAINT IF EXISTS chk_mod_clientes_clients_registration_status,
    DROP CONSTRAINT IF EXISTS chk_mod_clientes_clients_person_type,
    DROP CONSTRAINT IF EXISTS chk_mod_clientes_clients_settlement_day;

ALTER TABLE mod_clientes_clients
    ADD CONSTRAINT chk_mod_clientes_clients_registration_status
        CHECK (registration_status IN ('ACTIVE', 'INACTIVE', 'BLOCKED')),
    ADD CONSTRAINT chk_mod_clientes_clients_person_type
        CHECK (person_type IS NULL OR person_type IN ('PERSON', 'COMPANY')),
    ADD CONSTRAINT chk_mod_clientes_clients_settlement_day
        CHECK (settlement_day IS NULL OR settlement_day BETWEEN 1 AND 31);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_mod_clientes_clients_tenant'
          AND conrelid = 'mod_clientes_clients'::regclass
    ) THEN
        ALTER TABLE mod_clientes_clients
            ADD CONSTRAINT fk_mod_clientes_clients_tenant
            FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_mod_clientes_clients_customer_group'
          AND conrelid = 'mod_clientes_clients'::regclass
    ) THEN
        ALTER TABLE mod_clientes_clients
            ADD CONSTRAINT fk_mod_clientes_clients_customer_group
            FOREIGN KEY (customer_group_id) REFERENCES mod_clientes_groups(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS mod_ordem_servico_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) DEFAULT 'PRODUCT' NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    cost_price DECIMAL(10, 2) DEFAULT 0.00,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT fk_mod_os_products_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mod_ordem_servico_ordens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    numero TEXT NOT NULL,
    cliente_id UUID NOT NULL,
    usuario_responsavel_id TEXT NOT NULL,
    tipo_servico TEXT NOT NULL,
    descricao TEXT NOT NULL,
    observacoes_internas TEXT,
    observacoes_cliente TEXT,
    valor_servico DECIMAL(10, 2) DEFAULT 0.00,
    forma_pagamento TEXT,
    status INTEGER NOT NULL DEFAULT 0 CHECK (status >= 0 AND status <= 9),
    prioridade TEXT DEFAULT 'MEDIA',
    data_abertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_previsao TIMESTAMP,
    data_conclusao TIMESTAMP,
    origem_solicitacao TEXT NOT NULL CHECK (origem_solicitacao IN ('WHATSAPP', 'PRESENCIAL', 'SISTEMA')),
    orcamento_aprovado BOOLEAN DEFAULT FALSE,
    motivo_cancelamento TEXT,
    equipamento_tipo TEXT,
    equipamento_marca TEXT,
    equipamento_modelo TEXT,
    equipamento_serie TEXT,
    equipamento_acessorios TEXT,
    equipamento_estado TEXT,
    equipamento_fotos TEXT,
    laudo_tecnico TEXT,
    itens TEXT,
    formatting_so TEXT,
    formatting_backup BOOLEAN DEFAULT FALSE,
    formatting_backup_descricao TEXT,
    formatting_senha TEXT,
    garantia_dias INTEGER DEFAULT 0,
    valor_conservacao DECIMAL(10, 2) DEFAULT 0,
    dias_atraso INTEGER DEFAULT 0,
    justificativa_conservacao TEXT,
    data_limite_retirada TIMESTAMP,
    data_retirada TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mod_os_ordens_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_mod_os_ordens_cliente FOREIGN KEY (cliente_id) REFERENCES mod_clientes_clients(id) ON DELETE RESTRICT,
    CONSTRAINT uk_mod_os_ordens_numero UNIQUE (tenant_id, numero)
);

CREATE TABLE IF NOT EXISTS mod_ordem_servico_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    ordem_servico_id UUID NOT NULL,
    usuario_id TEXT NOT NULL,
    acao TEXT NOT NULL,
    valor_anterior TEXT,
    valor_novo TEXT,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mod_os_historico_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_mod_os_historico_ordem FOREIGN KEY (ordem_servico_id) REFERENCES mod_ordem_servico_ordens(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mod_ordem_servico_status_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    ordem_servico_id UUID NOT NULL,
    status_anterior INTEGER NOT NULL,
    status_novo INTEGER NOT NULL,
    usuario_id TEXT NOT NULL,
    data_alteracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_status_hist_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_status_hist_ordem FOREIGN KEY (ordem_servico_id) REFERENCES mod_ordem_servico_ordens(id) ON DELETE CASCADE,
    CONSTRAINT chk_status_hist_anterior CHECK (status_anterior >= 0 AND status_anterior <= 9),
    CONSTRAINT chk_status_hist_novo CHECK (status_novo >= 0 AND status_novo <= 9)
);

CREATE TABLE IF NOT EXISTS mod_ordem_servico_pagamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    ordem_servico_id UUID NOT NULL,
    forma_pagamento VARCHAR(50) NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    parcelas INTEGER DEFAULT 1,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT NOT NULL,
    CONSTRAINT fk_pagamento_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_pagamento_ordem FOREIGN KEY (ordem_servico_id) REFERENCES mod_ordem_servico_ordens(id) ON DELETE CASCADE,
    CONSTRAINT chk_pagamento_valor CHECK (valor > 0),
    CONSTRAINT chk_pagamento_parcelas CHECK (parcelas >= 1 AND parcelas <= 12)
);

CREATE TABLE IF NOT EXISTS mod_ordem_servico_alertas_abandono (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    ordem_servico_id UUID NOT NULL,
    numero_alerta INTEGER NOT NULL,
    data_envio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    meio_comunicacao VARCHAR(50) NOT NULL,
    enviado_por TEXT NOT NULL,
    mensagem TEXT,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_alerta_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_alerta_ordem FOREIGN KEY (ordem_servico_id) REFERENCES mod_ordem_servico_ordens(id) ON DELETE CASCADE,
    CONSTRAINT chk_alerta_numero CHECK (numero_alerta BETWEEN 1 AND 3),
    CONSTRAINT chk_alerta_meio CHECK (meio_comunicacao IN ('WHATSAPP', 'EMAIL', 'SMS', 'CARTA', 'TELEFONE')),
    CONSTRAINT uk_alerta_ordem_numero UNIQUE (ordem_servico_id, numero_alerta)
);

CREATE TABLE IF NOT EXISTS mod_ordem_servico_anexos_abandono (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    alerta_id UUID NOT NULL,
    nome_arquivo VARCHAR(255) NOT NULL,
    tipo_arquivo VARCHAR(100) NOT NULL,
    tamanho_bytes INTEGER,
    url_arquivo TEXT NOT NULL,
    descricao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by TEXT NOT NULL,
    CONSTRAINT fk_anexo_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_anexo_alerta FOREIGN KEY (alerta_id) REFERENCES mod_ordem_servico_alertas_abandono(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mod_ordem_servico_user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    is_technician BOOLEAN DEFAULT FALSE,
    is_attendant BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mod_os_user_roles_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT uk_mod_os_user_roles_user_tenant UNIQUE (tenant_id, user_id)
);

CREATE TABLE IF NOT EXISTS mod_ordem_servico_user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    allowed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT NOT NULL,
    CONSTRAINT fk_user_permissions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT uk_user_permissions UNIQUE (tenant_id, user_id, resource, action)
);

CREATE TABLE IF NOT EXISTS mod_ordem_servico_profile_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    permission_id TEXT NOT NULL,
    profile TEXT NOT NULL CHECK (profile IN ('admin', 'technician', 'attendant')),
    allowed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mod_os_profile_permissions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT uk_mod_os_profile_permissions_unique UNIQUE (tenant_id, permission_id, profile)
);

CREATE TABLE IF NOT EXISTS mod_ordem_servico_permission_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_value BOOLEAN,
    new_value BOOLEAN NOT NULL,
    changed_by TEXT NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    CONSTRAINT fk_permission_audit_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mod_ordem_servico_tipos_servico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mod_os_tipos_servico_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT uk_mod_os_tipos_servico_nome UNIQUE (tenant_id, nome)
);

CREATE TABLE IF NOT EXISTS mod_ordem_servico_tipos_equipamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mod_os_tipos_equipamento_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT uk_mod_os_tipos_equipamento_nome UNIQUE (tenant_id, nome)
);

CREATE TABLE IF NOT EXISTS mod_ordem_servico_notification_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    audience VARCHAR(50) DEFAULT 'all',
    cron_expression VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mod_os_notifications_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mod_ordem_servico_order_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    ordem_id UUID NOT NULL,
    type TEXT NOT NULL,
    scheduled_for TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending' NOT NULL,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_notif_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_notif_ordem FOREIGN KEY (ordem_id) REFERENCES mod_ordem_servico_ordens(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mod_ordem_servico_notif_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT true,
    trigger_type TEXT NOT NULL,
    trigger_config JSONB NOT NULL DEFAULT '{}',
    channel TEXT NOT NULL,
    recipients JSONB NOT NULL DEFAULT '[]',
    message_template TEXT NOT NULL,
    max_executions INTEGER,
    current_executions INTEGER DEFAULT 0,
    last_execution_at TIMESTAMP WITH TIME ZONE,
    next_execution_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mod_os_notif_rules_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mod_ordem_servico_notif_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    rule_id UUID NOT NULL,
    ordem_servico_id UUID,
    channel TEXT NOT NULL,
    recipient TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT NOT NULL,
    error_message TEXT,
    fingerprint TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mod_os_notif_history_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_mod_os_notif_history_rule FOREIGN KEY (rule_id) REFERENCES mod_ordem_servico_notif_rules(id) ON DELETE CASCADE,
    CONSTRAINT fk_mod_os_notif_history_ordem FOREIGN KEY (ordem_servico_id) REFERENCES mod_ordem_servico_ordens(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS mod_ordem_servico_notif_states (
    tenant_id TEXT NOT NULL,
    rule_id UUID NOT NULL,
    ordem_servico_id UUID NOT NULL,
    last_state JSONB NOT NULL,
    last_notified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tenant_id, rule_id, ordem_servico_id),
    CONSTRAINT fk_mod_os_notif_states_rule FOREIGN KEY (rule_id) REFERENCES mod_ordem_servico_notif_rules(id) ON DELETE CASCADE,
    CONSTRAINT fk_mod_os_notif_states_ordem FOREIGN KEY (ordem_servico_id) REFERENCES mod_ordem_servico_ordens(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_mod_os_configs_tenant ON mod_ordem_servico_configs(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS uk_mod_os_configs_tenant_key ON mod_ordem_servico_configs(tenant_id, key);
CREATE INDEX IF NOT EXISTS idx_mod_integracoes_configs_tenant ON mod_integracoes_configs(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS uk_mod_integracoes_configs_tenant_key ON mod_integracoes_configs(tenant_id, key);
CREATE INDEX IF NOT EXISTS idx_mod_os_templates_tenant ON mod_ordem_servico_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_clientes_groups_tenant ON mod_clientes_groups(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_clientes_groups_deleted ON mod_clientes_groups(deleted_at) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uk_mod_clientes_groups_tenant_name ON mod_clientes_groups(tenant_id, LOWER(name)) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_mod_clientes_clients_tenant ON mod_clientes_clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_clientes_clients_active ON mod_clientes_clients(is_active);
CREATE INDEX IF NOT EXISTS idx_mod_clientes_clients_registration_status ON mod_clientes_clients(registration_status);
CREATE INDEX IF NOT EXISTS idx_mod_clientes_clients_person_type ON mod_clientes_clients(person_type);
CREATE INDEX IF NOT EXISTS idx_mod_clientes_clients_customer_group_id ON mod_clientes_clients(customer_group_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_mod_clientes_clients_tenant_created_by ON mod_clientes_clients(tenant_id, created_by) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_mod_clientes_clients_tenant_updated_by ON mod_clientes_clients(tenant_id, updated_by) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uk_mod_clientes_client_groups_tenant_client_group ON mod_clientes_client_groups(tenant_id, client_id, group_id);
CREATE INDEX IF NOT EXISTS idx_mod_clientes_client_groups_client ON mod_clientes_client_groups(client_id);
CREATE INDEX IF NOT EXISTS idx_mod_clientes_client_groups_group ON mod_clientes_client_groups(group_id);
CREATE INDEX IF NOT EXISTS idx_mod_os_products_tenant ON mod_ordem_servico_products(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS uk_mod_os_products_tenant_code ON mod_ordem_servico_products(tenant_id, code);
CREATE INDEX IF NOT EXISTS idx_mod_os_ordens_tenant ON mod_ordem_servico_ordens(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_os_ordens_status ON mod_ordem_servico_ordens(status);
CREATE INDEX IF NOT EXISTS idx_mod_os_ordens_numero ON mod_ordem_servico_ordens(numero);
CREATE INDEX IF NOT EXISTS idx_mod_os_ordens_data_conclusao ON mod_ordem_servico_ordens(data_conclusao) WHERE status = 6;
CREATE INDEX IF NOT EXISTS idx_mod_os_historico_tenant ON mod_ordem_servico_historico(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_os_historico_ordem ON mod_ordem_servico_historico(ordem_servico_id);
CREATE INDEX IF NOT EXISTS idx_status_hist_tenant ON mod_ordem_servico_status_historico(tenant_id);
CREATE INDEX IF NOT EXISTS idx_status_hist_ordem ON mod_ordem_servico_status_historico(ordem_servico_id);
CREATE INDEX IF NOT EXISTS idx_status_hist_data ON mod_ordem_servico_status_historico(data_alteracao DESC);
CREATE INDEX IF NOT EXISTS idx_pagamentos_tenant ON mod_ordem_servico_pagamentos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_ordem ON mod_ordem_servico_pagamentos(ordem_servico_id);
CREATE INDEX IF NOT EXISTS idx_alertas_abandono_tenant ON mod_ordem_servico_alertas_abandono(tenant_id);
CREATE INDEX IF NOT EXISTS idx_alertas_abandono_ordem ON mod_ordem_servico_alertas_abandono(ordem_servico_id);
CREATE INDEX IF NOT EXISTS idx_anexos_abandono_tenant ON mod_ordem_servico_anexos_abandono(tenant_id);
CREATE INDEX IF NOT EXISTS idx_anexos_abandono_alerta ON mod_ordem_servico_anexos_abandono(alerta_id);
CREATE INDEX IF NOT EXISTS idx_mod_os_user_roles_tenant ON mod_ordem_servico_user_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_tenant ON mod_ordem_servico_user_permissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profile_permissions_tenant ON mod_ordem_servico_profile_permissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_permission_audit_tenant ON mod_ordem_servico_permission_audit(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_os_tipos_servico_tenant ON mod_ordem_servico_tipos_servico(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_os_tipos_equipamento_tenant ON mod_ordem_servico_tipos_equipamento(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_os_notifications_tenant ON mod_ordem_servico_notification_schedules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_notif_tenant ON mod_ordem_servico_order_notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_notif_ordem ON mod_ordem_servico_order_notifications(ordem_id);
CREATE INDEX IF NOT EXISTS idx_mod_os_notif_rules_tenant ON mod_ordem_servico_notif_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_os_notif_rules_trigger ON mod_ordem_servico_notif_rules(trigger_type);
CREATE INDEX IF NOT EXISTS idx_mod_os_notif_history_tenant ON mod_ordem_servico_notif_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_os_notif_history_rule ON mod_ordem_servico_notif_history(rule_id);
CREATE INDEX IF NOT EXISTS idx_mod_os_notif_history_ordem ON mod_ordem_servico_notif_history(ordem_servico_id);
CREATE INDEX IF NOT EXISTS idx_mod_os_notif_history_fingerprint ON mod_ordem_servico_notif_history(fingerprint);

CREATE OR REPLACE FUNCTION update_mod_os_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_mod_clientes_groups_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_mod_os_ordens_updated_at ON mod_ordem_servico_ordens;
CREATE TRIGGER trg_mod_os_ordens_updated_at BEFORE UPDATE ON mod_ordem_servico_ordens FOR EACH ROW EXECUTE FUNCTION update_mod_os_timestamp();

DROP TRIGGER IF EXISTS trg_mod_os_configs_updated_at ON mod_ordem_servico_configs;
CREATE TRIGGER trg_mod_os_configs_updated_at BEFORE UPDATE ON mod_ordem_servico_configs FOR EACH ROW EXECUTE FUNCTION update_mod_os_timestamp();

DROP TRIGGER IF EXISTS trg_mod_integracoes_configs_updated_at ON mod_integracoes_configs;
CREATE TRIGGER trg_mod_integracoes_configs_updated_at BEFORE UPDATE ON mod_integracoes_configs FOR EACH ROW EXECUTE FUNCTION update_mod_os_timestamp();

DROP TRIGGER IF EXISTS trg_mod_clientes_clients_updated_at ON mod_clientes_clients;
CREATE TRIGGER trg_mod_clientes_clients_updated_at BEFORE UPDATE ON mod_clientes_clients FOR EACH ROW EXECUTE FUNCTION update_mod_os_timestamp();

DROP TRIGGER IF EXISTS trg_mod_clientes_groups_updated_at ON mod_clientes_groups;
CREATE TRIGGER trg_mod_clientes_groups_updated_at BEFORE UPDATE ON mod_clientes_groups FOR EACH ROW EXECUTE FUNCTION update_mod_clientes_groups_timestamp();

DROP TRIGGER IF EXISTS trg_mod_os_user_roles_updated_at ON mod_ordem_servico_user_roles;
CREATE TRIGGER trg_mod_os_user_roles_updated_at BEFORE UPDATE ON mod_ordem_servico_user_roles FOR EACH ROW EXECUTE FUNCTION update_mod_os_timestamp();

CREATE OR REPLACE VIEW vw_mod_os_alertas_retirada AS
SELECT
    tenant_id,
    COUNT(*) AS total_pendentes,
    COUNT(*) FILTER (WHERE dias_desde_finalizacao > 30) AS urgentes,
    COUNT(*) FILTER (WHERE dias_desde_finalizacao BETWEEN 15 AND 30) AS atencao,
    COUNT(*) FILTER (WHERE dias_desde_finalizacao < 15) AS normal,
    COUNT(*) FILTER (WHERE dias_desde_finalizacao > prazo_config) AS cobranca_ativa
FROM (
    SELECT
        o.tenant_id,
        o.id,
        EXTRACT(DAY FROM (NOW() - o.data_conclusao))::int AS dias_desde_finalizacao,
        COALESCE((
            SELECT c.value::int
            FROM mod_ordem_servico_configs c
            WHERE c.tenant_id = o.tenant_id AND c.key = 'prazo_retirada_dias'
        ), 30) AS prazo_config
    FROM mod_ordem_servico_ordens o
    WHERE o.status = 6
      AND o.data_conclusao IS NOT NULL
) sub
GROUP BY tenant_id;
