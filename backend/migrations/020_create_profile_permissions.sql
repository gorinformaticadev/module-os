-- Migration: Create profile permissions table
-- Description: Table to store permissions for each profile (admin, technician, attendant)

CREATE TABLE IF NOT EXISTS mod_ordem_servico_profile_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) NOT NULL,
    profile VARCHAR(50) NOT NULL, -- 'admin', 'technician', 'attendant'
    permission_id VARCHAR(100) NOT NULL, -- e.g., 'orders_view', 'clients_create'
    allowed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(tenant_id, profile, permission_id),
    CHECK (profile IN ('admin', 'technician', 'attendant'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profile_permissions_tenant_profile 
ON mod_ordem_servico_profile_permissions(tenant_id, profile);

CREATE INDEX IF NOT EXISTS idx_profile_permissions_permission 
ON mod_ordem_servico_profile_permissions(permission_id);

-- Insert default permissions for admin (all permissions allowed)
INSERT INTO mod_ordem_servico_profile_permissions (tenant_id, profile, permission_id, allowed)
SELECT 
    'default' as tenant_id,
    'admin' as profile,
    permission_id,
    true as allowed
FROM (
    VALUES 
    ('dashboard_view'),
    ('dashboard_export'),
    ('orders_view'),
    ('orders_create'),
    ('orders_edit'),
    ('orders_delete'),
    ('orders_assign'),
    ('clients_view'),
    ('clients_create'),
    ('clients_edit'),
    ('clients_delete'),
    ('products_view'),
    ('products_create'),
    ('products_edit'),
    ('products_delete'),
    ('config_view'),
    ('config_users'),
    ('config_permissions'),
    ('config_system')
) AS permissions(permission_id)
ON CONFLICT (tenant_id, profile, permission_id) DO NOTHING;

-- Insert default permissions for technician
INSERT INTO mod_ordem_servico_profile_permissions (tenant_id, profile, permission_id, allowed)
SELECT 
    'default' as tenant_id,
    'technician' as profile,
    permission_id,
    allowed
FROM (
    VALUES 
    ('dashboard_view', true),
    ('dashboard_export', false),
    ('orders_view', true),
    ('orders_create', true),
    ('orders_edit', true),
    ('orders_delete', false),
    ('orders_assign', false),
    ('clients_view', true),
    ('clients_create', false),
    ('clients_edit', false),
    ('clients_delete', false),
    ('products_view', true),
    ('products_create', false),
    ('products_edit', false),
    ('products_delete', false),
    ('config_view', false),
    ('config_users', false),
    ('config_permissions', false),
    ('config_system', false)
) AS permissions(permission_id, allowed)
ON CONFLICT (tenant_id, profile, permission_id) DO NOTHING;

-- Insert default permissions for attendant
INSERT INTO mod_ordem_servico_profile_permissions (tenant_id, profile, permission_id, allowed)
SELECT 
    'default' as tenant_id,
    'attendant' as profile,
    permission_id,
    allowed
FROM (
    VALUES 
    ('dashboard_view', true),
    ('dashboard_export', false),
    ('orders_view', true),
    ('orders_create', true),
    ('orders_edit', false),
    ('orders_delete', false),
    ('orders_assign', false),
    ('clients_view', true),
    ('clients_create', true),
    ('clients_edit', true),
    ('clients_delete', false),
    ('products_view', true),
    ('products_create', false),
    ('products_edit', false),
    ('products_delete', false),
    ('config_view', false),
    ('config_users', false),
    ('config_permissions', false),
    ('config_system', false)
) AS permissions(permission_id, allowed)
ON CONFLICT (tenant_id, profile, permission_id) DO NOTHING;

COMMIT;