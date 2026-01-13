-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION MASTER V2: Módulo Ordem de Serviço - Estrutura Completa
-- Versão: 2.1.0 - Versão corrigida sem problemas de referência
-- Data: 2026-01-10
-- Descrição: Migration unificada com todas as tabelas e dados do módulo
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. TABELA DE CONFIGURAÇÕES DO MÓDULO
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

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. TABELA DE AGENDAMENTO DE NOTIFICAÇÕES
-- ═══════════════════════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. TABELA DE CLIENTES
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
    -- Campos de endereço detalhado
    address_zip VARCHAR(10),
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state VARCHAR(2),
    -- Campos adicionais
    observations TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,

    CONSTRAINT fk_mod_ordem_servico_clients_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(id) ON DELETE CASCADE
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. TABELA DE PRODUTOS/SERVIÇOS
-- ═══════════════════════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. TABELA DE TEMPLATES (DOCUMENTOS/LAUDOS)
-- ═══════════════════════════════════════════════════════════════════════════

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


-- ═══════════════════════════════════════════════════════════════════════════
-- 6. SISTEMA DE PERMISSÕES - TABELAS
-- ═══════════════════════════════════════════════════════════════════════════

-- 6.1 Permissões individuais de usuários
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

-- 6.2 Templates de perfis
CREATE TABLE IF NOT EXISTS mod_ordem_servico_profile_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_profile_templates_name UNIQUE (name)
);

-- 6.3 Permissões dos templates
CREATE TABLE IF NOT EXISTS mod_ordem_servico_template_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    allowed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_template_permissions_template FOREIGN KEY (template_id)
        REFERENCES mod_ordem_servico_profile_templates(id) ON DELETE CASCADE,
    CONSTRAINT uk_template_permissions UNIQUE (template_id, resource, action)
);

-- 6.4 Auditoria de alterações de permissões
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

-- 6.5 Permissões por perfil
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

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. TABELAS PRINCIPAIS - ORDENS DE SERVIÇO
-- ═══════════════════════════════════════════════════════════════════════════

-- 7.1 Tabela principal de Ordens de Serviço
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
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_mod_ordem_servico_ordens_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(id) ON DELETE CASCADE,
    
    CONSTRAINT fk_mod_ordem_servico_ordens_cliente FOREIGN KEY (cliente_id)
        REFERENCES mod_ordem_servico_clients(id) ON DELETE RESTRICT,
    
    CONSTRAINT uk_mod_ordem_servico_ordens_numero UNIQUE (tenant_id, numero)
);

-- 7.2 Tabela de histórico das Ordens de Serviço
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

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. TABELAS DE TIPOS (SERVIÇOS E EQUIPAMENTOS)
-- ═══════════════════════════════════════════════════════════════════════════

-- 8.1 Tipos de serviço
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

-- 8.2 Tipos de equipamento
CREATE TABLE IF NOT EXISTS mod_ordem_servico_tipos_equipamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_mod_ordem_servico_tipos_equipamento_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(id) ON DELETE CASCADE,
    
    CONSTRAINT uk_mod_ordem_servico_tipos_equipamento_nome UNIQUE (tenant_id, nome)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 9. TABELA DE PAPÉIS DE USUÁRIOS NO MÓDULO
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

-- ═══════════════════════════════════════════════════════════════════════════
-- 10. CRIAÇÃO DE TODOS OS ÍNDICES (APÓS TODAS AS TABELAS)
-- ═══════════════════════════════════════════════════════════════════════════

-- Índices para configs
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_configs_tenant_id ON mod_ordem_servico_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_configs_key ON mod_ordem_servico_configs(key);

-- Índices para notificações
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_notif_enabled ON mod_ordem_servico_notification_schedules(enabled);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_notif_tenant ON mod_ordem_servico_notification_schedules(tenant_id);

-- Índices para clientes
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_clients_tenant_id ON mod_ordem_servico_clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_clients_name ON mod_ordem_servico_clients(name);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_clients_document ON mod_ordem_servico_clients(document);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_clients_city ON mod_ordem_servico_clients(address_city);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_clients_state ON mod_ordem_servico_clients(address_state);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_clients_active ON mod_ordem_servico_clients(is_active);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_clients_email ON mod_ordem_servico_clients(email);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_clients_address_zip ON mod_ordem_servico_clients(address_zip);

-- Índices para produtos
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_products_tenant_id ON mod_ordem_servico_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_products_code ON mod_ordem_servico_products(code);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_products_name ON mod_ordem_servico_products(name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mod_ordem_servico_products_unique_code 
ON mod_ordem_servico_products(tenant_id, code) 
WHERE deleted_at IS NULL;

-- Índices para templates
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_templates_tenant ON mod_ordem_servico_templates(tenant_id);

-- Índices para sistema de permissões
CREATE INDEX IF NOT EXISTS idx_user_permissions_tenant_id ON mod_ordem_servico_user_permissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON mod_ordem_servico_user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_resource ON mod_ordem_servico_user_permissions(resource);
CREATE INDEX IF NOT EXISTS idx_user_permissions_tenant_user ON mod_ordem_servico_user_permissions(tenant_id, user_id);

CREATE INDEX IF NOT EXISTS idx_profile_templates_name ON mod_ordem_servico_profile_templates(name);
CREATE INDEX IF NOT EXISTS idx_profile_templates_system ON mod_ordem_servico_profile_templates(is_system);

CREATE INDEX IF NOT EXISTS idx_template_permissions_template_id ON mod_ordem_servico_template_permissions(template_id);
CREATE INDEX IF NOT EXISTS idx_template_permissions_resource ON mod_ordem_servico_template_permissions(resource);

CREATE INDEX IF NOT EXISTS idx_permission_audit_tenant_id ON mod_ordem_servico_permission_audit(tenant_id);
CREATE INDEX IF NOT EXISTS idx_permission_audit_user_id ON mod_ordem_servico_permission_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_permission_audit_changed_at ON mod_ordem_servico_permission_audit(changed_at);
CREATE INDEX IF NOT EXISTS idx_permission_audit_tenant_user ON mod_ordem_servico_permission_audit(tenant_id, user_id);

CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_profile_permissions_tenant_id ON mod_ordem_servico_profile_permissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_profile_permissions_permission_id ON mod_ordem_servico_profile_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_profile_permissions_profile ON mod_ordem_servico_profile_permissions(profile);

-- Índices para ordens de serviço
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_ordens_tenant_id ON mod_ordem_servico_ordens(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_ordens_cliente_id ON mod_ordem_servico_ordens(cliente_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_ordens_status ON mod_ordem_servico_ordens(status);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_ordens_data_abertura ON mod_ordem_servico_ordens(data_abertura);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_ordens_numero ON mod_ordem_servico_ordens(numero);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_ordens_usuario_responsavel ON mod_ordem_servico_ordens(usuario_responsavel_id);

CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_historico_tenant_id ON mod_ordem_servico_historico(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_historico_ordem_id ON mod_ordem_servico_historico(ordem_servico_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_historico_usuario_id ON mod_ordem_servico_historico(usuario_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_historico_created_at ON mod_ordem_servico_historico(created_at);

-- Índices para tipos
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_tipos_servico_tenant_id ON mod_ordem_servico_tipos_servico(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_tipos_equipamento_tenant_id ON mod_ordem_servico_tipos_equipamento(tenant_id);

-- Índices para user roles
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_user_roles_tenant_id ON mod_ordem_servico_user_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_user_roles_user_id ON mod_ordem_servico_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_user_roles_technician ON mod_ordem_servico_user_roles(is_technician);

-- ═══════════════════════════════════════════════════════════════════════════
-- 11. TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA DE TIMESTAMPS
-- ═══════════════════════════════════════════════════════════════════════════

-- Trigger para ordens de serviço
CREATE OR REPLACE FUNCTION update_mod_ordem_servico_ordens_updated_at()
RETURNS TRIGGER AS '
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
' language 'plpgsql';

CREATE TRIGGER update_mod_ordem_servico_ordens_updated_at
    BEFORE UPDATE ON mod_ordem_servico_ordens
    FOR EACH ROW
    EXECUTE FUNCTION update_mod_ordem_servico_ordens_updated_at();

-- Trigger para user roles
CREATE OR REPLACE FUNCTION update_mod_ordem_servico_user_roles_updated_at()
RETURNS TRIGGER AS '
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
' language 'plpgsql';

CREATE TRIGGER trigger_mod_ordem_servico_user_roles_updated_at
    BEFORE UPDATE ON mod_ordem_servico_user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_mod_ordem_servico_user_roles_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- 12. INSERÇÃO DE DADOS PADRÃO
-- ═══════════════════════════════════════════════════════════════════════════

-- 12.1 Tipos de serviço padrão
INSERT INTO mod_ordem_servico_tipos_servico (tenant_id, nome, is_default)
SELECT 
    t.id as tenant_id,
    'Formatação' as nome,
    true as is_default
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_tipos_servico 
    WHERE tenant_id = t.id AND nome = 'Formatação'
);

INSERT INTO mod_ordem_servico_tipos_servico (tenant_id, nome, is_default)
SELECT 
    t.id as tenant_id,
    'Manutenção' as nome,
    true as is_default
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_tipos_servico 
    WHERE tenant_id = t.id AND nome = 'Manutenção'
);

INSERT INTO mod_ordem_servico_tipos_servico (tenant_id, nome, is_default)
SELECT 
    t.id as tenant_id,
    'Suporte Técnico' as nome,
    true as is_default
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_tipos_servico 
    WHERE tenant_id = t.id AND nome = 'Suporte Técnico'
);

INSERT INTO mod_ordem_servico_tipos_servico (tenant_id, nome, is_default)
SELECT 
    t.id as tenant_id,
    'Outros' as nome,
    true as is_default
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_tipos_servico 
    WHERE tenant_id = t.id AND nome = 'Outros'
);

-- 12.2 Tipos de equipamento padrão
INSERT INTO mod_ordem_servico_tipos_equipamento (tenant_id, nome)
SELECT 
    t.id as tenant_id,
    'Desktop' as nome
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_tipos_equipamento 
    WHERE tenant_id = t.id AND nome = 'Desktop'
);

INSERT INTO mod_ordem_servico_tipos_equipamento (tenant_id, nome)
SELECT 
    t.id as tenant_id,
    'Notebook' as nome
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_tipos_equipamento 
    WHERE tenant_id = t.id AND nome = 'Notebook'
);

INSERT INTO mod_ordem_servico_tipos_equipamento (tenant_id, nome)
SELECT 
    t.id as tenant_id,
    'Celular' as nome
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_tipos_equipamento 
    WHERE tenant_id = t.id AND nome = 'Celular'
);

INSERT INTO mod_ordem_servico_tipos_equipamento (tenant_id, nome)
SELECT 
    t.id as tenant_id,
    'Tablet' as nome
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_tipos_equipamento 
    WHERE tenant_id = t.id AND nome = 'Tablet'
);

INSERT INTO mod_ordem_servico_tipos_equipamento (tenant_id, nome)
SELECT 
    t.id as tenant_id,
    'All-in-One' as nome
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_tipos_equipamento 
    WHERE tenant_id = t.id AND nome = 'All-in-One'
);

INSERT INTO mod_ordem_servico_tipos_equipamento (tenant_id, nome)
SELECT 
    t.id as tenant_id,
    'Monitor' as nome
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_tipos_equipamento 
    WHERE tenant_id = t.id AND nome = 'Monitor'
);

INSERT INTO mod_ordem_servico_tipos_equipamento (tenant_id, nome)
SELECT 
    t.id as tenant_id,
    'Impressora' as nome
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_tipos_equipamento 
    WHERE tenant_id = t.id AND nome = 'Impressora'
);

INSERT INTO mod_ordem_servico_tipos_equipamento (tenant_id, nome)
SELECT 
    t.id as tenant_id,
    'Outros' as nome
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_tipos_equipamento 
    WHERE tenant_id = t.id AND nome = 'Outros'
);

-- 12.3 Permissões padrão para perfis de admin
INSERT INTO mod_ordem_servico_profile_permissions (tenant_id, permission_id, profile, allowed) 
SELECT 
    t.id as tenant_id,
    unnest(ARRAY[
        'dashboard_view', 'dashboard_export',
        'orders_view', 'orders_create', 'orders_edit', 'orders_delete', 'orders_assign',
        'clients_view', 'clients_create', 'clients_edit', 'clients_delete',
        'products_view', 'products_create', 'products_edit', 'products_delete',
        'config_view', 'config_users', 'config_permissions', 'config_system'
    ]) as permission_id,
    'admin' as profile,
    true as allowed
FROM tenants t
ON CONFLICT (tenant_id, permission_id, profile) DO NOTHING;

-- 12.4 Permissões padrão para técnicos
INSERT INTO mod_ordem_servico_profile_permissions (tenant_id, permission_id, profile, allowed) 
SELECT 
    t.id as tenant_id,
    unnest(ARRAY[
        'dashboard_view',
        'orders_view', 'orders_edit',
        'clients_view',
        'products_view'
    ]) as permission_id,
    'technician' as profile,
    true as allowed
FROM tenants t
ON CONFLICT (tenant_id, permission_id, profile) DO NOTHING;

-- 12.5 Permissões padrão para atendentes
INSERT INTO mod_ordem_servico_profile_permissions (tenant_id, permission_id, profile, allowed) 
SELECT 
    t.id as tenant_id,
    unnest(ARRAY[
        'dashboard_view',
        'orders_view',
        'clients_view', 'clients_create', 'clients_edit'
    ]) as permission_id,
    'attendant' as profile,
    true as allowed
FROM tenants t
ON CONFLICT (tenant_id, permission_id, profile) DO NOTHING;

-- 12.6 User roles padrão para usuários existentes
INSERT INTO mod_ordem_servico_user_roles (tenant_id, user_id, is_technician, is_attendant, is_admin)
SELECT 
    u."tenantId" as tenant_id,
    u.id as user_id,
    false as is_technician,
    true as is_attendant,
    (u.role = 'SUPER_ADMIN' OR u.role = 'ADMIN') as is_admin
FROM users u
WHERE u."tenantId" IS NOT NULL 
  AND u."isLocked" = false
  AND NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_user_roles 
    WHERE tenant_id = u."tenantId" AND user_id = u.id
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- FIM DA MIGRATION MASTER V2
-- ═══════════════════════════════════════════════════════════════════════════