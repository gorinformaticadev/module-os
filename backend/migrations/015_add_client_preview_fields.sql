-- Adiciona campos de observações e foto de perfil para clientes
ALTER TABLE mod_ordem_servico_clients ADD COLUMN IF NOT EXISTS observations TEXT;
ALTER TABLE mod_ordem_servico_clients ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN mod_ordem_servico_clients.observations IS 'Observações gerais sobre o cliente';
COMMENT ON COLUMN mod_ordem_servico_clients.image_url IS 'URL da foto de perfil do cliente';
