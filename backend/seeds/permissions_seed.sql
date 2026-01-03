-- ═══════════════════════════════════════════════════════════════════════════
-- SEED: Sistema Completo de Permissões Granulares
-- Versão: 1.0.0
-- Data: 2026-01-03
-- Descrição: Popula templates padrão e permissões para administradores
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. INSERIR TEMPLATES PADRÃO
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO mod_ordem_servico_profile_templates (name, description, is_system) VALUES
('Técnico', 'Perfil para técnicos com acesso limitado às suas próprias ordens de serviço', true),
('Admin', 'Perfil para administradores com acesso completo às operações do módulo', true),
('Super Admin', 'Perfil com acesso total ao sistema, incluindo configurações', true)
ON CONFLICT (name) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. PERMISSÕES PARA TEMPLATE TÉCNICO
-- ═══════════════════════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. PERMISSÕES PARA TEMPLATE ADMIN
-- ═══════════════════════════════════════════════════════════════════════════

-- Dashboard
INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'dashboard', 'view_basic', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'dashboard', 'view_advanced', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'dashboard', 'view_financial', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'dashboard', 'export_reports', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

-- Orders
INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'orders', 'view_own', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'orders', 'view_all', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'orders', 'create', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'orders', 'edit_own', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'orders', 'edit_all', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'orders', 'delete_own', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'orders', 'delete_all', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'orders', 'change_status', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'orders', 'assign_technician', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'orders', 'view_history', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

-- Clients
INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'clients', 'view', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'clients', 'view_details', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'clients', 'view_basic', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'clients', 'create', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'clients', 'edit', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'clients', 'delete', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'clients', 'export', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'clients', 'import', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

-- Products
INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'products', 'view', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'products', 'view_prices', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'products', 'create', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'products', 'edit', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'products', 'delete', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'products', 'manage_stock', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'products', 'set_prices', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'products', 'upload_images', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. PERMISSÕES PARA TEMPLATE SUPER ADMIN (TODAS AS PERMISSÕES)
-- ═══════════════════════════════════════════════════════════════════════════

-- Dashboard
INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'dashboard', 'view_basic', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Super Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'dashboard', 'view_advanced', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Super Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'dashboard', 'view_financial', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Super Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'dashboard', 'export_reports', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Super Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

-- Orders (todas as permissões)
INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'orders', 'view_own', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Super Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'orders', 'view_all', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Super Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'orders', 'create', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Super Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'orders', 'edit_own', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Super Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'orders', 'edit_all', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Super Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'orders', 'delete_own', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Super Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'orders', 'delete_all', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Super Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'orders', 'change_status', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Super Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'orders', 'assign_technician', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Super Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'orders', 'view_history', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Super Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

-- Clients (todas as permissões)
INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'clients', 'view', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Super Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'clients', 'view_details', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Super Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'clients', 'view_basic', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Super Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'clients', 'create', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Super Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'clients', 'edit', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Super Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'clients', 'delete', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Super Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'clients', 'export', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Super Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'clients', 'import', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Super Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

-- Products (todas as permissões)
INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'products', 'view', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Super Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'products', 'view_prices', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Super Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'products', 'create', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Super Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'products', 'edit', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Super Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'products', 'delete', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Super Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'products', 'manage_stock', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Super Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'products', 'set_prices', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Super Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'products', 'upload_images', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Super Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

-- Config (permissões exclusivas do Super Admin)
INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'config', 'view_users', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Super Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'config', 'manage_permissions', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Super Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'config', 'create_users', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Super Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'config', 'edit_users', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Super Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'config', 'deactivate_users', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Super Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'config', 'view_logs', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Super Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'config', 'system_config', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Super Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;

INSERT INTO mod_ordem_servico_template_permissions (template_id, resource, action, allowed) 
SELECT t.id, 'config', 'backup_restore', true FROM mod_ordem_servico_profile_templates t WHERE t.name = 'Super Admin'
ON CONFLICT (template_id, resource, action) DO NOTHING;