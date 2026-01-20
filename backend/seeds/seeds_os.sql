-- ═══════════════════════════════════════════════════════════════════════════
-- Seed: Dados Iniciais do Módulo de Ordem de Serviço
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Configurações Base (Exibição, Impressão e Termos)
-- Garante que cada Tenant tenha as chaves de configuração necessárias
INSERT INTO public.mod_ordem_servico_configs (id, tenant_id, key, value, created_at, updated_at)
SELECT
    gen_random_uuid(),
    t.id,
    seed_data.key,
    seed_data.value,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM public.tenants t
CROSS JOIN (
    VALUES
    ('condicoes_execucao', 'O serviço será executado conforme descrito acima. Eventuais alterações serão comunicadas ao cliente. A garantia cobre apenas defeitos relacionados ao serviço executado.'),
    ('termo_garantia', 'A garantia de hardware é de 90 dias. A garantia de software/formatação é de 7 dias contra defeitos de configuração.'),
    ('exibir_valor_total', 'true'),
    ('notificar_whatsapp_status', 'true')
) AS seed_data(key, value)
WHERE NOT EXISTS (
    SELECT 1 FROM public.mod_ordem_servico_configs c
    WHERE c.tenant_id = t.id AND c.key = seed_data.key
);

-- 2. Status Padrão (Se o seu sistema usar uma tabela de status específica)
-- Baseado no fluxo comum do Banco 3
-- Nota: Ajuste os nomes se a sua tabela de status for diferente
/*
INSERT INTO public.mod_ordem_servico_status (id, name, color, is_default, tenant_id)
SELECT 
    gen_random_uuid()::text,
    s.name,
    s.color,
    s.is_default,
    t.id
FROM public.tenants t
CROSS JOIN (
    VALUES 
    ('Aguardando Orçamento', '#FFA500', true),
    ('Em Análise', '#0000FF', false),
    ('Aprovado', '#008000', false),
    ('Finalizado', '#808080', false),
    ('Entregue', '#000000', false)
) AS s(name, color, is_default)
WHERE NOT EXISTS (
    SELECT 1 FROM public.mod_ordem_servico_status st 
    WHERE st.tenant_id = t.id AND st.name = s.name
);
*/

-- 3. Definição Inicial de Staff (Exemplo para o Admin)
-- Torna o usuário administrador um técnico por padrão para testes
INSERT INTO public.mod_ordem_servico_staff (id, user_id, is_technician, created_at, updated_at)
SELECT
    gen_random_uuid(),
    u.id,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM public.users u
WHERE u.role = 'ADMIN' -- Ou o critério que você usa para identificar o admin
AND NOT EXISTS (
    SELECT 1 FROM public.mod_ordem_servico_staff s WHERE s.user_id = u.id
);

COMMIT;