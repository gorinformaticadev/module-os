-- ═══════════════════════════════════════════════════════════════════════════
-- SEED: Sistema Completo de Permissões (Atualizado para Schema V3)
-- Versão: 1.1.0
-- Data: 2026-01-27
-- Descrição: Popula permissões para perfis (Técnico, Admin, etc.)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. PERMISSÕES PARA TÉCNICO
-- ═══════════════════════════════════════════════════════════════════════════

-- Dashboard
INSERT INTO mod_ordem_servico_profile_permissions (tenant_id, permission_id, profile, allowed)
SELECT t.id, 'dashboard_view', 'technician', true 
FROM tenants t
ON CONFLICT (tenant_id, permission_id, profile) DO NOTHING;

-- Orders (Visualizar, Criar, Editar)
INSERT INTO mod_ordem_servico_profile_permissions (tenant_id, permission_id, profile, allowed)
SELECT t.id, 'orders_view', 'technician', true 
FROM tenants t
ON CONFLICT (tenant_id, permission_id, profile) DO NOTHING;

INSERT INTO mod_ordem_servico_profile_permissions (tenant_id, permission_id, profile, allowed)
SELECT t.id, 'orders_create', 'technician', true 
FROM tenants t
ON CONFLICT (tenant_id, permission_id, profile) DO NOTHING;

INSERT INTO mod_ordem_servico_profile_permissions (tenant_id, permission_id, profile, allowed)
SELECT t.id, 'orders_edit', 'technician', true 
FROM tenants t
ON CONFLICT (tenant_id, permission_id, profile) DO NOTHING;

-- 2. PERMISSÕES PARA ADMIN (Reforço do que já existe na migration)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO mod_ordem_servico_profile_permissions (tenant_id, permission_id, profile, allowed)
SELECT t.id, unnest(ARRAY[
    'dashboard_view', 'dashboard_export', 'orders_view', 'orders_create', 'orders_edit',
    'orders_delete', 'orders_assign', 
    'products_view', 'products_create', 'products_edit', 'products_delete',
    'config_view', 'config_users', 'config_permissions', 'config_system'
]), 'admin', true
FROM tenants t ON CONFLICT (tenant_id, permission_id, profile) DO NOTHING;