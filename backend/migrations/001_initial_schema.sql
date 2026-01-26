-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION CONSOLIDADA V3: Módulo Ordem de Serviço
-- Versão: 3.0.0
-- Data: 2026-01-26
-- Descrição: Unificação de todas as tabelas, índices e dados iniciais para instalação limpa
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. CONFIGURAÇÕES E ESTRUTURA BASE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mod_ordem_servico_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    key VARCHAR(255) NOT NULL,
    value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_mod_ordem_servico_configs_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(id) ON DELETE CASCADE
);

-- 2. CLIENTES E PRODUTOS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mod_ordem_servico_clients (
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
    observations TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,

    CONSTRAINT fk_mod_ordem_servico_clients_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mod_ordem_servico_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) DEFAULT 'PRODUCT' NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    cost_price DECIMAL(10,2) DEFAULT 0.00,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,

    CONSTRAINT fk_mod_ordem_servico_products_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(id) ON DELETE CASCADE
);

-- 3. ORDENS DE SERVIÇO E HISTÓRICO
-- ═══════════════════════════════════════════════════════════════════════════

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
    valor_servico DECIMAL(10,2) DEFAULT 0.00,
    forma_pagamento TEXT,
    status INTEGER NOT NULL DEFAULT 0 CHECK (status >= 0 AND status <= 7),
    prioridade TEXT DEFAULT 'MEDIA',
    data_abertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_previsao TIMESTAMP,
    data_conclusao TIMESTAMP,
    origem_solicitacao TEXT NOT NULL CHECK (origem_solicitacao IN ('WHATSAPP', 'PRESENCIAL', 'SISTEMA')),
    orcamento_aprovado BOOLEAN DEFAULT FALSE,
    motivo_cancelamento TEXT,
    -- Campos de equipamento
    equipamento_tipo TEXT,
    equipamento_marca TEXT,
    equipamento_modelo TEXT,
    equipamento_serie TEXT,
    equipamento_acessorios TEXT,
    equipamento_estado TEXT,
    equipamento_fotos TEXT,
    laudo_tecnico TEXT,
    itens TEXT,
    -- Campos de formatação
    formatacao_so TEXT,
    formatacao_backup BOOLEAN DEFAULT FALSE,
    formatacao_backup_descricao TEXT,
    formatacao_senha TEXT,
    garantia_dias INTEGER DEFAULT 0,
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_mod_ordem_servico_ordens_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_mod_ordem_servico_ordens_cliente FOREIGN KEY (cliente_id)
        REFERENCES mod_ordem_servico_clients(id) ON DELETE RESTRICT,
    CONSTRAINT uk_mod_ordem_servico_ordens_numero UNIQUE (tenant_id, numero)
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

    CONSTRAINT fk_mod_ordem_servico_historico_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_mod_ordem_servico_historico_ordem FOREIGN KEY (ordem_servico_id)
        REFERENCES mod_ordem_servico_ordens(id) ON DELETE CASCADE
);

-- 4. NOTIFICAÇÕES E AGENDAMENTOS
-- ═══════════════════════════════════════════════════════════════════════════

-- Notificações gerais configuradas (Cron)
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

    CONSTRAINT fk_mod_ordem_servico_notifications_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(id) ON DELETE CASCADE
);

-- Notificações específicas por Ordem (Eventuais)
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

-- 5. SEGURANÇA E PERMISSÕES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mod_ordem_servico_user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    is_technician BOOLEAN DEFAULT FALSE,
    is_attendant BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_mod_ordem_servico_user_roles_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT uk_mod_ordem_servico_user_roles_user_tenant UNIQUE (tenant_id, user_id)
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

    CONSTRAINT fk_user_permissions_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(id) ON DELETE CASCADE,
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

    CONSTRAINT fk_mod_ordem_servico_profile_permissions_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT uk_mod_ordem_servico_profile_permissions_unique UNIQUE (tenant_id, permission_id, profile)
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

    CONSTRAINT fk_permission_audit_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(id) ON DELETE CASCADE
);

-- 6. AUXILIARES E TIPOS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mod_ordem_servico_tipos_servico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_mod_ordem_servico_tipos_servico_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT uk_mod_ordem_servico_tipos_servico_nome UNIQUE (tenant_id, nome)
);

CREATE TABLE IF NOT EXISTS mod_ordem_servico_tipos_equipamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_mod_ordem_servico_tipos_equipamento_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT uk_mod_ordem_servico_tipos_equipamento_nome UNIQUE (tenant_id, nome)
);

CREATE TABLE IF NOT EXISTS mod_ordem_servico_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'GENERAL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,

    CONSTRAINT fk_mod_ordem_servico_templates_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(id) ON DELETE CASCADE
);

-- 7. ÍNDICES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_mod_os_configs_tenant ON mod_ordem_servico_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_os_clients_tenant ON mod_ordem_servico_clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_os_clients_active ON mod_ordem_servico_clients(is_active);
CREATE INDEX IF NOT EXISTS idx_mod_os_products_tenant ON mod_ordem_servico_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_os_ordens_tenant ON mod_ordem_servico_ordens(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_os_ordens_status ON mod_ordem_servico_ordens(status);
CREATE INDEX IF NOT EXISTS idx_mod_os_ordens_numero ON mod_ordem_servico_ordens(numero);
CREATE INDEX IF NOT EXISTS idx_mod_os_historico_ordem ON mod_ordem_servico_historico(ordem_servico_id);

-- 8. TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_mod_os_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_mod_os_ordens_updated_at BEFORE UPDATE ON mod_ordem_servico_ordens FOR EACH ROW EXECUTE FUNCTION update_mod_os_timestamp();
CREATE TRIGGER trg_mod_os_configs_updated_at BEFORE UPDATE ON mod_ordem_servico_configs FOR EACH ROW EXECUTE FUNCTION update_mod_os_timestamp();
CREATE TRIGGER trg_mod_os_clients_updated_at BEFORE UPDATE ON mod_ordem_servico_clients FOR EACH ROW EXECUTE FUNCTION update_mod_os_timestamp();
CREATE TRIGGER trg_mod_os_user_roles_updated_at BEFORE UPDATE ON mod_ordem_servico_user_roles FOR EACH ROW EXECUTE FUNCTION update_mod_os_timestamp();

-- 9. DADOS INICIAIS (SEED)
-- ═══════════════════════════════════════════════════════════════════════════

-- Configurações padrão
INSERT INTO mod_ordem_servico_configs (tenant_id, key, value)
SELECT t.id, 'condicoes_execucao', 'O serviço será executado conforme descrito acima. Eventuais alterações serão comunicadas ao cliente. A garantia cobre apenas defeitos relacionados ao serviço executado.'
FROM tenants t WHERE NOT EXISTS (SELECT 1 FROM mod_ordem_servico_configs WHERE tenant_id = t.id AND key = 'condicoes_execucao');

-- Tipos de serviço padrão
INSERT INTO mod_ordem_servico_tipos_servico (tenant_id, nome, is_default)
SELECT t.id, unnest(ARRAY['Formatação', 'Manutenção', 'Suporte Técnico', 'Outros']), true
FROM tenants t ON CONFLICT DO NOTHING;

-- Tipos de equipamento padrão
INSERT INTO mod_ordem_servico_tipos_equipamento (tenant_id, nome)
SELECT t.id, unnest(ARRAY['Desktop', 'Notebook', 'Celular', 'Tablet', 'Monitor', 'Impressora', 'Outros'])
FROM tenants t ON CONFLICT DO NOTHING;

-- Permissões padrão para Admin
INSERT INTO mod_ordem_servico_profile_permissions (tenant_id, permission_id, profile, allowed)
SELECT t.id, unnest(ARRAY[
    'dashboard_view', 'dashboard_export', 'orders_view', 'orders_create', 'orders_edit', 
    'orders_delete', 'orders_assign', 'clients_view', 'clients_create', 'clients_edit', 
    'clients_delete', 'products_view', 'products_create', 'products_edit', 'products_delete',
    'config_view', 'config_users', 'config_permissions', 'config_system'
]), 'admin', true
FROM tenants t ON CONFLICT DO NOTHING;

-- Atribuir roles admin para usuários existentes (Admins do CORE)
INSERT INTO mod_ordem_servico_user_roles (tenant_id, user_id, is_technician, is_attendant, is_admin)
SELECT u."tenantId", u.id, false, true, true
FROM users u WHERE u.role IN ('ADMIN', 'SUPER_ADMIN') AND u."tenantId" IS NOT NULL
ON CONFLICT DO NOTHING;
