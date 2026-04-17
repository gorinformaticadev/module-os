-- Compatibiliza tabelas compartilhadas do módulo Ordem de Serviço.
-- Clientes passa a usar prefixo do módulo "clientes" e IA usa prefixo "integracoes".

DO $$
BEGIN
    IF to_regclass('public.mod_clientes_clients') IS NULL
       AND to_regclass('public.mod_ordem_servico_clients') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.mod_ordem_servico_clients RENAME TO mod_clientes_clients';
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.mod_clientes_clients (
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
    deleted_at TIMESTAMP
);

ALTER TABLE public.mod_clientes_clients
    ADD COLUMN IF NOT EXISTS tenant_id TEXT,
    ADD COLUMN IF NOT EXISTS name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS document VARCHAR(20),
    ADD COLUMN IF NOT EXISTS phone_primary VARCHAR(20),
    ADD COLUMN IF NOT EXISTS phone_secondary VARCHAR(20),
    ADD COLUMN IF NOT EXISTS email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS address_zip VARCHAR(10),
    ADD COLUMN IF NOT EXISTS address_street VARCHAR(255),
    ADD COLUMN IF NOT EXISTS address_number VARCHAR(20),
    ADD COLUMN IF NOT EXISTS address_complement VARCHAR(100),
    ADD COLUMN IF NOT EXISTS address_neighborhood VARCHAR(100),
    ADD COLUMN IF NOT EXISTS address_city VARCHAR(100),
    ADD COLUMN IF NOT EXISTS address_state VARCHAR(2),
    ADD COLUMN IF NOT EXISTS observations TEXT,
    ADD COLUMN IF NOT EXISTS image_url TEXT,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_mod_clientes_clients_tenant'
          AND conrelid = 'public.mod_clientes_clients'::regclass
    ) THEN
        ALTER TABLE public.mod_clientes_clients
            ADD CONSTRAINT fk_mod_clientes_clients_tenant
            FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_mod_clientes_clients_tenant
    ON public.mod_clientes_clients(tenant_id);

CREATE INDEX IF NOT EXISTS idx_mod_clientes_clients_active
    ON public.mod_clientes_clients(is_active);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_proc
        WHERE proname = 'update_mod_os_timestamp'
    ) AND NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'trg_mod_clientes_clients_updated_at'
          AND tgrelid = 'public.mod_clientes_clients'::regclass
    ) THEN
        CREATE TRIGGER trg_mod_clientes_clients_updated_at
        BEFORE UPDATE ON public.mod_clientes_clients
        FOR EACH ROW
        EXECUTE FUNCTION public.update_mod_os_timestamp();
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.mod_integracoes_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    key VARCHAR(255) NOT NULL,
    value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.mod_integracoes_configs
    ADD COLUMN IF NOT EXISTS tenant_id TEXT,
    ADD COLUMN IF NOT EXISTS key VARCHAR(255),
    ADD COLUMN IF NOT EXISTS value TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_mod_integracoes_configs_tenant'
          AND conrelid = 'public.mod_integracoes_configs'::regclass
    ) THEN
        ALTER TABLE public.mod_integracoes_configs
            ADD CONSTRAINT fk_mod_integracoes_configs_tenant
            FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_mod_integracoes_configs_tenant
    ON public.mod_integracoes_configs(tenant_id);

CREATE UNIQUE INDEX IF NOT EXISTS uk_mod_integracoes_configs_tenant_key
    ON public.mod_integracoes_configs(tenant_id, key);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_proc
        WHERE proname = 'update_mod_os_timestamp'
    ) AND NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'trg_mod_integracoes_configs_updated_at'
          AND tgrelid = 'public.mod_integracoes_configs'::regclass
    ) THEN
        CREATE TRIGGER trg_mod_integracoes_configs_updated_at
        BEFORE UPDATE ON public.mod_integracoes_configs
        FOR EACH ROW
        EXECUTE FUNCTION public.update_mod_os_timestamp();
    END IF;
END $$;

INSERT INTO public.mod_integracoes_configs (tenant_id, key, value)
SELECT c.tenant_id, c.key, c.value
FROM public.mod_ordem_servico_configs c
WHERE c.key = 'ai_integration'
  AND NOT EXISTS (
      SELECT 1
      FROM public.mod_integracoes_configs i
      WHERE i.tenant_id = c.tenant_id
        AND i.key = c.key
  );
