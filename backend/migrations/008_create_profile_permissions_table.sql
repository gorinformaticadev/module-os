-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Criação da tabela de permissões por perfil do módulo ordem_servico
-- Versão: 1.0.0
-- Data: 2026-01-03
-- ═══════════════════════════════════════════════════════════════════════════

-- Tabela de permissões por perfil
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
    
    -- Unique constraint to prevent duplicate permission entries per profile per tenant
    CONSTRAINT uk_mod_ordem_servico_profile_permissions_unique UNIQUE (tenant_id, permission_id, profile)
);

CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_profile_permissions_tenant_id ON mod_ordem_servico_profile_permissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_profile_permissions_permission_id ON mod_ordem_servico_profile_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_profile_permissions_profile ON mod_ordem_servico_profile_permissions(profile);

-- Inserir permissões padrão para cada perfil
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

-- Permissões padrão para técnicos
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

-- Permissões padrão para atendentes
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