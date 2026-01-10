-- Add missing columns to mod_ordem_servico_clients table
ALTER TABLE mod_ordem_servico_clients 
ADD COLUMN IF NOT EXISTS address_zip VARCHAR(10),
ADD COLUMN IF NOT EXISTS address_street VARCHAR(255),
ADD COLUMN IF NOT EXISTS address_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS address_complement VARCHAR(100),
ADD COLUMN IF NOT EXISTS address_neighborhood VARCHAR(100),
ADD COLUMN IF NOT EXISTS address_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS address_state VARCHAR(2),
ADD COLUMN IF NOT EXISTS observations TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_clients_city ON mod_ordem_servico_clients(address_city);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_clients_state ON mod_ordem_servico_clients(address_state);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_clients_active ON mod_ordem_servico_clients(is_active);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_clients_email ON mod_ordem_servico_clients(email);