# Relatorio Completo Para Agente de IA

## Modulo

- Modulo: `ordem_servico`
- Data de referencia: `2026-04-17`
- Repositorios envolvidos:
  - Plataforma host: `D:\Compartilhado\Servidor\GORInformatica\Documents\GitHub\Pluggor`
  - Modulo base: `D:\Compartilhado\Servidor\GORInformatica\Documents\GitHub\module-os`

## Objetivo Deste Documento

Este documento serve como handoff completo para outro agente de IA ou desenvolvedor continuar o trabalho no modulo `ordem_servico` sem perder contexto.

Ele registra:

- o que foi alterado
- por que foi alterado
- quais arquivos foram afetados
- como ficou a nova estrutura
- o que foi validado
- o que ainda merece atencao

## Resumo Executivo

Durante esta sequencia de trabalho foram feitas quatro frentes principais:

1. Correcoes no core da plataforma para ativacao global de modulos e ativacao por tenant.
2. Ajustes de UX e comportamento no dashboard do modulo `ordem_servico`.
3. Reestruturacao importante do banco do modulo:
   - clientes sairam do prefixo `ordem_servico` e passaram para prefixo `clientes`
   - configuracao de IA saiu do escopo de `ordem_servico` e passou para prefixo `integracoes`
4. Publicacao correta de menu e rota da pagina de clientes, inclusive sincronizando o modulo base `module-os`.

## Contexto de Negocio e Decisoes Tomadas

### 1. Estado global x estado por tenant

O usuario esclareceu que:

- o gerenciamento global de modulos deve ativar/desativar o modulo globalmente
- a tela em `Empresas > Gerenciar modulos` deve apenas ativar/desativar o modulo na tenant

Com base nisso, as alteracoes no core foram separadas entre:

- estado global do modulo
- estado do modulo na tenant

### 2. Reestruturacao das tabelas compartilhadas

O usuario pediu:

- que a tabela de clientes do modulo deixasse de usar prefixo de OS
- que a referencia passasse a ser de `clientes`, mesmo que o modulo `clientes` ainda nao exista
- que a configuracao da aba `Inteligencia Artificial` passasse a ter referencia de `integracoes`
- que todas as referencias fossem ajustadas
- que a migration nao quebrasse bases existentes

### 3. Estrategia adotada para compatibilidade

Foi adotada a seguinte regra:

- `mod_ordem_servico_configs` continua existindo para configuracoes especificas do modulo OS
- `mod_clientes_clients` passa a ser a tabela de clientes usada pelo modulo
- `mod_integracoes_configs` passa a armazenar a configuracao de IA
- uma migration de compatibilidade foi criada para:
  - renomear a tabela antiga de clientes quando necessario
  - criar tabelas novas se nao existirem
  - adicionar colunas faltantes se necessario
  - copiar `ai_integration` da tabela antiga para a nova quando aplicavel

Isso atende o pedido de:

- criar apenas se nao existir
- pular quando a estrutura ja estiver correta
- preservar ambientes ja existentes

## Alteracoes Realizadas

## A. Core Da Plataforma

Essas alteracoes sao da plataforma `Pluggor`, nao do modulo base `module-os`.

### Objetivo

- garantir que a ativacao global do modulo persista corretamente
- garantir que a ativacao por tenant nao interfira no estado global
- recarregar o backend em ambiente local quando a ativacao global mudar

### Arquivos alterados

- `apps/backend/src/core/module-installer.controller.ts`
- `apps/backend/src/tenants/tenants.controller.ts`
- `apps/backend/src/__module_runtime_reload__.ts`

### Resultado

- o toggle global grava o estado global e aciona recarga automatica do backend em desenvolvimento
- o toggle por tenant passa a tratar apenas o estado da tenant

## B. Dashboard Do Modulo Ordem De Servico

### Objetivo

- fazer os botoes do dashboard usarem as mesmas acoes reais da pagina de ordens
- melhorar tamanho e consistencia dos botoes e icones
- remover ruido visual desnecessario no card

### Arquivo principal

- `apps/frontend/src/app/modules/ordem_servico/pages/dashboard/page.tsx`

### Sincronizado tambem para

- `D:\Compartilhado\Servidor\GORInformatica\Documents\GitHub\module-os\frontend\pages\dashboard\page.tsx`

### Ajustes aplicados

- alinhamento das acoes do dashboard com a tela de ordens
- padronizacao do container dos botoes de acao
- ajuste de tamanho dos icones com base no botao, e nao apenas no SVG
- refinamentos especificos para impressao
- melhoria de consistencia visual nas acoes do card

## C. Reestruturacao Das Tabelas Do Modulo

### 1. Clientes

#### Estrutura anterior

- clientes estavam vinculados a tabela com prefixo de OS:
  - `mod_ordem_servico_clients`

#### Estrutura nova

- clientes agora ficam em:
  - `mod_clientes_clients`

#### Impacto esperado

- o modulo `ordem_servico` passa a depender de uma tabela conceitualmente compartilhada com o dominio `clientes`
- isso prepara a arquitetura para reutilizacao futura por um modulo de clientes

### 2. Configuracao de IA

#### Estrutura anterior

- configuracao de IA era lida/escrita junto de `mod_ordem_servico_configs`

#### Estrutura nova

- configuracao da aba `Inteligencia Artificial` passa a usar:
  - `mod_integracoes_configs`

#### Observacao importante

- apenas a configuracao de IA foi movida
- configuracoes genericas do modulo OS continuam em `mod_ordem_servico_configs`

Essa decisao evita misturar configuracoes operacionais do modulo com configuracoes de integracao externa.

## D. Arquivos Alterados Na Reestruturacao De Banco E Backend

### Prisma schema

- `apps/backend/src/modules/ordem_servico/prisma/schema.prisma`

#### Mudancas principais

- adicionado model `mod_integracoes_configs`
- renomeado model de clientes para `mod_clientes_clients`
- relacao de `mod_ordem_servico_ordens` atualizada para apontar para `mod_clientes_clients`

### Migration base

- `apps/backend/src/modules/ordem_servico/migrations/001_schema_v400.sql`

#### Mudancas principais

- criacao de `mod_integracoes_configs`
- criacao de `mod_clientes_clients`
- foreign key de ordens atualizada para `mod_clientes_clients`
- indices e triggers ajustados para os novos nomes

### Migration de compatibilidade

- `apps/backend/src/modules/ordem_servico/migrations/002_shared_tables_prefixes.sql`

#### Funcao desta migration

- renomear `mod_ordem_servico_clients` para `mod_clientes_clients` quando necessario
- criar `mod_clientes_clients` se nao existir
- completar colunas faltantes usando `ADD COLUMN IF NOT EXISTS`
- criar `mod_integracoes_configs` se nao existir
- copiar `ai_integration` da configuracao antiga para a nova
- criar indices, constraints e triggers sem quebrar instalacoes existentes

### Repositorio de clientes

- `apps/backend/src/modules/ordem_servico/clientes/src/repositories/cliente.repository.ts`

#### Mudanca

- passou a usar `this.prisma.mod_clientes_clients`

### Listener de notificacoes

- `apps/backend/src/modules/ordem_servico/notifications/event-listener.service.ts`

#### Mudanca

- busca de cliente passou a usar `mod_clientes_clients`

### Servico compartilhado de IA

- `apps/backend/src/modules/ordem_servico/shared/services/ai.service.ts`

#### Mudanca

- leitura de configuracao passou a usar `mod_integracoes_configs`

### Servico de configuracoes

- `apps/backend/src/modules/ordem_servico/configuracoes/configuracoes.service.ts`

#### Mudancas principais

- `getAiConfig()` passou a ler de integracoes
- `updateAiConfig()` passou a salvar em integracoes
- `getAiConfigInternal()` passou a usar integracoes
- helpers novos:
  - `readIntegrationConfigValue`
  - `upsertIntegrationConfigValue`

#### Observacao importante

Configuracoes nao relacionadas a IA continuam em `mod_ordem_servico_configs`, por exemplo:

- templates do modulo
- opcoes operacionais
- chaves de configuracao especificas de OS

## E. Frontend Do Modulo

### Menu de clientes

Arquivo:

- `apps/frontend/src/app/modules/ordem_servico/menu.ts`

Mudanca:

- adicionado item `Clientes`
- rota: `/modules/ordem_servico/pages/clientes`

### Manifesto frontend

Arquivo:

- `apps/frontend/src/app/modules/ordem_servico/module-manifest.ts`

Estado final:

- o modulo expõe a entrada `Clientes` no manifesto do frontend

### Rota do modulo

Arquivo:

- `apps/frontend/src/app/modules/ordem_servico/routes.tsx`

Mudanca aplicada:

- inclusao explicita da rota:
  - `/modules/ordem_servico/pages/clientes`

### Pagina de clientes

Arquivo:

- `apps/frontend/src/app/modules/ordem_servico/pages/clientes/page.tsx`

Estado atual:

- continua usando os endpoints do backend em `/api/ordem_servico/clientes`
- isso esta correto, porque a mudanca foi na tabela persistida, nao na URL publica

### Pagina de configuracoes - aba IA

Arquivo:

- `apps/frontend/src/app/modules/ordem_servico/pages/configuracoes/page.tsx`

Estado atual:

- continua chamando:
  - `GET /api/ordem_servico/config/ia`
  - `POST /api/ordem_servico/config/ia`
  - `POST /api/ordem_servico/config/ia/test`
- isso esta correto
- o que mudou foi a persistencia interna no backend

## F. Manifestos E Metadados Do Modulo

### Arquivos

- `apps/backend/src/modules/ordem_servico/module.json`
- `apps/backend/src/modules/ordem_servico/module.config.json`

### Mudancas aplicadas

- menu `Clientes` adicionado
- contador de menus atualizado
- atalho de dashboard atualizado para incluir `Clientes`
- rotas publicadas incluem `/ordem_servico/clientes`
- lista de tabelas do modulo atualizada para:
  - `mod_ordem_servico_configs`
  - `mod_integracoes_configs`
  - `mod_clientes_clients`

## G. Prisma Client Gerado

Foi regenerado o client Prisma do modulo:

- `apps/backend/src/modules/ordem_servico/generated/prisma-client/*`

O client gerado agora inclui:

- `mod_integracoes_configs`
- `mod_clientes_clients`
- relacoes de ordens apontando para `mod_clientes_clients`

## Sincronizacao Com O Modulo Base

### Regra operacional seguida

Sempre que a mudanca pertencia ao modulo, ela foi sincronizada para o modulo base:

- `D:\Compartilhado\Servidor\GORInformatica\Documents\GitHub\module-os`

### Arquivos sincronizados no `module-os`

- `backend/prisma/schema.prisma`
- `backend/migrations/001_schema_v400.sql`
- `backend/migrations/002_shared_tables_prefixes.sql`
- `backend/clientes/src/repositories/cliente.repository.ts`
- `backend/configuracoes/configuracoes.service.ts`
- `backend/notifications/event-listener.service.ts`
- `backend/shared/services/ai.service.ts`
- `backend/module.json`
- `backend/module.config.json`
- `frontend/menu.ts`
- `frontend/routes.tsx`
- `module.json`
- `backend/generated/prisma-client/*`
- `frontend/pages/dashboard/page.tsx` nas alteracoes anteriores de dashboard

## Validacoes Executadas

### Build backend

Comando executado:

```powershell
corepack pnpm -C apps/backend build
```

Resultado:

- build concluida com sucesso

### Build frontend

Comando executado:

```powershell
corepack pnpm -C apps/frontend build
```

Resultado:

- build concluida com sucesso
- rota `/modules/ordem_servico/pages/clientes` apareceu no output da build

### Verificacoes adicionais

- o nome antigo `mod_ordem_servico_clients` nao ficou espalhado pelo codigo operacional
- ele foi preservado apenas na migration de compatibilidade, o que e esperado
- menu e manifesto do modulo agora incluem `Clientes`
- `routes.tsx` do frontend tambem publica a rota de `Clientes`

## Estado Atual

### Pluggor

- estado atual considerado consistente
- sem pendencias abertas desta sequencia
- builds validadas

### module-os

- sincronizado com as mudancas do modulo
- documento de handoff tambem deve existir no `module-os/DOCS`

## Pontos De Atencao Para O Proximo Agente

1. Nao reverter o uso de `mod_clientes_clients`.
   Isso foi pedido explicitamente pelo usuario.

2. Nao mover toda configuracao do modulo para `integracoes`.
   Apenas a configuracao da aba de IA foi movida para `mod_integracoes_configs`.

3. Se novas telas ou repositorios fizerem busca de clientes por acesso direto ao Prisma, confirmar que usam `mod_clientes_clients`.

4. Se novas rotas de configuracao de IA forem criadas, garantir que persistam em `mod_integracoes_configs`.

5. Em qualquer alteracao futura pertencente ao modulo, replicar para:
   - `D:\Compartilhado\Servidor\GORInformatica\Documents\GitHub\module-os`

6. Alteracoes de core da plataforma nao devem ser copiadas para `module-os`.

## Checklist Rapido Para Continuidade

- clientes estao em `mod_clientes_clients`
- IA esta em `mod_integracoes_configs`
- configs gerais continuam em `mod_ordem_servico_configs`
- migration de compatibilidade existe
- menu de clientes existe
- rota frontend de clientes existe
- `module-os` deve permanecer sincronizado

## Arquivos Mais Importantes Para Ler Primeiro

### Core da plataforma

- `apps/backend/src/core/module-installer.controller.ts`
- `apps/backend/src/tenants/tenants.controller.ts`
- `apps/backend/src/__module_runtime_reload__.ts`

### Banco e backend do modulo

- `apps/backend/src/modules/ordem_servico/prisma/schema.prisma`
- `apps/backend/src/modules/ordem_servico/migrations/001_schema_v400.sql`
- `apps/backend/src/modules/ordem_servico/migrations/002_shared_tables_prefixes.sql`
- `apps/backend/src/modules/ordem_servico/configuracoes/configuracoes.service.ts`
- `apps/backend/src/modules/ordem_servico/clientes/src/repositories/cliente.repository.ts`
- `apps/backend/src/modules/ordem_servico/shared/services/ai.service.ts`
- `apps/backend/src/modules/ordem_servico/module.config.json`
- `apps/backend/src/modules/ordem_servico/module.json`

### Frontend do modulo

- `apps/frontend/src/app/modules/ordem_servico/pages/dashboard/page.tsx`
- `apps/frontend/src/app/modules/ordem_servico/pages/clientes/page.tsx`
- `apps/frontend/src/app/modules/ordem_servico/pages/configuracoes/page.tsx`
- `apps/frontend/src/app/modules/ordem_servico/menu.ts`
- `apps/frontend/src/app/modules/ordem_servico/module-manifest.ts`
- `apps/frontend/src/app/modules/ordem_servico/routes.tsx`

### Modulo base sincronizado

- `D:\Compartilhado\Servidor\GORInformatica\Documents\GitHub\module-os\backend\prisma\schema.prisma`
- `D:\Compartilhado\Servidor\GORInformatica\Documents\GitHub\module-os\backend\migrations\002_shared_tables_prefixes.sql`
- `D:\Compartilhado\Servidor\GORInformatica\Documents\GitHub\module-os\frontend\routes.tsx`
- `D:\Compartilhado\Servidor\GORInformatica\Documents\GitHub\module-os\frontend\menu.ts`

## Conclusao

O modulo `ordem_servico` foi reestruturado para separar melhor responsabilidades:

- clientes agora apontam para o dominio `clientes`
- IA agora aponta para o dominio `integracoes`
- o modulo continua funcionando com compatibilidade para bases ja existentes
- o menu e a rota de clientes foram corrigidos
- o modulo base `module-os` foi mantido sincronizado com as mudancas do proprio modulo

Este e o ponto correto de retomada para qualquer novo agente.
