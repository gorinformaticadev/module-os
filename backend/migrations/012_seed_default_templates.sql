-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Seed dos templates padrão de perfis
-- Versão: 1.0.0
-- Data: 2026-01-02
-- ═══════════════════════════════════════════════════════════════════════════

-- Inserir templates padrão
INSERT INTO mod_ordem_servico_profile_templates (name, description, is_system) VALUES
('Técnico', 'Perfil para técnicos com acesso limitado às suas próprias ordens de serviço', true),
('Admin', 'Perfil para administradores com acesso completo às operações do módulo', true),
('Super Admin', 'Perfil com acesso total ao sistema, incluindo configurações', true)
ON CONFLICT (name) DO NOTHING;

-- Permissões para template Técnico
INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'dashboard', 'view_basic', true 
FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Técnico'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'orders', 'view_own', true 
FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Técnico'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'orders', 'create', true 
FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Técnico'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'orders', 'edit_own', true 
FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Técnico'
ON CONFLICT (template_id, resource, action) DO NOTHING;

-- Permissões para template Admin
INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, resource, action, true
FROM mod_ordem_servico_profile_templates t,
(VALUES 
    ('dashboard', 'view_basic'),
    ('dashboard', 'view_advanced'),
    ('dashboard', 'view_financial'),
    ('dashboard', 'export_reports'),
    ('orders', 'view_own'),
    ('orders', 'view_all'),
    ('orders', 'create'),
    ('orders', 'edit_own'),
    ('orders', 'edit_all'),
    ('orders', 'delete_own'),
    ('orders', 'delete_all'),
    ('orders', 'change_status'),
    ('orders', 'assign_technician'),
    ('orders', 'view_history'),
    ('clients', 'view'),
    ('clients', 'view_details'),
    ('clients', 'view_basic'),
    ('clients', 'create'),
    ('clients', 'edit'),
    ('clients', 'delete'),
    ('clients', 'export'),
    ('clients', 'import'),
    ('products', 'view'),
    ('products', 'view_prices'),
    ('products', 'create'),
    ('products', 'edit'),
    ('products', 'delete'),
    ('products', 'manage_stock'),
    ('products', 'set_prices'),
    ('products', 'upload_images')
) AS perms(resource, action)
WHERE t.name = 'Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

-- Permissões para template Super Admin (todas as permissões)
INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, resource, action, true
FROM mod_ordem_servico_profile_templates t,
(VALUES 
    ('dashboard', 'view_basic'),
    ('dashboard', 'view_advanced'),
    ('dashboard', 'view_financial'),
    ('dashboard', 'export_reports'),
    ('orders', 'view_own'),
    ('orders', 'view_all'),
    ('orders', 'create'),
    ('orders', 'edit_own'),
    ('orders', 'edit_all'),
    ('orders', 'delete_own'),
    ('orders', 'delete_all'),
    ('orders', 'change_status'),
    ('orders', 'assign_technician'),
    ('orders', 'view_history'),
    ('clients', 'view'),
    ('clients', 'view_details'),
    ('clients', 'view_basic'),
    ('clients', 'create'),
    ('clients', 'edit'),
    ('clients', 'delete'),
    ('clients', 'export'),
    ('clients', 'import'),
    ('products', 'view'),
    ('products', 'view_prices'),
    ('products', 'create'),
    ('products', 'edit'),
    ('products', 'delete'),
    ('products', 'manage_stock'),
    ('products', 'set_prices'),
    ('products', 'upload_images'),
    ('config', 'view_users'),
    ('config', 'manage_permissions'),
    ('config', 'create_users'),
    ('config', 'edit_users'),
    ('config', 'deactivate_users'),
    ('config', 'view_logs'),
    ('config', 'system_config'),
    ('config', 'backup_restore')
) AS perms(resource, action)
WHERE t.name = 'Super Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;