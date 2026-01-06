-- Adiciona campo para fotos do equipamento (armazenado como array JSON de strings base64)
ALTER TABLE mod_ordem_servico_ordens ADD COLUMN IF NOT EXISTS equipamento_fotos TEXT;

COMMENT ON COLUMN mod_ordem_servico_ordens.equipamento_fotos IS 'Lista de fotos do equipamento em formato JSON base64 comprimido';
