# CHANGELOG - Modulo Ordem de Servico

## [1.0.0] - 2026-04-08
### Nucleo migrado para Prisma + ALS
- Criada camada Prisma local do modulo em `backend/prisma/`, com schema proprio, client gerado e service com bloqueio de operacoes RAW.
- Nucleo backend migrado para consultas Prisma usando models `mod_ordem_servico_*`, sem `tenantId` manual nas operacoes HTTP principais.
- Refatorados blocos de `configuracoes`, `clientes`, `produtos`, `shared`, `notifications`, `core` e `ordens` para operar com ALS + Prisma Extension.
- `ordens.service.ts` foi reestruturado para preservar a logica de negocio sem depender de SQL raw.
- Jobs e listeners de notificacao passaram a usar varredura controlada fora do tenant e execucao segura por tenant com retorno ao contexto via `runWithActor(...)`.

### Validacao desta rodada
- `corepack pnpm -C apps/backend build` concluido com sucesso.
- O validator do host ainda retorna 1 erro de prefixo Prisma, apesar de o schema do modulo usar `@@map("mod_ordem_servico_*")`.
- Uploads continuam como pendencia de compatibilidade com a stack segura do host.

## [3.1.1] - 2026-04-07
### Compatibilidade com a arquitetura Pluggor atual
- Adicionado `moduleApiVersion: 1` e normalizacao do contrato de manifesto.
- Menus atualizados com `placement`, `id` e `isQuickAction`.
- `OrdemServicoModule` passou a expor `static SLUG`.
- `backend/index.ts` alinhado ao contrato atual de dashboard/menu.
- Criado `ModuleAccessGuard` no frontend e mantida compatibilidade via `ModulePageGuard`.
- Controllers principais passaram a expor `@Permissions(...)` de forma explicita.
- Removido fallback de `x-tenant-id` em controllers de configuracao.
- Removidos hardcodes de cor que bloqueavam a validacao do modulo.

### Riscos restantes
- O backend ainda tinha uso extensivo de RAW queries na base legada.
- Uploads ainda nao foram migrados para `SecureFilesService`.
- A migracao completa para runtime safety dependia de refactor profundo dos services.

## [3.1.0] - Atual
### Funcionalidades implementadas
- Diretrizes de IA em `DOCS/IA_PROMPT_CRIACAO_MODULO.md`.
- Centralizacao de uploads e alinhamento inicial com o sistema hospedeiro.
- Revisao detalhada da arquitetura multitenant.

## [3.0.0] - Atualizacoes estruturais
### Refatoracao e compatibilidade
- Remocao do prefixo `/api` dos controllers do modulo.
- Migracao de notificacoes transacionais para a stack central.
- Jobs e crons desacoplados para a API do host.
- Registro dinamico de modulo no backend e no frontend.

## [2.2.0] - 2026-01-24
### Correcao critica de carregamento
- Modulo confirmado no loader dinamico.
- Estrutura backend/frontend consolidada para distribuicao.
- Tabelas `mod_ordem_servico_*` e dados padrao verificados.
- Endpoints principais de ordens, clientes, produtos e configuracoes ativados.

## [2.1.0] - 2026-01-20
### Funcionalidades implementadas
- Sistema completo de ordens de servico.
- Gestao de clientes e produtos.
- Sistema de permissoes avancado.
- Dashboard com metricas.
- Integracao WhatsApp.
- Geracao de PDFs.

## [2.0.0] - 2026-01-18
### Refatoracao completa
- Migracao para arquitetura modular.
- Separacao backend/frontend.
- Sistema de permissoes reescrito.
- Otimizacao de performance.

## [1.0.0] - 2026-01-10
### Lancamento inicial
- Funcionalidades basicas implementadas.
- Estrutura inicial do banco.
- Interfaces basicas criadas.
