-- Adiciona campos para o tipo de serviço Formatação
ALTER TABLE mod_ordem_servico_ordens ADD COLUMN IF NOT EXISTS formatacao_so TEXT;
ALTER TABLE mod_ordem_servico_ordens ADD COLUMN IF NOT EXISTS formatacao_backup BOOLEAN DEFAULT FALSE;
ALTER TABLE mod_ordem_servico_ordens ADD COLUMN IF NOT EXISTS formatacao_backup_descricao TEXT;
ALTER TABLE mod_ordem_servico_ordens ADD COLUMN IF NOT EXISTS formatacao_senha TEXT;

COMMENT ON COLUMN mod_ordem_servico_ordens.formatacao_so IS 'Sistema operacional para formatação';
COMMENT ON COLUMN mod_ordem_servico_ordens.formatacao_backup IS 'Indica se o cliente deseja backup';
COMMENT ON COLUMN mod_ordem_servico_ordens.formatacao_backup_descricao IS 'Descrição do que deve ser salvo no backup';
COMMENT ON COLUMN mod_ordem_servico_ordens.formatacao_senha IS 'Senha fornecida pelo cliente';
