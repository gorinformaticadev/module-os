SET search_path TO public;

-- 1. Configurações Base (Exibição, Impressão e Termos)
-- Garante que cada Tenant tenha as chaves de configuração necessárias
DO $$
BEGIN
    IF to_regclass('mod_ordem_servico_configs') IS NOT NULL THEN
        INSERT INTO mod_ordem_servico_configs (id, tenant_id, key, value, created_at, updated_at)
        SELECT
            gen_random_uuid(),
            t.id,
            seed_data.key,
            seed_data.value,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        FROM tenants t
        CROSS JOIN (
            VALUES
            ('condicoes_execucao', 'O serviço será executado conforme descrito acima. Eventuais alterações serão comunicadas ao cliente. A garantia cobre apenas defeitos relacionados ao serviço executado.'),
            ('termo_garantia', 'A garantia de hardware é de 90 dias. A garantia de software/formatação é de 7 dias contra defeitos de configuração.'),
            ('exibir_valor_total', 'true'),
            ('notificar_whatsapp_status', 'true'),
            ('prazo_garantia_padrao', '90'),
            ('whatsapp_template', 'Olá {{nomeCliente}}, a sua ordem de serviço #{{numeroOs}} no valor de R$ {{valorTotal}} foi atualizada para o status {{statusOs}}.')
        ) AS seed_data(key, value)
        WHERE NOT EXISTS (
            SELECT 1 FROM mod_ordem_servico_configs c
            WHERE c.tenant_id = t.id AND c.key = seed_data.key
        );
    END IF;
END $$;

-- 3. Definição Inicial de Staff (Atualizado para user_roles na V3 schema)
-- Torna o usuário administrador um técnico por padrão para testes
DO $$
BEGIN
    IF to_regclass('mod_ordem_servico_user_roles') IS NOT NULL THEN
        INSERT INTO mod_ordem_servico_user_roles (id, tenant_id, user_id, is_technician, is_attendant, is_admin, created_at, updated_at)
        SELECT
            gen_random_uuid(),
            u."tenantId",
            u.id,
            true,   -- is_technician
            true,   -- is_attendant (Admins também são atendentes)
            true,   -- is_admin
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        FROM users u
        WHERE u.role IN ('ADMIN', 'SUPER_ADMIN') AND u."tenantId" IS NOT NULL
        ON CONFLICT (tenant_id, user_id) DO UPDATE SET
            is_technician = true,
            is_admin = true;
    END IF;
END $$;