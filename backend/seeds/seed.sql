-- ============================================================================
-- SEED: Dados iniciais unificados do modulo ordem_servico
-- Versao: 1.0.0
-- Data: 2026-04-28
-- Descricao: Consolida seed.sql, seeds_os.sql, permissions_seed.sql e inserts
--            que estavam na migration 001.
-- ============================================================================

SET search_path TO public;

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
                ('module_enabled', 'true'),
                ('version', '1.0.0'),
                ('condicoes_execucao', 'O servico sera executado conforme descrito acima. Eventuais alteracoes serao comunicadas ao cliente. A garantia cobre apenas defeitos relacionados ao servico executado.'),
                ('termo_garantia', 'A garantia de hardware e de 90 dias. A garantia de software/formatacao e de 7 dias contra defeitos de configuracao.'),
                ('exibir_valor_total', 'true'),
                ('notificar_whatsapp_status', 'true'),
                ('prazo_garantia_padrao', '90'),
                ('whatsapp_template', 'Ola {{nomeCliente}}, a sua ordem de servico #{{numeroOs}} no valor de R$ {{valorTotal}} foi atualizada para o status {{statusOs}}.'),
                ('prazo_retirada_dias', '30'),
                ('valor_conservacao_diario', '5.00'),
                ('conservacao_habilitada', 'true'),
                ('intervalo_alertas_dias', '7')
        ) AS seed_data(key, value)
        WHERE COALESCE(t.ativo, true) = true
          AND NOT EXISTS (
              SELECT 1
              FROM mod_ordem_servico_configs c
              WHERE c.tenant_id = t.id
                AND c.key = seed_data.key
          );
    END IF;
END $$;

DO $$
BEGIN
    IF to_regclass('mod_integracoes_configs') IS NOT NULL
       AND to_regclass('mod_ordem_servico_configs') IS NOT NULL THEN
        INSERT INTO mod_integracoes_configs (id, tenant_id, key, value, created_at, updated_at)
        SELECT gen_random_uuid(), c.tenant_id, c.key, c.value, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        FROM mod_ordem_servico_configs c
        WHERE c.key = 'ai_integration'
          AND NOT EXISTS (
              SELECT 1
              FROM mod_integracoes_configs i
              WHERE i.tenant_id = c.tenant_id
                AND i.key = c.key
          );
    END IF;
END $$;

DO $$
BEGIN
    IF to_regclass('mod_ordem_servico_tipos_servico') IS NOT NULL THEN
        INSERT INTO mod_ordem_servico_tipos_servico (id, tenant_id, nome, is_default, created_at)
        SELECT
            gen_random_uuid(),
            t.id,
            seed_data.nome,
            false,
            CURRENT_TIMESTAMP
        FROM tenants t
        CROSS JOIN (
            VALUES
                ('Formatacao'),
                ('Manutencao'),
                ('Suporte Tecnico'),
                ('Outros')
        ) AS seed_data(nome)
        ON CONFLICT (tenant_id, nome) DO NOTHING;
    END IF;
END $$;

DO $$
BEGIN
    IF to_regclass('mod_ordem_servico_tipos_equipamento') IS NOT NULL THEN
        INSERT INTO mod_ordem_servico_tipos_equipamento (id, tenant_id, nome, created_at)
        SELECT
            gen_random_uuid(),
            t.id,
            seed_data.nome,
            CURRENT_TIMESTAMP
        FROM tenants t
        CROSS JOIN (
            VALUES
                ('Desktop'),
                ('Notebook'),
                ('Celular'),
                ('Tablet'),
                ('Monitor'),
                ('Impressora'),
                ('Outros')
        ) AS seed_data(nome)
        ON CONFLICT (tenant_id, nome) DO NOTHING;
    END IF;
END $$;

DO $$
BEGIN
    IF to_regclass('mod_ordem_servico_profile_permissions') IS NOT NULL THEN
        INSERT INTO mod_ordem_servico_profile_permissions (id, tenant_id, permission_id, profile, allowed, created_at, updated_at)
        SELECT
            gen_random_uuid(),
            t.id,
            seed_data.permission_id,
            seed_data.profile,
            true,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        FROM tenants t
        CROSS JOIN (
            VALUES
                ('admin', 'dashboard_view'),
                ('admin', 'dashboard_export'),
                ('admin', 'orders_view'),
                ('admin', 'orders_create'),
                ('admin', 'orders_edit'),
                ('admin', 'orders_delete'),
                ('admin', 'orders_assign'),
                ('admin', 'clients_view'),
                ('admin', 'clients_create'),
                ('admin', 'clients_edit'),
                ('admin', 'clients_delete'),
                ('admin', 'products_view'),
                ('admin', 'products_create'),
                ('admin', 'products_edit'),
                ('admin', 'products_delete'),
                ('admin', 'config_view'),
                ('admin', 'config_users'),
                ('admin', 'config_permissions'),
                ('admin', 'config_system'),
                ('admin', 'orders_mark_retirado'),
                ('admin', 'orders_mark_abandonado'),
                ('admin', 'orders_register_payment'),
                ('admin', 'orders_apply_conservation'),
                ('admin', 'orders_send_alerts'),
                ('admin', 'orders_view_alerts'),
                ('admin', 'config_conservation'),
                ('technician', 'dashboard_view'),
                ('technician', 'orders_view'),
                ('technician', 'orders_create'),
                ('technician', 'orders_edit')
        ) AS seed_data(profile, permission_id)
        ON CONFLICT (tenant_id, permission_id, profile) DO NOTHING;
    END IF;
END $$;

DO $$
BEGIN
    IF to_regclass('mod_ordem_servico_user_roles') IS NOT NULL THEN
        INSERT INTO mod_ordem_servico_user_roles (
            id,
            tenant_id,
            user_id,
            is_technician,
            is_attendant,
            is_admin,
            created_at,
            updated_at
        )
        SELECT
            gen_random_uuid(),
            u."tenantId",
            u.id,
            true,
            true,
            true,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        FROM users u
        WHERE u.role IN ('ADMIN', 'SUPER_ADMIN')
          AND u."tenantId" IS NOT NULL
        ON CONFLICT (tenant_id, user_id) DO UPDATE SET
            is_technician = true,
            is_attendant = true,
            is_admin = true,
            updated_at = CURRENT_TIMESTAMP;
    END IF;
END $$;

DO $$
BEGIN
    IF to_regclass('cron_schedules') IS NOT NULL THEN
        INSERT INTO cron_schedules (
            id,
            origem,
            modulo,
            identificador,
            descricao,
            expressao,
            ativo,
            editavel,
            "createdAt",
            "updatedAt"
        )
        SELECT
            gen_random_uuid(),
            'MODULE',
            'ordem_servico',
            'OS_NOTIFICATION_WORKER',
            'Worker para processamento de regras de notificacao da Ordem de Servico',
            '* * * * *',
            true,
            false,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        WHERE NOT EXISTS (
            SELECT 1
            FROM cron_schedules
            WHERE modulo = 'ordem_servico'
              AND identificador = 'OS_NOTIFICATION_WORKER'
        );
    END IF;
END $$;
