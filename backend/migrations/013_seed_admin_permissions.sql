-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Seed automático de permissões para administradores
-- Versão: 1.0.0
-- Data: 2026-01-03
-- Descrição: Garante que todos os usuários ADMIN e SUPER_ADMIN tenham permissões completas
-- ═══════════════════════════════════════════════════════════════════════════

-- Função para criar permissões completas para administradores
DO $
DECLARE
    admin_user RECORD;
    permission_record RECORD;
    permissions_data TEXT[] := ARRAY[
        'dashboard:view',
        'dashboard:export',
        'orders:view',
        'orders:create', 
        'orders:edit',
        'orders:delete',
        'orders:assign',
        'orders:change_status',
        'orders:view_all',
        'orders:export',
        'clients:view',
        'clients:create',
        'clients:edit', 
        'clients:delete',
        'clients:export',
        'products:view',
        'products:create',
        'products:edit',
        'products:delete',
        'products:manage_prices',
        'products:export',
        'config:view',
        'config:edit',
        'config:manage_users',
        'config:manage_permissions',
        'config:view_users',
        'config:view_logs',
        'config:backup',
        'config:restore'
    ];
    resource_name TEXT;
    action_name TEXT;
    permission_parts TEXT[];
BEGIN
    -- Log início do processo
    RAISE NOTICE '🚀 Iniciando seed de permissões para administradores...';
    
    -- Buscar todos os usuários ADMIN e SUPER_ADMIN
    FOR admin_user IN 
        SELECT id, name, email, role, tenant_id 
        FROM users 
        WHERE role IN ('ADMIN', 'SUPER_ADMIN') 
        AND tenant_id IS NOT NULL
    LOOP
        RAISE NOTICE '👤 Processando usuário: % (%) - %', admin_user.name, admin_user.role, admin_user.email;
        
        -- Para cada permissão na lista
        FOREACH permission_record.permission IN ARRAY permissions_data
        LOOP
            -- Dividir resource:action
            permission_parts := string_to_array(permission_record.permission, ':');
            resource_name := permission_parts[1];
            action_name := permission_parts[2];
            
            -- Inserir ou atualizar permissão
            INSERT INTO mod_ordem_servico_user_permissions 
            (tenant_id, user_id, resource, action, allowed, created_by)
            VALUES (
                admin_user.tenant_id,
                admin_user.id,
                resource_name,
                action_name,
                true,
                admin_user.id
            )
            ON CONFLICT (tenant_id, user_id, resource, action) 
            DO UPDATE SET 
                allowed = true,
                updated_at = CURRENT_TIMESTAMP;
        END LOOP;
        
        -- Registrar na auditoria
        INSERT INTO mod_ordem_servico_permission_audit 
        (tenant_id, user_id, resource, action, old_value, new_value, changed_by, reason)
        VALUES (
            admin_user.tenant_id,
            admin_user.id,
            'system',
            'auto_seed',
            null,
            true,
            'SYSTEM',
            'Permissões automáticas para administrador'
        );
        
        RAISE NOTICE '   ✅ % permissões configuradas para %', array_length(permissions_data, 1), admin_user.name;
    END LOOP;
    
    RAISE NOTICE '🎉 Seed de permissões concluído com sucesso!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro durante o seed: %', SQLERRM;
        RAISE;
END $;

-- Verificar resultado
DO $
DECLARE
    admin_count INTEGER;
    permission_count INTEGER;
BEGIN
    -- Contar administradores
    SELECT COUNT(*) INTO admin_count
    FROM users 
    WHERE role IN ('ADMIN', 'SUPER_ADMIN') 
    AND tenant_id IS NOT NULL;
    
    -- Contar permissões criadas
    SELECT COUNT(*) INTO permission_count
    FROM mod_ordem_servico_user_permissions p
    INNER JOIN users u ON p.user_id = u.id
    WHERE u.role IN ('ADMIN', 'SUPER_ADMIN')
    AND p.allowed = true;
    
    RAISE NOTICE '📊 Resumo do seed:';
    RAISE NOTICE '   • % administradores encontrados', admin_count;
    RAISE NOTICE '   • % permissões criadas/atualizadas', permission_count;
    RAISE NOTICE '   • Média de % permissões por admin', 
        CASE WHEN admin_count > 0 THEN permission_count / admin_count ELSE 0 END;
END $;