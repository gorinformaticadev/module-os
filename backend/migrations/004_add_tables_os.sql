-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Sincronização Módulo Ordem de Serviço (Completa)
-- Objetivo: Criar tabelas faltantes e ajustar campos divergentes entre Dev e Instalação
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Criar tabela de Staff (Técnicos) que estava ausente no Banco 2
CREATE TABLE IF NOT EXISTS public.mod_ordem_servico_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    is_technician BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP(3) WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL,

    CONSTRAINT mod_ordem_servico_staff_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- 2. Criar tabela de Agendamento de Notificações que estava ausente no Banco 2
CREATE TABLE IF NOT EXISTS public.mod_ordemservico_notification_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    ordem_id UUID NOT NULL,
    type TEXT NOT NULL,
    scheduled_for TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL,
    status TEXT DEFAULT 'pending'::text NOT NULL,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP(3) WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL,

    CONSTRAINT mod_ordemservico_notification_schedules_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT mod_ordemservico_notification_schedules_ordem_id_fkey FOREIGN KEY (ordem_id) REFERENCES public.mod_ordem_servico_ordens(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- 3. Ajustar campos faltantes na tabela principal de Ordens de Serviço
-- Adicionando colunas de formatação e laudo técnico detectadas no Banco 3
ALTER TABLE public.mod_ordem_servico_ordens 
ADD COLUMN IF NOT EXISTS formatacao_so TEXT,
ADD COLUMN IF NOT EXISTS formatacao_backup BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS formatacao_backup_descricao TEXT,
ADD COLUMN IF NOT EXISTS formatacao_senha TEXT,
ADD COLUMN IF NOT EXISTS laudo_tecnico TEXT,
ADD COLUMN IF NOT EXISTS garantia_dias INTEGER DEFAULT 0;

COMMENT ON COLUMN public.mod_ordem_servico_ordens.garantia_dias IS 'Período de garantia em dias para o serviço realizado';

-- 4. Garantir que as funções de trigger existam
CREATE OR REPLACE FUNCTION public.update_mod_ordem_servico_ordens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Vincular Triggers (Garantir que o Banco 2 tenha as automações do Banco 3)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trig_update_mod_ordem_servico_ordens_updated_at') THEN
        CREATE TRIGGER trig_update_mod_ordem_servico_ordens_updated_at
        BEFORE UPDATE ON public.mod_ordem_servico_ordens
        FOR EACH ROW EXECUTE FUNCTION public.update_mod_ordem_servico_ordens_updated_at();
    END IF;
END $$;

-- 6. Inserir configurações padrão de execução (conforme seu modelo 003)
INSERT INTO public.mod_ordem_servico_configs (id, tenant_id, key, value, created_at, updated_at)
SELECT
    gen_random_uuid(),
    t.id,
    'condicoes_execucao',
    'O serviço será executado conforme descrito acima. Eventuais alterações serão comunicadas ao cliente. A garantia cobre apenas defeitos relacionados ao serviço executado.',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM public.tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM public.mod_ordem_servico_configs
    WHERE tenant_id = t.id AND key = 'condicoes_execucao'
);

COMMENT ON TABLE mod_ordem_servico_configs IS 'Configurações do módulo de ordem de serviço, incluindo condições de execução para impressão';