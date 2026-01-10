CREATE TABLE IF NOT EXISTS mod_ordem_servico_clients (
    id UUID PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    document VARCHAR(20),
    phone_primary VARCHAR(20) NOT NULL,
    phone_secondary VARCHAR(20),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_clients_tenant_id ON mod_ordem_servico_clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_clients_name ON mod_ordem_servico_clients(name);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_clients_document ON mod_ordem_servico_clients(document);
