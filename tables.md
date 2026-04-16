# Levantamento de Tabelas e Campos do Módulo Ordem de Serviço

Fonte deste levantamento:

- `apps/backend/src/modules/ordem_servico/prisma/schema.prisma`
- `apps/backend/src/modules/ordem_servico/migrations/001_schema_v400.sql`
- `apps/backend/src/modules/ordem_servico/ordens/ordens.service.ts`
- `apps/backend/src/modules/ordem_servico/clientes/clientes.service.ts`
- `apps/backend/src/modules/ordem_servico/produtos/produtos.service.ts`
- `apps/backend/src/modules/ordem_servico/shared/dto/ordem-servico.dto.ts`

## Regras Gerais para Migração

- Quase todas as tabelas do módulo possuem `tenant_id` e dependem do tenant correto.
- IDs principais do módulo usam `UUID`.
- Alguns campos do módulo são gravados como JSON serializado em coluna `TEXT`.
- Não existe um campo `nome` para a OS. Os campos principais da OS são:
  - `numero`: número da ordem
  - `descricao`: descrição do problema/serviço
- Em vários pontos o sistema usa nomes lógicos em `snake_case` na API, mas o Prisma trabalha com nomes em `camelCase`. Neste documento, a coluna do banco é a referência principal.

## Relacionamentos Principais

- Cliente: `mod_ordem_servico_clients`
- Produto/Serviço: `mod_ordem_servico_products`
- Ordem de Serviço: `mod_ordem_servico_ordens`
- Histórico textual da OS: `mod_ordem_servico_historico`
- Histórico de status da OS: `mod_ordem_servico_status_historico`
- Pagamentos da OS: `mod_ordem_servico_pagamentos`
- Alertas de abandono: `mod_ordem_servico_alertas_abandono`
- Anexos dos alertas: `mod_ordem_servico_anexos_abandono`
- Tipos de serviço: `mod_ordem_servico_tipos_servico`
- Tipos de equipamento: `mod_ordem_servico_tipos_equipamento`
- Configurações gerais do módulo: `mod_ordem_servico_configs`

---

## 1. `mod_ordem_servico_clients`

Uso: cadastro de clientes.

| Coluna banco | Campo lógico/API | Tipo | Obrigatório | Observação |
|---|---|---|---|---|
| `id` | `id` | UUID | Sim | PK |
| `tenant_id` | `tenant_id` | TEXT | Sim | Tenant do registro |
| `name` | `name` | VARCHAR(255) | Sim | Nome do cliente |
| `document` | `document` | VARCHAR(20) | Não | CPF/CNPJ/RG/outro documento |
| `phone_primary` | `phone_primary` | VARCHAR(20) | Sim | Telefone principal |
| `phone_secondary` | `phone_secondary` | VARCHAR(20) | Não | Telefone secundário |
| `email` | `email` | VARCHAR(255) | Não | Email do cliente |
| `address` | `address` | TEXT | Não | Endereço livre consolidado |
| `address_zip` | `address_zip` | VARCHAR(10) | Não | CEP |
| `address_street` | `address_street` | VARCHAR(255) | Não | Rua |
| `address_number` | `address_number` | VARCHAR(20) | Não | Número |
| `address_complement` | `address_complement` | VARCHAR(100) | Não | Complemento |
| `address_neighborhood` | `address_neighborhood` | VARCHAR(100) | Não | Bairro |
| `address_city` | `address_city` | VARCHAR(100) | Não | Cidade |
| `address_state` | `address_state` | VARCHAR(2) | Não | UF |
| `observations` | `observations` | TEXT | Não | Observações do cliente |
| `image_url` | `image_url` | TEXT | Não | URL da imagem/foto do cliente |
| `is_active` | `is_active` | BOOLEAN | Não | Default `true` |
| `created_at` | `created_at` | TIMESTAMP | Não | Criação |
| `updated_at` | `updated_at` | TIMESTAMP | Não | Atualização |
| `deleted_at` | `deleted_at` | TIMESTAMP | Não | Soft delete |

Observação de relacionamento:

- A OS usa `cliente_id` apontando para `mod_ordem_servico_clients.id`.

---

## 2. `mod_ordem_servico_products`

Uso: produtos e serviços vinculáveis à OS.

| Coluna banco | Campo lógico/API | Tipo | Obrigatório | Observação |
|---|---|---|---|---|
| `id` | `id` | UUID | Sim | PK |
| `tenant_id` | `tenant_id` | TEXT | Sim | Tenant do registro |
| `code` | `code` | VARCHAR(50) | Sim | Código do produto |
| `name` | `name` | VARCHAR(255) | Sim | Nome do produto |
| `type` | `type` | VARCHAR(20) | Sim | Default `PRODUCT`; pode representar produto/serviço |
| `price` | `price` | DECIMAL(10,2) | Sim | Preço de venda |
| `cost_price` | `cost_price` | DECIMAL(10,2) | Não | Custo |
| `description` | `description` | TEXT | Não | Descrição |
| `image_url` | `image_url` | TEXT | Não | URL da imagem do produto |
| `is_active` | `is_active` | BOOLEAN | Não | Default `true` |
| `created_at` | `created_at` | TIMESTAMP | Não | Criação |
| `updated_at` | `updated_at` | TIMESTAMP | Não | Atualização |
| `deleted_at` | `deleted_at` | TIMESTAMP | Não | Soft delete |

---

## 3. `mod_ordem_servico_ordens`

Uso: tabela principal da OS.

| Coluna banco | Campo lógico/API | Tipo | Obrigatório | Observação |
|---|---|---|---|---|
| `id` | `id` | UUID | Sim | PK |
| `tenant_id` | `tenant_id` | TEXT | Sim | Tenant do registro |
| `numero` | `numero` | TEXT | Sim | Número da OS |
| `cliente_id` | `cliente_id` | UUID | Sim | FK para cliente |
| `usuario_responsavel_id` | `usuario_responsavel_id` | TEXT | Sim | ID do usuário responsável |
| `tipo_servico` | `tipo_servico` | TEXT | Sim | Nome do tipo de serviço |
| `descricao` | `descricao` | TEXT | Sim | Descrição principal da OS |
| `observacoes_internas` | `observacoes_internas` | TEXT | Não | Observação interna |
| `observacoes_cliente` | `observacoes_cliente` | TEXT | Não | Observação visível/relacionada ao cliente |
| `valor_servico` | `valor_servico` | DECIMAL(10,2) | Não | Valor do serviço |
| `forma_pagamento` | `forma_pagamento` | TEXT | Não | Forma de pagamento principal |
| `status` | `status` | INTEGER | Sim | Status da OS |
| `prioridade` | `prioridade` | TEXT | Não | `BAIXA`, `MEDIA`, `ALTA` |
| `data_abertura` | `data_abertura` | TIMESTAMP | Não | Data de abertura |
| `data_previsao` | `data_previsao` | TIMESTAMP | Não | Previsão |
| `data_conclusao` | `data_conclusao` | TIMESTAMP | Não | Conclusão |
| `origem_solicitacao` | `origem_solicitacao` | TEXT | Sim | `WHATSAPP`, `PRESENCIAL`, `SISTEMA` |
| `orcamento_aprovado` | `orcamento_aprovado` | BOOLEAN | Não | Se orçamento foi aprovado |
| `motivo_cancelamento` | `motivo_cancelamento` | TEXT | Não | Motivo do cancelamento |
| `equipamento_tipo` | `equipamento_tipo` | TEXT | Não | Tipo do equipamento |
| `equipamento_marca` | `equipamento_marca` | TEXT | Não | Marca |
| `equipamento_modelo` | `equipamento_modelo` | TEXT | Não | Modelo |
| `equipamento_serie` | `equipamento_serie` | TEXT | Não | Número de série |
| `equipamento_acessorios` | `equipamento_acessorios` | TEXT | Não | Acessórios entregues |
| `equipamento_estado` | `equipamento_estado` | TEXT | Não | Estado do equipamento |
| `equipamento_fotos` | `equipamento_fotos` | TEXT | Não | JSON serializado com array de URLs |
| `laudo_tecnico` | `laudo_tecnico` | TEXT | Não | Laudo técnico |
| `itens` | `itens` | TEXT | Não | JSON serializado com itens da OS |
| `formatting_so` | `formatacao_so` | TEXT | Não | Sistema operacional da formatação |
| `formatting_backup` | `formatacao_backup` | BOOLEAN | Não | Se haverá backup |
| `formatting_backup_descricao` | `formatacao_backup_descricao` | TEXT | Não | Descrição do backup |
| `formatting_senha` | `formatacao_senha` | TEXT | Não | Senha informada |
| `garantia_dias` | `garantia_dias` | INTEGER | Não | Garantia em dias |
| `valor_conservacao` | `valor_conservacao` | DECIMAL(10,2) | Não | Cobrança de conservação |
| `dias_atraso` | `dias_atraso` | INTEGER | Não | Dias em atraso para retirada |
| `justificativa_conservacao` | `justificativa_conservacao` | TEXT | Não | Justificativa de conservação |
| `data_limite_retirada` | `data_limite_retirada` | TIMESTAMP | Não | Limite de retirada |
| `data_retirada` | `data_retirada` | TIMESTAMP | Não | Data efetiva da retirada |
| `created_at` | `created_at` | TIMESTAMP | Não | Criação |
| `updated_at` | `updated_at` | TIMESTAMP | Não | Atualização |

### Estrutura do JSON salvo em `mod_ordem_servico_ordens.itens`

O campo `itens` é salvo como `TEXT`, contendo JSON serializado com a seguinte estrutura por item:

| Campo no JSON | Tipo | Observação |
|---|---|---|
| `produto_id` | string \| null | ID do produto, quando houver vínculo com cadastro |
| `descricao` | string | Descrição do item |
| `valor_unitario` | number | Valor unitário |
| `quantidade` | number | Quantidade |
| `valor_total` | number | Total do item |

### Estrutura do JSON salvo em `mod_ordem_servico_ordens.equipamento_fotos`

| Campo | Tipo | Observação |
|---|---|---|
| `[]` | array de string | Lista de URLs das fotos |

### Status usados em `status`

| Código | Nome lógico |
|---|---|
| `0` | ORCAMENTO |
| `1` | ABERTA |
| `2` | EM_ANALISE |
| `3` | AGUARDANDO_CLIENTE |
| `4` | AGUARDANDO_PECAS |
| `5` | EM_EXECUCAO |
| `6` | FINALIZADA |
| `7` | CANCELADA |
| `8` | RETIRADO |
| `9` | ABANDONADO |

---

## 4. `mod_ordem_servico_historico`

Uso: histórico textual/manual da OS.

| Coluna banco | Campo lógico/API | Tipo | Obrigatório | Observação |
|---|---|---|---|---|
| `id` | `id` | UUID | Sim | PK |
| `tenant_id` | `tenant_id` | TEXT | Sim | Tenant |
| `ordem_servico_id` | `ordem_servico_id` | UUID | Sim | FK da OS |
| `usuario_id` | `usuario_id` | TEXT | Sim | Usuário que gerou a ação |
| `acao` | `acao` | TEXT | Sim | Tipo de ação |
| `valor_anterior` | `valor_anterior` | TEXT | Não | Valor anterior |
| `valor_novo` | `valor_novo` | TEXT | Não | Valor novo |
| `observacoes` | `observacoes` | TEXT | Não | Observação livre |
| `created_at` | `created_at` | TIMESTAMP | Não | Criação |

---

## 5. `mod_ordem_servico_status_historico`

Uso: trilha de troca de status da OS.

| Coluna banco | Campo lógico/API | Tipo | Obrigatório | Observação |
|---|---|---|---|---|
| `id` | `id` | UUID | Sim | PK |
| `tenant_id` | `tenant_id` | TEXT | Sim | Tenant |
| `ordem_servico_id` | `ordem_servico_id` | UUID | Sim | FK da OS |
| `status_anterior` | `status_anterior` | INTEGER | Sim | Código do status anterior |
| `status_novo` | `status_novo` | INTEGER | Sim | Código do status novo |
| `usuario_id` | `usuario_id` | TEXT | Sim | Usuário que fez a troca |
| `data_alteracao` | `data_alteracao` | TIMESTAMP | Sim | Momento da troca |
| `observacoes` | `observacoes` | TEXT | Não | Observação da mudança |
| `created_at` | `created_at` | TIMESTAMP | Não | Criação |

---

## 6. `mod_ordem_servico_pagamentos`

Uso: pagamentos vinculados a uma OS.

| Coluna banco | Campo lógico/API | Tipo | Obrigatório | Observação |
|---|---|---|---|---|
| `id` | `id` | UUID | Sim | PK |
| `tenant_id` | `tenant_id` | TEXT | Sim | Tenant |
| `ordem_servico_id` | `ordem_servico_id` | UUID | Sim | FK da OS |
| `forma_pagamento` | `forma_pagamento` | VARCHAR(50) | Sim | Cartão, dinheiro, pix etc. |
| `valor` | `valor` | DECIMAL(10,2) | Sim | Valor pago |
| `parcelas` | `parcelas` | INTEGER | Não | Default `1` |
| `observacoes` | `observacoes` | TEXT | Não | Observação do pagamento |
| `created_at` | `created_at` | TIMESTAMP | Não | Criação |
| `created_by` | `created_by` | TEXT | Sim | Usuário que lançou |

---

## 7. `mod_ordem_servico_alertas_abandono`

Uso: alertas de abandono após finalização sem retirada.

| Coluna banco | Campo lógico/API | Tipo | Obrigatório | Observação |
|---|---|---|---|---|
| `id` | `id` | UUID | Sim | PK |
| `tenant_id` | `tenant_id` | TEXT | Sim | Tenant |
| `ordem_servico_id` | `ordem_servico_id` | UUID | Sim | FK da OS |
| `numero_alerta` | `numero_alerta` | INTEGER | Sim | Geralmente 1 a 3 |
| `data_envio` | `data_envio` | TIMESTAMP | Sim | Momento do alerta |
| `meio_comunicacao` | `meio_comunicacao` | VARCHAR(50) | Sim | WhatsApp, email, telefone etc. |
| `enviado_por` | `enviado_por` | TEXT | Sim | Usuário que enviou |
| `mensagem` | `mensagem` | TEXT | Não | Conteúdo |
| `observacoes` | `observacoes` | TEXT | Não | Observações |
| `created_at` | `created_at` | TIMESTAMP | Não | Criação |

---

## 8. `mod_ordem_servico_anexos_abandono`

Uso: anexos dos alertas de abandono.

| Coluna banco | Campo lógico/API | Tipo | Obrigatório | Observação |
|---|---|---|---|---|
| `id` | `id` | UUID | Sim | PK |
| `tenant_id` | `tenant_id` | TEXT | Sim | Tenant |
| `alerta_id` | `alerta_id` | UUID | Sim | FK do alerta |
| `nome_arquivo` | `nome_arquivo` | VARCHAR(255) | Sim | Nome do arquivo |
| `tipo_arquivo` | `tipo_arquivo` | VARCHAR(100) | Sim | MIME/extensão |
| `tamanho_bytes` | `tamanho_bytes` | INTEGER | Não | Tamanho |
| `url_arquivo` | `url_arquivo` | TEXT | Sim | URL/localização |
| `descricao` | `descricao` | TEXT | Não | Descrição |
| `created_at` | `created_at` | TIMESTAMP | Não | Criação |
| `uploaded_by` | `uploaded_by` | TEXT | Sim | Usuário que anexou |

---

## 9. `mod_ordem_servico_tipos_servico`

Uso: catálogo de tipos de serviço.

| Coluna banco | Campo lógico/API | Tipo | Obrigatório | Observação |
|---|---|---|---|---|
| `id` | `id` | UUID | Sim | PK |
| `tenant_id` | `tenant_id` | TEXT | Sim | Tenant |
| `nome` | `nome` | VARCHAR(255) | Sim | Nome do tipo |
| `is_default` | `is_default` | BOOLEAN | Não | Tipo padrão |
| `created_at` | `created_at` | TIMESTAMP | Não | Criação |

---

## 10. `mod_ordem_servico_tipos_equipamento`

Uso: catálogo de tipos de equipamento.

| Coluna banco | Campo lógico/API | Tipo | Obrigatório | Observação |
|---|---|---|---|---|
| `id` | `id` | UUID | Sim | PK |
| `tenant_id` | `tenant_id` | TEXT | Sim | Tenant |
| `nome` | `nome` | VARCHAR(255) | Sim | Nome do tipo |
| `created_at` | `created_at` | TIMESTAMP | Não | Criação |

---

## 11. `mod_ordem_servico_configs`

Uso: configurações livres do módulo, guardadas por chave.

| Coluna banco | Campo lógico/API | Tipo | Obrigatório | Observação |
|---|---|---|---|---|
| `id` | `id` | UUID | Sim | PK |
| `tenant_id` | `tenant_id` | TEXT | Sim | Tenant |
| `key` | `config_key` | VARCHAR(255) | Sim | Nome da configuração |
| `value` | `config_value` | TEXT | Não | Valor da configuração; pode ser texto simples ou JSON serializado |
| `created_at` | `created_at` | TIMESTAMP | Não | Criação |
| `updated_at` | `updated_at` | TIMESTAMP | Não | Atualização |

### Chaves já usadas pelo módulo

| `key` | Conteúdo esperado em `value` | Observação |
|---|---|---|
| `ai_integration` | JSON | Configuração da IA: `provider`, `apiKey`, `model`, `temperature`, `maxTokens`, `enabled` |
| `condicoes_execucao` | texto | Condições padrão da OS |
| `whatsapp_message_template` | texto | Template de mensagem WhatsApp |
| `prazo_retirada_dias` | número em texto | Prazo de retirada |
| `conservacao_habilitada` | `true`/`false` | Liga/desliga conservação |
| `valor_conservacao_diario` | decimal em texto | Valor diário de conservação |

### Atenção importante

A chave correta do módulo é:

- `valor_conservacao_diario`

O service do módulo foi ajustado para:

- usar `valor_conservacao_diario` como chave principal
- aceitar `valor_conservacao_diaria` apenas como compatibilidade retroativa

Para migração, use `valor_conservacao_diario` como padrão.

---

## 12. `mod_ordem_servico_templates`

Uso: templates diversos do módulo.

| Coluna banco | Campo lógico/API | Tipo | Obrigatório | Observação |
|---|---|---|---|---|
| `id` | `id` | UUID | Sim | PK |
| `tenant_id` | `tenant_id` | TEXT | Sim | Tenant |
| `name` | `name` | VARCHAR(255) | Sim | Nome do template |
| `content` | `content` | TEXT | Sim | Conteúdo |
| `type` | `type` | VARCHAR(50) | Não | Tipo do template |
| `created_at` | `created_at` | TIMESTAMP | Não | Criação |
| `updated_at` | `updated_at` | TIMESTAMP | Não | Atualização |
| `created_by` | `created_by` | TEXT | Não | Usuário criador |

---

## 13. `mod_ordem_servico_notification_schedules`

Uso: agendamentos de notificações do módulo.

| Coluna banco | Campo lógico/API | Tipo | Obrigatório | Observação |
|---|---|---|---|---|
| `id` | `id` | UUID | Sim | PK |
| `tenant_id` | `tenant_id` | TEXT | Sim | Tenant |
| `title` | `title` | VARCHAR(255) | Sim | Título do agendamento |
| `content` | `content` | TEXT | Não | Conteúdo |
| `audience` | `audience` | VARCHAR(50) | Não | Público alvo |
| `cron_expression` | `cron_expression` | VARCHAR(100) | Sim | Cron do agendamento |
| `enabled` | `enabled` | BOOLEAN | Não | Ativo/inativo |
| `created_at` | `created_at` | TIMESTAMP | Não | Criação |
| `updated_at` | `updated_at` | TIMESTAMP | Não | Atualização |

---

## 14. `mod_ordem_servico_order_notifications`

Uso: notificações agendadas/vinculadas a uma OS.

| Coluna banco | Campo lógico/API | Tipo | Obrigatório | Observação |
|---|---|---|---|---|
| `id` | `id` | UUID | Sim | PK |
| `tenant_id` | `tenant_id` | TEXT | Sim | Tenant |
| `ordem_id` | `ordem_id` | UUID | Sim | FK da OS |
| `type` | `type` | TEXT | Sim | Tipo da notificação |
| `scheduled_for` | `scheduled_for` | TIMESTAMP | Não | Data agendada |
| `status` | `status` | TEXT | Sim | Status da execução |
| `error_message` | `error_message` | TEXT | Não | Erro |
| `metadata` | `metadata` | JSONB | Não | Dados extras |
| `created_at` | `created_at` | TIMESTAMP | Não | Criação |
| `updated_at` | `updated_at` | TIMESTAMP | Não | Atualização |

---

## 15. `mod_ordem_servico_notif_rules`

Uso: regras avançadas de notificação.

| Coluna banco | Campo lógico/API | Tipo | Obrigatório | Observação |
|---|---|---|---|---|
| `id` | `id` | UUID | Sim | PK |
| `tenant_id` | `tenant_id` | TEXT | Sim | Tenant |
| `title` | `title` | TEXT | Sim | Título |
| `description` | `description` | TEXT | Não | Descrição |
| `enabled` | `enabled` | BOOLEAN | Não | Ativo |
| `trigger_type` | `trigger_type` | TEXT | Sim | Tipo de gatilho |
| `trigger_config` | `trigger_config` | JSONB | Sim | Config do gatilho |
| `channel` | `channel` | TEXT | Sim | Canal |
| `recipients` | `recipients` | JSONB | Sim | Destinatários |
| `message_template` | `message_template` | TEXT | Sim | Template da mensagem |
| `max_executions` | `max_executions` | INTEGER | Não | Máximo de execuções |
| `current_executions` | `current_executions` | INTEGER | Não | Execuções atuais |
| `last_execution_at` | `last_execution_at` | TIMESTAMPTZ | Não | Última execução |
| `next_execution_at` | `next_execution_at` | TIMESTAMPTZ | Não | Próxima execução |
| `expires_at` | `expires_at` | TIMESTAMPTZ | Não | Expiração |
| `created_at` | `created_at` | TIMESTAMPTZ | Não | Criação |
| `updated_at` | `updated_at` | TIMESTAMPTZ | Não | Atualização |

---

## 16. `mod_ordem_servico_notif_history`

Uso: histórico de disparo das regras de notificação.

| Coluna banco | Campo lógico/API | Tipo | Obrigatório | Observação |
|---|---|---|---|---|
| `id` | `id` | UUID | Sim | PK |
| `tenant_id` | `tenant_id` | TEXT | Sim | Tenant |
| `rule_id` | `rule_id` | UUID | Sim | FK da regra |
| `ordem_servico_id` | `ordem_servico_id` | UUID | Não | OS relacionada |
| `channel` | `channel` | TEXT | Sim | Canal |
| `recipient` | `recipient` | TEXT | Sim | Destinatário |
| `content` | `content` | TEXT | Sim | Conteúdo enviado |
| `status` | `status` | TEXT | Sim | Status do envio |
| `error_message` | `error_message` | TEXT | Não | Erro |
| `fingerprint` | `fingerprint` | TEXT | Não | Deduplicação/rastreamento |
| `sent_at` | `sent_at` | TIMESTAMPTZ | Não | Momento do envio |

---

## 17. `mod_ordem_servico_notif_states`

Uso: estado atual por regra + OS, para engine de notificações.

| Coluna banco | Campo lógico/API | Tipo | Obrigatório | Observação |
|---|---|---|---|---|
| `tenant_id` | `tenant_id` | TEXT | Sim | Parte da PK composta |
| `rule_id` | `rule_id` | UUID | Sim | Parte da PK composta |
| `ordem_servico_id` | `ordem_servico_id` | UUID | Sim | Parte da PK composta |
| `last_state` | `last_state` | JSONB | Sim | Último estado calculado |
| `last_notified_at` | `last_notified_at` | TIMESTAMPTZ | Não | Última notificação |
| `created_at` | `created_at` | TIMESTAMPTZ | Não | Criação |
| `updated_at` | `updated_at` | TIMESTAMPTZ | Não | Atualização |

---

## 18. `mod_ordem_servico_user_roles`

Uso: papéis de usuário dentro do módulo.

| Coluna banco | Campo lógico/API | Tipo | Obrigatório | Observação |
|---|---|---|---|---|
| `id` | `id` | UUID | Sim | PK |
| `tenant_id` | `tenant_id` | TEXT | Sim | Tenant |
| `user_id` | `user_id` | TEXT | Sim | Usuário do sistema principal |
| `is_technician` | `is_technician` | BOOLEAN | Não | Técnico |
| `is_attendant` | `is_attendant` | BOOLEAN | Não | Atendente |
| `is_admin` | `is_admin` | BOOLEAN | Não | Admin do módulo |
| `created_at` | `created_at` | TIMESTAMP | Não | Criação |
| `updated_at` | `updated_at` | TIMESTAMP | Não | Atualização |

---

## 19. `mod_ordem_servico_user_permissions`

Uso: permissões finas por usuário.

| Coluna banco | Campo lógico/API | Tipo | Obrigatório | Observação |
|---|---|---|---|---|
| `id` | `id` | UUID | Sim | PK |
| `tenant_id` | `tenant_id` | TEXT | Sim | Tenant |
| `user_id` | `user_id` | TEXT | Sim | Usuário |
| `resource` | `resource` | VARCHAR(50) | Sim | Recurso |
| `action` | `action` | VARCHAR(50) | Sim | Ação |
| `allowed` | `allowed` | BOOLEAN | Não | Permitido ou não |
| `created_at` | `created_at` | TIMESTAMP | Não | Criação |
| `updated_at` | `updated_at` | TIMESTAMP | Não | Atualização |
| `created_by` | `created_by` | TEXT | Sim | Quem criou a permissão |

---

## 20. `mod_ordem_servico_profile_permissions`

Uso: permissões por perfil do módulo.

| Coluna banco | Campo lógico/API | Tipo | Obrigatório | Observação |
|---|---|---|---|---|
| `id` | `id` | UUID | Sim | PK |
| `tenant_id` | `tenant_id` | TEXT | Sim | Tenant |
| `permission_id` | `permission_id` | TEXT | Sim | Identificador da permissão |
| `profile` | `profile` | TEXT | Sim | Ex.: `admin`, `technician`, `attendant` |
| `allowed` | `allowed` | BOOLEAN | Não | Permitido ou não |
| `created_at` | `created_at` | TIMESTAMP | Não | Criação |
| `updated_at` | `updated_at` | TIMESTAMP | Não | Atualização |

---

## 21. `mod_ordem_servico_permission_audit`

Uso: auditoria de mudança de permissão.

| Coluna banco | Campo lógico/API | Tipo | Obrigatório | Observação |
|---|---|---|---|---|
| `id` | `id` | UUID | Sim | PK |
| `tenant_id` | `tenant_id` | TEXT | Sim | Tenant |
| `user_id` | `user_id` | TEXT | Sim | Usuário afetado |
| `resource` | `resource` | VARCHAR(50) | Sim | Recurso |
| `action` | `action` | VARCHAR(50) | Sim | Ação |
| `old_value` | `old_value` | BOOLEAN | Não | Valor anterior |
| `new_value` | `new_value` | BOOLEAN | Sim | Valor novo |
| `changed_by` | `changed_by` | TEXT | Sim | Usuário que alterou |
| `changed_at` | `changed_at` | TIMESTAMP | Não | Data da alteração |
| `reason` | `reason` | TEXT | Não | Motivo |

---

## Sugestão Prática para Migração

Se a prioridade é migrar dados operacionais de outro sistema, eu recomendo esta ordem:

1. `mod_ordem_servico_clients`
2. `mod_ordem_servico_products`
3. `mod_ordem_servico_tipos_servico`
4. `mod_ordem_servico_tipos_equipamento`
5. `mod_ordem_servico_ordens`
6. `mod_ordem_servico_historico`
7. `mod_ordem_servico_status_historico`
8. `mod_ordem_servico_pagamentos`
9. `mod_ordem_servico_alertas_abandono`
10. `mod_ordem_servico_anexos_abandono`
11. `mod_ordem_servico_configs`

As tabelas de permissões e notificações podem ser migradas depois, se fizer sentido no projeto.
