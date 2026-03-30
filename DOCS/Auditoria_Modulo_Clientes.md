## Auditoria do Módulo de Clientes - Relatório Detalhado

**1. Tabelas Relacionadas**

*   **`mod_ordem_servico_clients` (Tabela Principal do Cliente)**
    *   **Finalidade:** Armazena os dados principais dos clientes.
    *   **Colunas:**
        *   `id`: UUID (Identificador único do cliente).
        *   `tenant_id`: String (ID do inquilino, indicando a qual conta/empresa o cliente pertence).
        *   `name`: String (Nome completo ou Razão Social do cliente).
        *   `document`: String (CPF/CNPJ do cliente).
        *   `phone_primary`: String (Telefone principal do cliente).
        *   `phone_secondary`: String (Telefone secundário do cliente, opcional).
        *   `image_url`: String (URL da imagem/foto do cliente, opcional).
        *   `is_active`: Booleano (Status de atividade do cliente, padrão `true`).
        *   `email`: String (Endereço de e-mail do cliente, opcional).
        *   `observations`: String (Observações gerais sobre o cliente, opcional).
        *   `address_street`: String (Logradouro do endereço).
        *   `address_number`: String (Número do endereço).
        *   `address_neighborhood`: String (Bairro do endereço).
        *   `address_city`: String (Cidade do endereço).
        *   `address_state`: String (Estado do endereço).
        *   `address_zip`: String (CEP do endereço).
        *   `address_complement`: String (Complemento do endereço, opcional).
        *   `created_at`: Timestamp (Data e hora de criação do registro).
        *   `updated_at`: Timestamp (Data e hora da última atualização do registro).
        *   `deleted_at`: Timestamp (Para exclusão lógica, indica a data de "exclusão").

*   **`mod_ordem_servico_ordens` (Tabela de Ordens de Serviço)**
    *   **Finalidade:** Contém Ordens de Serviço (OS).
    *   **Relacionamento com Clientes:** Possui uma coluna `cliente_id` (UUID) que referencia o `id` da tabela `mod_ordem_servico_clients`.
    *   **Dependência:** Um cliente não pode ser excluído se houver Ordens de Serviço ativas (`deleted_at IS NULL`) associadas a ele.

**2. Como o Cliente é Criado**

A criação de clientes é realizada através do método `create` no `ClientesService`.

*   **Endpoint API:** `POST /ordem_servico/clientes` (controlado por `ClientesController`).
*   **Dados de Entrada:**
    *   `tenantId`: ID do inquilino (extraído do token de autenticação do usuário).
    *   `data`: Objeto contendo os detalhes do cliente (nome, documento, telefones, endereço, etc.).
    *   `userId`: ID do usuário que está criando o cliente (extraído do token de autenticação).
*   **Validações:**
    *   `name` e `phone_primary` são campos obrigatórios.
    *   `tenantId` deve ser fornecido.
*   **Geração de ID:** Um novo `id` (UUID) é gerado para o cliente usando `randomUUID()` do Node.js `crypto`.
*   **Persistência:** Uma query `INSERT` é executada na tabela `mod_ordem_servico_clients` usando `this.prisma.$queryRawUnsafe`.
    *   Campos opcionais (`document`, `phone_secondary`, `address`, `address_zip`, etc.) são inseridos como `null` se não forem fornecidos.
    *   `is_active` por padrão é `true`.
*   **Auditoria:** Após a criação bem-sucedida, um registro de auditoria (`CREATE_CLIENT`) é criado usando o `AuditService`, incluindo `clientId`, `userId`, `tenantId` e `name` do cliente.
*   **Retorno:** O `id` do cliente recém-criado, junto com os dados fornecidos.
*   **Tratamento de Erros:** Erros de validação (campos obrigatórios) resultam em `BadRequestException`. Erros internos no banco de dados resultam em uma `HttpException` genérica.

**3. Do que o Cliente Depende**

*   **Serviços Essenciais:**
    *   `PrismaService`: Gerencia a conexão e as operações com o banco de dados (PostgreSQL).
    *   `AuditService`: Serviço para registro de logs de auditoria de ações do usuário.
*   **Módulos Core:**
    *   `PrismaModule`: Módulo NestJS que provê o `PrismaService`.
    *   `AuditModule`: Módulo NestJS que provê o `AuditService`.
    *   `SharedModule`: Módulo que contém utilitários e guardas compartilhadas (como `PermissionGuard` e `upload-security.util`).
*   **Node.js Core:**
    *   `crypto.randomUUID()`: Para gerar IDs únicos.
    *   `fs` (File System): Para verificar a existência de arquivos (imagens).
*   **Serviços Externos:**
    *   `ViaCEP API`: Para consulta de informações de endereço a partir de um CEP (`https://viacep.com.br`).
*   **Contexto de Aplicação:**
    *   `tenantId`: Cada operação com cliente é vinculada a um `tenantId`, garantindo o isolamento de dados entre inquilinos.
    *   `userId`: Para rastreamento de quem realizou as ações de CRUD.
*   **Segurança:**
    *   `JwtAuthGuard`: Para autenticação do usuário via JWT.
    *   `PermissionGuard`: Para controle de acesso baseado em permissões, exigindo permissões específicas (`RequireClientsPermission`) para cada operação (e.g., `view`, `create`, `edit`, `delete`, `upload_images`, `view_details`).

**4. O que Mais Depende do Cliente**

*   **Ordens de Serviço (`mod_ordem_servico_ordens`):** A tabela de Ordens de Serviço faz referência ao `id` do cliente. Isso estabelece uma dependência direta, onde um cliente é uma entidade fundamental para a criação de OS.
*   **Controladores (`ClientesController`):** O controlador expõe todas as funcionalidades CRUD e de upload de imagens do cliente via API REST.
*   **Módulo de Permissões/Autorização:** As permissões específicas definidas para o módulo de Clientes (`view`, `create`, `edit`, `delete`, `upload_images`, `view_details`) são integradas ao sistema de permissões global da aplicação.
*   **Sistema de Auditoria:** O `AuditService` depende das ações realizadas no módulo de Clientes para registrar eventos importantes (criação, atualização, exclusão).
*   **Upload de Imagens:** O sistema de upload de arquivos do módulo (`shared/utils/upload-security.util`) é utilizado para gerenciar imagens de perfil de clientes, criando uma estrutura de diretórios baseada em inquilino e módulo.

**5. Diretórios de Salvamento de Dados**

*   **Imagens de Clientes:** As imagens de perfil dos clientes são salvas no sistema de arquivos local.
    *   **Mecanismo:** O `ClientesController` utiliza `FileInterceptor` do NestJS e funções como `persistTenantModuleUpload` (do `../shared/utils/upload-security.util`) para processar e armazenar as imagens.
    *   **Estrutura de Diretórios (Inferida):** `[DIRETORIO_RAIZ_UPLOAD]/[tenantId]/clientes/[fileName]`.
    *   O `[DIRETORIO_RAIZ_UPLOAD]` é configurado via `ORDEM_SERVICO_UPLOAD_OPTIONS` (definido em `shared/utils/upload-security.util`), mas o caminho exato não está explicitamente nos arquivos analisados.

**6. Análise e Sugestões para Completar o Tipo de Cliente**

A estrutura atual do cliente já é bastante abrangente, cobrindo dados pessoais, de contato e de endereço. Para torná-lo ainda mais robusto e completo, sugiro as seguintes adições e considerações:

**Campos Atuais:**
`id`, `tenant_id`, `name`, `document`, `phone_primary`, `phone_secondary`, `image_url`, `is_active`, `email`, `observations`, `address_street`, `address_number`, `address_neighborhood`, `address_city`, `address_state`, `address_zip`, `address_complement`, `created_at`, `updated_at`, `deleted_at`.

**Sugestões de Campos Adicionais:**

*   **`type` (Tipo de Cliente: `INDIVIDUAL` | `COMPANY`)**:
    *   **Justificativa:** Diferencia explicitamente pessoas físicas de jurídicas, permitindo validações e lógicas de negócio específicas (e.g., CPF para INDIVIDUAL, CNPJ para COMPANY).
*   **`date_of_birth` (Data de Nascimento)**:
    *   **Justificativa:** Essencial para clientes individuais, útil para campanhas de marketing, validações de idade, etc.
*   **`gender` (Gênero)**:
    *   **Justificativa:** Para clientes individuais, útil para personalização e análise demográfica.
*   **`social_media_links` (Links de Mídias Sociais)**:
    *   **Justificativa:** Objeto JSON ou campos separados (e.g., `linkedin_url`, `facebook_url`) para links de redes sociais do cliente.
*   **`website_url` (URL do Website)**:
    *   **Justificativa:** Para clientes PJ ou PF que possuem website/portfólio.
*   **Informações de Faturamento/Cobrança (se diferentes do endereço principal):**
    *   `billing_address_street`, `billing_address_number`, `billing_address_zip`, etc.
    *   **Justificativa:** Permite gerenciar endereços de entrega e cobrança separadamente.
*   **`tax_id` (Inscrição Estadual/Municipal ou outros identificadores fiscais)**:
    *   **Justificativa:** Além do documento principal, pode haver outros registros fiscais relevantes.
*   **`contact_person_name`, `contact_person_email`, `contact_person_phone` (Pessoa de Contato)**:
    *   **Justificativa:** Para clientes do tipo `COMPANY`, identificar o principal contato dentro da empresa.
*   **`rating` ou `priority` (Classificação/Prioridade do Cliente)**:
    *   **Justificativa:** Campo numérico (e.g., 1-5 estrelas) ou enum (e.g., `HIGH`, `MEDIUM`, `LOW`) para classificar a importância ou engajamento do cliente.
*   **`tags` (Tags/Categorias do Cliente)**:
    *   **Justificativa:** Array de strings ou tabela `client_tags` (muitos-para-muitos) para categorizar clientes de forma flexível (e.g., "VIP", "Revendedor", "Potencial").
*   **`source` (Origem/Canal de Aquisição)**:
    *   **Justificativa:** Como o cliente foi adquirido (e.g., "Indicação", "Mídia Social", "Pesquisa Google", "Feira").
*   **`external_id` (ID Externo)**:
    *   **Justificativa:** Se o sistema precisar se integrar com outros CRMs ou ERPs, este campo armazenaria o ID do cliente no sistema externo.
*   **`preferred_contact_method` (Método de Contato Preferencial)**:
    *   **Justificativa:** Enum (e.g., `EMAIL`, `PHONE`, `WHATSAPP`) para registrar como o cliente prefere ser contatado.
*   **`consent_marketing` (Consentimento de Marketing)**:
    *   **Justificativa:** Booleano e `consent_marketing_at` (Timestamp) para conformidade com LGPD/GDPR para envio de comunicações de marketing.

A implementação dessas sugestões adicionaria mais profundidade e flexibilidade ao perfil do cliente, tornando-o mais completo para diversas estratégias de negócio e futuras integrações.
