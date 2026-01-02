-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Adicionar campos de endereço separados na tabela de clientes
-- Versão: 1.0.1
-- Data: 2026-01-02
-- ═══════════════════════════════════════════════════════════════════════════

-- Adicionar campos de endereço separados
ALTER TABLE mod_ordem_servico_clients 
ADD COLUMN IF NOT EXISTS address_zip VARCHAR(10),
ADD COLUMN IF NOT EXISTS address_street VARCHAR(255),
ADD COLUMN IF NOT EXISTS address_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS address_complement VARCHAR(100),
ADD COLUMN IF NOT EXISTS address_neighborhood VARCHAR(100),
ADD COLUMN IF NOT EXISTS address_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS address_state VARCHAR(2);

-- Criar índices para melhor performance nas consultas
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_clients_address_city ON mod_ordem_servico_clients(address_city);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_clients_address_state ON mod_ordem_servico_clients(address_state);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_clients_address_zip ON mod_ordem_servico_clients(address_zip);

-- Comentários para documentação
COMMENT ON COLUMN mod_ordem_servico_clients.address_zip IS 'CEP do cliente';
COMMENT ON COLUMN mod_ordem_servico_clients.address_street IS 'Logradouro (rua, avenida, etc.)';
COMMENT ON COLUMN mod_ordem_servico_clients.address_number IS 'Número do endereço';
COMMENT ON COLUMN mod_ordem_servico_clients.address_complement IS 'Complemento (apartamento, bloco, etc.)';
COMMENT ON COLUMN mod_ordem_servico_clients.address_neighborhood IS 'Bairro';
COMMENT ON COLUMN mod_ordem_servico_clients.address_city IS 'Cidade';
COMMENT ON COLUMN mod_ordem_servico_clients.address_state IS 'Estado (UF)';