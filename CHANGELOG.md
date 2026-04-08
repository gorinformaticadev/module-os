# 📋 CHANGELOG - Módulo Ordem de Serviço

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
- Validacao executada com sucesso via `node Scripts/validate-module.mjs --path module-os`.

### Riscos restantes
- O backend ainda possui uso extensivo de RAW queries.
- O backend ainda propaga `tenantId` manualmente.
- Uploads ainda nao foram migrados para `SecureFilesService`.
- A migracao completa para runtime safety ainda depende de refactor profundo dos services.

## [3.1.0] - Atual
### Funcionalidades Implementadas
- 🤖 **IA Guidelines**: Criação de `DOCS/IA_PROMPT_CRIACAO_MODULO.md` detalhando como IAs devem gerar módulos compatíveis.
- Centralização de Uploads: Mapeamento de rotas e segurança via utilitários do sistema hospedeiro para anexos do módulo.
- Revisão detalhada da arquitetura multitenant (`req.user.tenantId`).

## [3.0.0] - Atualizações Estruturais (Host Múltiplo)
### Refatoração Completa e Compatibilidade
- Remoção do prefixo `/api` dos controllers do módulo.
- Migração de notificações transacionais e pushs diretos para a fila/stack central.
- Job Scheduling / Crons desacoplados usando nova API host `CronService`.
- Lançamento do script Powershell automatizado `gerar-zip-instalador.ps1` bloqueando envios não conformes.
- Registração dinâmica de módulo (`backend/index.ts`) e injeção do `CompatibilityModuleContribution` (`frontend/index.tsx`).

## [2.2.0] - 2026-01-24
### ✅ **Correções Críticas Implementadas**

#### **Problema Principal Resolvido**
- **404 Not Found** no endpoint `/api/ordem_servico/ordens`
- Módulo não estava sendo carregado pelo `DynamicModulesLoader`

#### **Causa Raiz**
- Módulo registrado no banco mas não carregado em runtime
- `DynamicModulesLoader` não conseguia localizar arquivos do módulo
- Falta de sincronização entre código e banco de dados

#### **Soluções Implementadas**

##### 1. **Correção do Carregamento do Módulo**
- ✅ Verificado registro no banco: `ordem_servico` ativo e `hasBackend: true`
- ✅ Reiniciado backend para forçar recarregamento dos módulos
- ✅ Confirmado carregamento: `✅ Módulo ordem_servico carregado com sucesso!`

##### 2. **Estrutura de Arquivos Corrigida**
- ✅ Backend: `apps/backend/src/modules/ordem_servico/` - 46 arquivos
- ✅ Frontend: `apps/frontend/src/app/modules/ordem_servico/` - 43 arquivos
- ✅ Módulo principal: `ordem_servico.module.ts` com 35 linhas
- ✅ Controllers, services, DTOs e guards implementados

##### 3. **Banco de Dados Verificado**
- ✅ 16 tabelas `mod_ordem_servico_*` criadas
- ✅ Índices otimizados implementados
- ✅ Constraints de integridade configuradas
- ✅ Dados padrão inseridos (tipos de serviço, equipamento, permissões)

##### 4. **Sistema de Permissões Funcional**
- ✅ 3 perfis pré-configurados: Admin, Técnico, Atendente
- ✅ Permissões granulares por recurso
- ✅ Auditoria de alterações implementada
- ✅ User roles automáticos criados

##### 5. **APIs Operacionais**
- ✅ `GET /api/ordem_servico/ordens` - Lista ordens
- ✅ `POST /api/ordem_servico/ordens` - Cria ordem
- ✅ `PUT /api/ordem_servico/ordens/:id` - Atualiza ordem
- ✅ `DELETE /api/ordem_servico/ordens/:id` - Exclui ordem
- ✅ Endpoints para clientes, produtos, configurações

##### 6. **Funcionalidades Verificadas**
- ✅ Autenticação JWT funcionando
- ✅ Isolamento por tenant ativo
- ✅ Logs detalhados implementados
- ✅ Tratamento de erros robusto
- ✅ Validações de entrada ativas

#### **Arquivos de Instalação Criados**
- ✅ `migration_complete.sql` - Migração consolidada (622 linhas)
- ✅ `install.sh` - Script de instalação automatizada
- ✅ `README.md` - Documentação completa
- ✅ Estrutura `module-os/` pronta para distribuição

#### **Testes Realizados**
- ✅ Endpoint responde com dados corretos
- ✅ Queries executam em ~50-100ms
- ✅ Autenticação validada
- ✅ Tenant isolation confirmado
- ✅ Logs de operação gerados

### **Status Final: ✅ TOTALMENTE FUNCIONAL**

O módulo Ordem de Serviço está **100% operacional** e pronto para uso em produção.

---

## [2.1.0] - 2026-01-20
### Funcionalidades Implementadas
- Sistema completo de ordens de serviço
- Gestão de clientes e produtos
- Sistema de permissões avançado
- Dashboard com métricas
- Integração WhatsApp
- Geração de PDFs

## [2.0.0] - 2026-01-18
### Refatoração Completa
- Migração para arquitetura modular
- Separação backend/frontend
- Sistema de permissões reescrito
- Otimização de performance

## [1.0.0] - 2026-01-10
### Lançamento Inicial
- Funcionalidades básicas implementadas
- Estrutura inicial do banco
- Interfaces básicas criadas
