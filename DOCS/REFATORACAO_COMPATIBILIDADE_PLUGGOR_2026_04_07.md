# Refatoracao de Compatibilidade Pluggor

Data: 2026-04-07
Modulo: `ordem_servico`
Escopo: adequacao do modulo legado ao contrato atual de governanca, navegacao e runtime safety do Pluggor

## Objetivo

Este trabalho nao recriou o modulo do zero. O foco foi ajustar o modulo existente para que ele respeite o contrato atual do sistema, preservando ao maximo a logica original e explicitando os riscos estruturais que ainda dependem de refactor mais profundo no backend.

## O que foi corrigido

### 1. Manifesto e contrato do modulo

- Adicionado `moduleApiVersion: 1` em `module.json` e `backend/module.json`.
- Adicionados `hasBackend: true` e `hasFrontend: true`.
- Menus normalizados com `id`, `placement` e `isQuickAction` quando aplicavel.
- `backend/index.ts` alinhado ao contrato novo de menu/dashboard.
- `backend/ordem_servico.module.ts` passou a expor `static SLUG = 'ordem_servico'`.

### 2. Navegacao e frontend

- Manifesto frontend atualizado em `frontend/module-manifest.ts`.
- Menu legado alinhado em `frontend/menu.ts`.
- Criado `frontend/components/ModuleAccessGuard.tsx`.
- `frontend/components/ModulePageGuard.tsx` passou a usar o novo guard sem quebrar compatibilidade.
- Removidos hardcodes de cor que quebravam a validacao em:
  - `frontend/components/PrintTemplateA4.tsx`
  - `frontend/components/ui/rich-text-editor.tsx`

### 3. Controllers e contrato explicito de permissao

- Criado decorator de compatibilidade `backend/shared/decorators/permissions.decorator.ts`.
- Controllers principais receberam `@Permissions(...)` no nivel de classe para explicitar o dominio protegido e satisfazer o contrato de auditoria/validator, sem remover os decorators finos ja existentes.

### 4. Multitenancy

- Removido fallback de `x-tenant-id` nos controllers de tipos de servico e tipos de equipamento.
- O modulo agora depende explicitamente do tenant vindo do contexto autenticado.

## Validacao executada

Comando executado:

```bash
node Scripts/validate-module.mjs --path module-os
```

Resultado: validacao concluida com sucesso.

## Pendencias e riscos restantes

Os pontos abaixo continuam sendo incompatibilidades estruturais importantes e nao devem ser ignorados:

### 1. Uso de RAW queries

O modulo ainda usa `prisma.$queryRaw`, `prisma.$queryRawUnsafe`, `prisma.$executeRaw` e `prisma.$executeRawUnsafe` em varios arquivos. Isso conflita com o kill-switch atual do runtime para modulos sandbox.

Arquivos de maior risco:

- `backend/ordens/ordens.service.ts`
- `backend/clientes/clientes.service.ts`
- `backend/produtos/produtos.service.ts`
- `backend/configuracoes/configuracoes.service.ts`
- `backend/shared/services/permission.service.ts`
- `backend/shared/services/template.service.ts`
- `backend/notifications/*.service.ts`
- `backend/core/ordem-servico-config.controller.ts`

### 2. tenantId manual

Grande parte do backend ainda passa `tenantId` manualmente entre controller e service. O contrato atual ideal e:

- controller usa o usuario autenticado
- service le contexto/escopo implicitamente
- Prisma aplica tenant scope via ALS/extensions

### 3. Uploads fora da stack de arquivos seguros

O modulo ainda usa utilitarios legados de upload e nao foi migrado para `SecureFilesService`.

Pontos afetados:

- `backend/clientes/clientes.controller.ts`
- `backend/produtos/produtos.controller.ts`
- `backend/ordens/ordens.controller.ts`

### 4. Integracao Prisma real do host

O contrato de manifesto e validacao foi corrigido, mas o runtime do host ainda nao possui uma integracao pronta para materializar as tabelas `mod_ordem_servico_*` via client Prisma seguro dentro do sandbox do modulo. Isso significa que a migracao completa para ORM seguro ainda exige refactor coordenado com o backend principal.

## Proxima etapa recomendada

Executar o refactor em blocos:

1. `configuracoes`, `clientes` e `produtos`
2. `shared/services/permission.service.ts`
3. `notifications`
4. `ordens.service.ts`
5. migracao de uploads para `SecureFilesService`

Essa ordem reduz risco e preserva comportamento.
