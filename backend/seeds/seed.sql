-- SEED: Dados iniciais do módulo ordem_servico

INSERT INTO mod_ordem_servico_configs (id, tenant_id, key, value)
SELECT
    gen_random_uuid(),
    t.id,
    'module_enabled',
    'true'
FROM tenants t
WHERE t.ativo = true
  AND NOT EXISTS (
    SELECT 1
    FROM mod_ordem_servico_configs c
    WHERE c.tenant_id = t.id
      AND c.key = 'module_enabled'
  );

INSERT INTO mod_ordem_servico_configs (id, tenant_id, key, value)
SELECT
    gen_random_uuid(),
    t.id,
    'version',
    '1.0.0'
FROM tenants t
WHERE t.ativo = true
  AND NOT EXISTS (
    SELECT 1
    FROM mod_ordem_servico_configs c
    WHERE c.tenant_id = t.id
      AND c.key = 'version'
  );
