-- Migration 004: Seed Notification Worker
-- Registra o worker de notificações no sistema de cron do core (se existir a tabela)

INSERT INTO cron_schedules (
    id, origem, modulo, identificador, descricao, expressao, ativo, editavel, created_at, updated_at
) 
SELECT 
    gen_random_uuid(), 
    'MODULE', 
    'ordem_servico', 
    'OS_NOTIFICATION_WORKER', 
    'Worker para processamento de regras de notificação da Ordem de Serviço (Atrasos, Deadlines, etc)', 
    '* * * * *', -- Todo minuto
    true, 
    false, 
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM cron_schedules WHERE modulo = 'ordem_servico' AND identificador = 'OS_NOTIFICATION_WORKER'
);
