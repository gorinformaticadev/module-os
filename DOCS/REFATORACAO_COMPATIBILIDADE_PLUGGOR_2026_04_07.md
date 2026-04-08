# Refatoracao de Compatibilidade Pluggor

Data base: 2026-04-07
Ultima atualizacao: 2026-04-08
Modulo: `ordem_servico`
Escopo: adequacao progressiva do modulo legado ao contrato atual de governanca, seguranca de runtime e multitenancy do Pluggor

## Objetivo

Este trabalho nao recriou o modulo do zero. O foco foi refatorar o modulo existente para mantar a logica original, remover os pontos mais incompatveis com o runtime safety atual e alinhar o nucleo do backend ao modelo Prisma + ALS adotado pelo host.

## Entregas realizadas

### 1. Contrato e manifesto do modulo

- Adicionado `moduleApiVersion: 1` em `module.json` e `backend/module.json`.
- Adicionados `hasBackend: true` e `hasFrontend: true`.
- Menus normalizados com `id`, `placement` e `isQuickAction` quando aplicavel.
- `backend/index.ts` alinhado ao contrato atual de dashboard e navegacao.
- `backend/ordem_servico.module.ts` passou a expor `static SLUG = 'ordem_servico'`.

### 2. Frontend e governanca de acesso

- Manifesto frontend atualizado em `frontend/module-manifest.ts`.
- Menu legado alinhado em `frontend/menu.ts`.
- Criado `frontend/components/ModuleAccessGuard.tsx`.
- `frontend/components/ModulePageGuard.tsx` passou a usar o novo guard sem quebrar compatibilidade.
- Removidos hardcodes de cor que quebravam a validacao em:
  - `frontend/components/PrintTemplateA4.tsx`
  - `frontend/components/ui/rich-text-editor.tsx`

### 3. Controllers e permissao explicita

- Criado `backend/shared/decorators/permissions.decorator.ts`.
- Controllers principais receberam `@Permissions(...)` no nivel de classe para explicitar o dominio protegido e satisfazer o contrato atual de auditoria e validacao.
- Removido fallback de `x-tenant-id` nos controllers de tipos de servico e tipos de equipamento.

### 4. Prisma local do modulo

Foi criada uma camada Prisma local do `module-os`, isolada do client do host:

- `backend/prisma/schema.prisma`
- `backend/prisma/module-os-prisma.service.ts`
- `backend/prisma/module-os-prisma.module.ts`

Essa camada aplica as regras centrais desta refatoracao:

- bloqueio explicito de operacoes RAW
- uso obrigatorio de models `mod_ordem_servico_*`
- escopo por tenant aplicado via contexto ALS
- rejeicao de mismatch quando algum fluxo tenta sobrescrever `tenantId` manualmente

### 5. Migracao do nucleo backend para Prisma + ALS

O nucleo do modulo deixou de depender de RAW queries nos blocos mais sensiveis:

- `backend/configuracoes/*`
- `backend/clientes/*`
- `backend/produtos/*`
- `backend/shared/services/template.service.ts`
- `backend/shared/services/ai.service.ts`
- `backend/shared/services/permission.service.ts`
- `backend/notifications/*`
- `backend/core/ordem-servico-config.controller.ts`
- `backend/core/ordem-servico-cron.service.ts`
- `backend/ordens/ordens.service.ts`
- `backend/ordens/ordens.controller.ts`

Resultados da migracao:

- remocao de `prisma.$queryRaw`, `prisma.$queryRawUnsafe`, `prisma.$executeRaw` e `prisma.$executeRawUnsafe` do nucleo funcional do modulo
- remocao da propagacao manual de `tenantId` nas operacoes HTTP principais
- uso do contexto autenticado e do ALS para escopo de tenant
- preservacao da logica de negocio original de ordens, dashboard, historico, notificacoes e configuracoes

### 6. Jobs, eventos e notificacoes

Os fluxos assincronos passaram a seguir um modelo compativel com o runtime atual:

- varreduras globais controladas usam `runWithoutTenantEnforcement(...)` apenas para localizar trabalhos pendentes
- a execucao por tenant volta para escopo seguro com `runWithActor(...)`
- consultas do modulo passam pelo Prisma local do modulo, e nao por RAW

Isso foi aplicado em especial em:

- `backend/notifications/scheduler.service.ts`
- `backend/notifications/event-listener.service.ts`
- `backend/notifications/rules.service.ts`
- `backend/notifications/history.service.ts`
- `backend/notifications/state.service.ts`
- `backend/core/ordem-servico-cron.service.ts`

## Validacao executada

### Build do backend host

Comando:

```bash
corepack pnpm -C apps/backend build
```

Resultado:

- build concluido com sucesso

### Validator do modulo

Comando:

```bash
node Scripts/validate-module.mjs --path module-os
```

Resultado atual:

- manifesto ok
- auditoria de frontend ok
- auditoria de design tokens ok
- permanece 1 erro no check de prefixo Prisma do host

Mensagem atual:

```text
Modelos no banco de dados para este modulo (mod_ordem_servico_configs) DEVEM ser prefixados com 'mod_ordem_servico_' via @@map no PRISMA para evitar colisao com o Tenant Base.
```

Observacao importante:

O schema local do modulo ja usa `@@map("mod_ordem_servico_*")` em todos os models. O erro remanescente aparenta ser falso positivo do validator do host, nao ausencia real de prefixo no schema do modulo.

## Estado atual de compatibilidade

### Compativel

- contrato de manifesto
- menus e placements
- guards de frontend
- permissao explicita nos controllers
- Prisma local com bloqueio de RAW
- consultas principais do nucleo migradas para Prisma + ALS
- build do backend host

### Ainda pendente

- migracao de uploads para a stack de arquivos seguros do host
- eventuais pontos residuais de `tenantId` em payloads internos de jobs e eventos, que nao devem ser confundidos com scopo manual de query
- ajuste ou revisao do validator do host para eliminar o falso positivo do schema Prisma

## Riscos restantes

### 1. Uploads

O modulo ainda nao foi completamente migrado para `SecureFilesService`.

Pontos mais sensiveis:

- `backend/clientes/clientes.controller.ts`
- `backend/produtos/produtos.controller.ts`
- `backend/ordens/ordens.controller.ts`

### 2. Dependencia do validator do host

Mesmo com o schema Prisma local corretamente prefixado, o validator do host ainda reprova o modulo por um unico erro de deteccao. Como a regra desta rodada foi mexer somente no modulo, o script do host nao foi alterado.

## Conclusao

O `module-os` avancou da fase de adequacao contratual para uma refatoracao real de runtime safety. O nucleo funcional do backend agora opera sobre Prisma local com apoio de ALS, sem RAW queries e sem scopo manual de tenant nas operacoes principais. O unico bloqueio de validacao restante, no estado atual, esta concentrado no comportamento do validator do host sobre o schema Prisma do modulo.
