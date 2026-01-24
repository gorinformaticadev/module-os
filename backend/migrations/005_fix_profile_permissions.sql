-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 005: Correção da Tabela de Permissões por Perfil
-- Data: 2026-01-24
-- Descrição: Garante a criação da tabela de permissões e população inicial do Admin
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Criar a tabela se não existir
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

-- 2. Inserir permissões padrão para admins de todos os tenants
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

-- 3. Adicionar comentário explicativo
COMMENT ON TABLE mod_ordem_servico_profile_permissions IS 'Matriz de permissões por perfil para o módulo de Ordem de Serviço';
