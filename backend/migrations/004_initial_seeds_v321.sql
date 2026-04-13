-- 004: Initial Seeds for OS Module
INSERT INTO mod_ordem_servico_configs (tenant_id, key, value)
SELECT t.id, 'prazo_retirada_dias', '30'
FROM tenants t ON CONFLICT DO NOTHING;

INSERT INTO mod_ordem_servico_profile_permissions (tenant_id, permission_id, profile, allowed)
SELECT t.id, unnest(ARRAY[
    'dashboard_view', 'orders_view', 'orders_create', 'orders_edit', 'orders_delete', 
    'clients_view', 'clients_create', 'clients_edit', 'config_view'
]), 'admin', true
FROM tenants t ON CONFLICT DO NOTHING;

INSERT INTO mod_ordem_servico_tipos_servico (tenant_id, nome, is_default)
SELECT t.id, unnest(ARRAY['Manutencao', 'Formatacao', 'Suporte']), true
FROM tenants t ON CONFLICT DO NOTHING;
