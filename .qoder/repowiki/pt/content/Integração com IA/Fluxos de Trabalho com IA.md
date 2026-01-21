# Fluxos de Trabalho com IA

<cite>
**Arquivos referenciados neste documento**
- [ai.controller.ts](file://backend/shared/controllers/ai.controller.ts)
- [ai.service.ts](file://backend/shared/services/ai.service.ts)
- [prompts.ts](file://backend/shared/services/prompts.ts)
- [useAI.ts](file://frontend/hooks/useAI.ts)
- [page.tsx (edição de OS)](file://frontend/pages/ordens/edit/page.tsx)
- [ordens.controller.ts](file://backend/ordens/ordens.controller.ts)
- [ordens.service.ts](file://backend/ordens/ordens.service.ts)
- [pdf-template.util.ts](file://backend/ordens/pdf-template.util.ts)
- [configuracoes.controller.ts](file://backend/configuracoes/configuracoes.controller.ts)
- [configuracoes.service.ts](file://backend/configuracoes/configuracoes.service.ts)
- [page.tsx (configurações)](file://frontend/pages/configuracoes/page.tsx)
- [ordem-servico.types.ts](file://frontend/types/ordem-servico.types.ts)
</cite>

## Sumário
1. [Introdução](#introdução)
2. [Estrutura do Projeto](#estrutura-do-projeto)
3. [Componentes-Chave da IA](#componentes-chave-da-ia)
4. [Arquitetura Geral](#arquitetura-geral)
5. [Fluxos de Trabalho Detalhados](#fluxos-de-trabalho-detalhados)
6. [Integração com Ordens de Serviço](#integração-com-ordens-de-serviço)
7. [Armazenamento e Uso dos Resultados](#armazenamento-e-uso-dos-resultados)
8. [Análise de Dependências](#análise-de-dependências)
9. [Considerações de Desempenho](#considerações-de-desempenho)
10. [Guia de Solução de Problemas](#guia-de-solução-de-problemas)
11. [Conclusão](#conclusão)

## Introdução
Este documento descreve como a Inteligência Artificial (IA) está integrada nos fluxos de trabalho do módulo de Ordens de Serviço. Ele explica como a IA auxilia na análise de problemas, geração de laudos e criação de relatórios técnicos, quais componentes são afetados, como os resultados são apresentados e armazenados, e como esses resultados são utilizados nas ordens de serviço.

## Estrutura do Projeto
O projeto segue uma arquitetura modular com backend (NestJS) e frontend (Next.js). A integração com IA ocorre através de um controller dedicado no backend, um serviço de IA que consulta APIs externas (OpenAI/OpenRouter), e hooks no frontend que encapsulam chamadas à API.

```mermaid
graph TB
subgraph "Frontend"
FE_Hook["useAI.ts<br/>Hooks React"]
FE_OS_Edit["page.tsx (edição)<br/>Interface OS"]
FE_Config["page.tsx (configurações)<br/>Configurações de IA"]
end
subgraph "Backend"
BE_AI_Controller["ai.controller.ts<br/>Rotas de IA"]
BE_AI_Service["ai.service.ts<br/>Serviço de IA"]
BE_AI_Prompts["prompts.ts<br/>Templates de prompts"]
BE_Ordens_Controller["ordens.controller.ts<br/>CRUD de OS"]
BE_Ordens_Service["ordens.service.ts<br/>Lógica de negócio"]
BE_PDF["pdf-template.util.ts<br/>Geração de PDF"]
BE_Config_Controller["configuracoes.controller.ts<br/>Configurações"]
BE_Config_Service["configuracoes.service.ts<br/>Persistência de config"]
end
FE_Hook --> |"Chama API"| BE_AI_Controller
FE_OS_Edit --> |"Exibe resultados"| FE_Hook
FE_Config --> |"Persiste configurações"| BE_Config_Controller
BE_AI_Controller --> BE_AI_Service
BE_AI_Service --> BE_AI_Prompts
BE_Ordens_Controller --> BE_Ordens_Service
BE_Ordens_Service --> BE_PDF
BE_Config_Controller --> BE_Config_Service
```

**Diagrama fonte**
- [ai.controller.ts](file://backend/shared/controllers/ai.controller.ts#L1-L53)
- [ai.service.ts](file://backend/shared/services/ai.service.ts#L1-L91)
- [prompts.ts](file://backend/shared/services/prompts.ts#L1-L27)
- [useAI.ts](file://frontend/hooks/useAI.ts#L1-L41)
- [page.tsx (edição de OS)](file://frontend/pages/ordens/edit/page.tsx#L153-L184)
- [page.tsx (configurações)](file://frontend/pages/configuracoes/page.tsx#L474-L541)
- [ordens.controller.ts](file://backend/ordens/ordens.controller.ts#L1-L377)
- [ordens.service.ts](file://backend/ordens/ordens.service.ts#L1-L800)
- [pdf-template.util.ts](file://backend/ordens/pdf-template.util.ts#L1-L462)
- [configuracoes.controller.ts](file://backend/configuracoes/configuracoes.controller.ts#L1-L136)
- [configuracoes.service.ts](file://backend/configuracoes/configuracoes.service.ts#L1-L331)

**Seção fonte**
- [ai.controller.ts](file://backend/shared/controllers/ai.controller.ts#L1-L53)
- [ai.service.ts](file://backend/shared/services/ai.service.ts#L1-L91)
- [prompts.ts](file://backend/shared/services/prompts.ts#L1-L27)
- [useAI.ts](file://frontend/hooks/useAI.ts#L1-L41)
- [page.tsx (edição de OS)](file://frontend/pages/ordens/edit/page.tsx#L153-L184)
- [page.tsx (configurações)](file://frontend/pages/configuracoes/page.tsx#L474-L541)
- [ordens.controller.ts](file://backend/ordens/ordens.controller.ts#L1-L377)
- [ordens.service.ts](file://backend/ordens/ordens.service.ts#L1-L800)
- [pdf-template.util.ts](file://backend/ordens/pdf-template.util.ts#L1-L462)
- [configuracoes.controller.ts](file://backend/configuracoes/configuracoes.controller.ts#L1-L136)
- [configuracoes.service.ts](file://backend/configuracoes/configuracoes.service.ts#L1-L331)

## Componentes-Chave da IA
- Controller de IA: expõe endpoints para análise de descrição e geração de laudo técnico.
- Serviço de IA: consulta a API externa (OpenAI/OpenRouter) com base em configurações do tenant.
- Prompts: templates de instruções e dados de entrada para a IA.
- Hook useAI: encapsula chamadas à API de IA no frontend.
- Interface de edição de OS: permite acionar a IA e exibir resultados.
- Interface de configurações: permite ativar e testar a IA.

**Seção fonte**
- [ai.controller.ts](file://backend/shared/controllers/ai.controller.ts#L14-L51)
- [ai.service.ts](file://backend/shared/services/ai.service.ts#L33-L89)
- [prompts.ts](file://backend/shared/services/prompts.ts#L1-L27)
- [useAI.ts](file://frontend/hooks/useAI.ts#L4-L39)
- [page.tsx (edição de OS)](file://frontend/pages/ordens/edit/page.tsx#L153-L184)
- [page.tsx (configurações)](file://frontend/pages/configuracoes/page.tsx#L474-L541)

## Arquitetura Geral
A IA é acionada via endpoints protegidos por autenticação JWT. O serviço de IA recupera as configurações do tenant, monta a requisição para a API externa e retorna o conteúdo processado. No frontend, o hook useAI encapsula as chamadas e fornece funções para análise e geração de laudo.

```mermaid
sequenceDiagram
participant Front as "Frontend (useAI)"
participant Ctrl as "AI Controller"
participant Svc as "AI Service"
participant Ext as "API Externa (OpenAI/OpenRouter)"
participant DB as "Prisma"
Front->>Ctrl : POST /api/ordem_servico/ai/analisar-descricao
Ctrl->>Svc : callAI(tenantId, {prompt, system})
Svc->>DB : SELECT mod_ordem_servico_configs
DB-->>Svc : Configurações do tenant
Svc->>Ext : POST /chat/completions
Ext-->>Svc : Resposta da IA
Svc-->>Ctrl : Texto processado
Ctrl-->>Front : JSON parseado ou {text : result}
```

**Diagrama fonte**
- [ai.controller.ts](file://backend/shared/controllers/ai.controller.ts#L14-L34)
- [ai.service.ts](file://backend/shared/services/ai.service.ts#L33-L89)
- [prompts.ts](file://backend/shared/services/prompts.ts#L1-L27)

**Seção fonte**
- [ai.controller.ts](file://backend/shared/controllers/ai.controller.ts#L14-L34)
- [ai.service.ts](file://backend/shared/services/ai.service.ts#L33-L89)

## Fluxos de Trabalho Detalhados

### Fluxo 1: Análise de Descrição do Problema
Este fluxo ajuda a identificar diagnóstico inicial, possíveis causas, sugestões e complexidade com base na descrição fornecida.

```mermaid
sequenceDiagram
participant User as "Usuário"
participant FE as "Frontend (useAI.analisarDescricao)"
participant API as "AI Controller"
participant SVC as "AI Service"
participant PROMPT as "Prompt ANÁLISE"
participant EXT as "API Externa"
User->>FE : Clica em "Analisar com IA"
FE->>API : POST /api/ordem_servico/ai/analisar-descricao
API->>PROMPT : Monta prompt de análise
API->>SVC : callAI(tenantId, {prompt, system})
SVC->>EXT : Requisição com modelo e parâmetros
EXT-->>SVC : Resposta da IA
SVC-->>API : Texto processado
API-->>FE : {resumo, causas, sugestoes, complexidade}
FE-->>User : Exibe sugestões de análise
```

**Diagrama fonte**
- [useAI.ts](file://frontend/hooks/useAI.ts#L7-L20)
- [ai.controller.ts](file://backend/shared/controllers/ai.controller.ts#L14-L34)
- [ai.service.ts](file://backend/shared/services/ai.service.ts#L33-L89)
- [prompts.ts](file://backend/shared/services/prompts.ts#L2-L12)

**Seção fonte**
- [useAI.ts](file://frontend/hooks/useAI.ts#L7-L20)
- [ai.controller.ts](file://backend/shared/controllers/ai.controller.ts#L14-L34)
- [ai.service.ts](file://backend/shared/services/ai.service.ts#L33-L89)
- [prompts.ts](file://backend/shared/services/prompts.ts#L2-L12)

### Fluxo 2: Geração de Laudo Técnico
Este fluxo transforma informações iniciais e anotações técnicas em um laudo profissional formatado em HTML.

```mermaid
sequenceDiagram
participant User as "Usuário"
participant FE as "Frontend (useAI.gerarLaudo)"
participant API as "AI Controller"
participant SVC as "AI Service"
participant PROMPT as "Prompt LAUDO"
participant EXT as "API Externa"
User->>FE : Preenche problema e notas
User->>FE : Clica em "Gerar com IA"
FE->>API : POST /api/ordem_servico/ai/gerar-laudo
API->>PROMPT : Monta prompt de laudo
API->>SVC : callAI(tenantId, {prompt, system})
SVC->>EXT : Requisição com modelo e parâmetros
EXT-->>SVC : Resposta da IA
SVC-->>API : Texto HTML formatado
API-->>FE : {laudo : HTML}
FE-->>User : Insere HTML no editor de laudo
```

**Diagrama fonte**
- [useAI.ts](file://frontend/hooks/useAI.ts#L22-L33)
- [ai.controller.ts](file://backend/shared/controllers/ai.controller.ts#L36-L51)
- [ai.service.ts](file://backend/shared/services/ai.service.ts#L33-L89)
- [prompts.ts](file://backend/shared/services/prompts.ts#L13-L26)

**Seção fonte**
- [useAI.ts](file://frontend/hooks/useAI.ts#L22-L33)
- [ai.controller.ts](file://backend/shared/controllers/ai.controller.ts#L36-L51)
- [ai.service.ts](file://backend/shared/services/ai.service.ts#L33-L89)
- [prompts.ts](file://backend/shared/services/prompts.ts#L13-L26)

### Fluxo 3: Configuração e Teste da IA
Os administradores podem ativar e testar a integração de IA por tenant.

```mermaid
sequenceDiagram
participant Admin as "Administrador"
participant FE as "Frontend (Configurações)"
participant CTRL as "Config Controller"
participant SVC as "Config Service"
participant DB as "Prisma"
Admin->>FE : Acessa aba "Inteligência Artificial"
FE->>CTRL : GET /api/ordem_servico/config/ai
CTRL->>SVC : getAiConfig(tenantId)
SVC->>DB : SELECT mod_ordem_servico_configs
DB-->>SVC : Configurações
SVC-->>CTRL : Configurações (com máscara)
CTRL-->>FE : Configurações
Admin->>FE : Preenche provider, API Key, modelo
Admin->>FE : Clica em "Salvar"
FE->>CTRL : POST /api/ordem_servico/config/ai
CTRL->>SVC : updateAiConfig(tenantId, config)
SVC->>DB : UPDATE/INSERT configs
DB-->>SVC : Confirmação
SVC-->>CTRL : Sucesso
CTRL-->>FE : Confirmação
Admin->>FE : Clica em "Testar"
FE->>CTRL : POST /api/ordem_servico/config/ai/test
CTRL->>SVC : testAiConfig(tenantId, testConfig)
SVC->>SVC : callAI com teste
SVC-->>CTRL : Resposta da IA
CTRL-->>FE : Resultado do teste
```

**Diagrama fonte**
- [page.tsx (configurações)](file://frontend/pages/configuracoes/page.tsx#L474-L541)
- [configuracoes.controller.ts](file://backend/configuracoes/configuracoes.controller.ts#L80-L111)
- [configuracoes.service.ts](file://backend/configuracoes/configuracoes.service.ts#L179-L281)

**Seção fonte**
- [page.tsx (configurações)](file://frontend/pages/configuracoes/page.tsx#L474-L541)
- [configuracoes.controller.ts](file://backend/configuracoes/configuracoes.controller.ts#L80-L111)
- [configuracoes.service.ts](file://backend/configuracoes/configuracoes.service.ts#L179-L281)

## Integração com Ordens de Serviço
A IA é utilizada diretamente dentro da tela de edição de ordens de serviço. O usuário pode:
- Acionar a análise de descrição para sugerir diagnóstico, causas e sugestões.
- Gerar um laudo técnico formatado em HTML com base no problema e notas técnicas.
- Salvar os resultados diretamente no campo de laudo técnico da OS.

```mermaid
flowchart TD
Start(["Início - Edição de OS"]) --> CheckDesc["Verifica se há descrição"]
CheckDesc --> |Sim| CallAnalyze["Chama useAI.analisarDescricao()"]
CheckDesc --> |Não| WarnDesc["Exibe aviso para informar descrição"]
CallAnalyze --> ReceiveAnalysis["Recebe análise da IA"]
ReceiveAnalysis --> ShowSuggestions["Exibe sugestões no frontend"]
ShowSuggestions --> ReadyToGenerate["Pronto para gerar laudo"]
ReadyToGenerate --> CallLaudo["Chama useAI.gerarLaudo()"]
CallLaudo --> InsertHTML["Insere HTML no editor de laudo"]
InsertHTML --> SaveOS["Salva OS com laudo técnico"]
WarnDesc --> End(["Fim"])
SaveOS --> End
```

**Diagrama fonte**
- [page.tsx (edição de OS)](file://frontend/pages/ordens/edit/page.tsx#L153-L184)
- [useAI.ts](file://frontend/hooks/useAI.ts#L7-L33)

**Seção fonte**
- [page.tsx (edição de OS)](file://frontend/pages/ordens/edit/page.tsx#L153-L184)
- [useAI.ts](file://frontend/hooks/useAI.ts#L7-L33)

## Armazenamento e Uso dos Resultados
- Os resultados da IA são armazenados no campo específico da ordem de serviço:
  - Laudo técnico: campo `laudo_tecnico` no DTO de atualização.
- A geração de PDF utiliza o conteúdo do laudo técnico para incluir o conteúdo formatado em HTML no documento final.
- As configurações da IA (provider, API Key, modelo, temperatura, tokens máximos) são persistidas por tenant.

```mermaid
erDiagram
MOD_ORDEM_SERVICO_CONFIGS {
string tenant_id
string key
jsonb value
}
MOD_ORDEM_SERVICO_ORDENS {
uuid id
string laudo_tecnico
jsonb itens
jsonb equipamento_fotos
}
MOD_ORDEM_SERVICO_CONFIGS ||--o{ MOD_ORDEM_SERVICO_ORDENS : "relacionado por tenant_id"
```

**Diagrama fonte**
- [ordens.service.ts](file://backend/ordens/ordens.service.ts#L656-L770)
- [pdf-template.util.ts](file://backend/ordens/pdf-template.util.ts#L167-L171)
- [configuracoes.service.ts](file://backend/configuracoes/configuracoes.service.ts#L205-L241)

**Seção fonte**
- [ordens.service.ts](file://backend/ordens/ordens.service.ts#L656-L770)
- [pdf-template.util.ts](file://backend/ordens/pdf-template.util.ts#L167-L171)
- [configuracoes.service.ts](file://backend/configuracoes/configuracoes.service.ts#L205-L241)

## Análise de Dependências
- O serviço de IA depende de:
  - Prisma para ler as configurações do tenant.
  - Fetch para chamar a API externa.
  - Prompt templates para montar as mensagens.
- O frontend depende do hook useAI para comunicação com os endpoints.
- A geração de PDF depende do conteúdo do laudo técnico armazenado.

```mermaid
graph LR
FE["useAI.ts"] --> CTRL["ai.controller.ts"]
CTRL --> SVC["ai.service.ts"]
SVC --> PRISMA["PrismaService"]
SVC --> PROMPTS["prompts.ts"]
CTRL --> ORDENS["ordens.controller.ts"]
ORDENS --> SERVICE["ordens.service.ts"]
SERVICE --> PDF["pdf-template.util.ts"]
```

**Diagrama fonte**
- [useAI.ts](file://frontend/hooks/useAI.ts#L1-L41)
- [ai.controller.ts](file://backend/shared/controllers/ai.controller.ts#L1-L53)
- [ai.service.ts](file://backend/shared/services/ai.service.ts#L1-L91)
- [prompts.ts](file://backend/shared/services/prompts.ts#L1-L27)
- [ordens.controller.ts](file://backend/ordens/ordens.controller.ts#L1-L377)
- [ordens.service.ts](file://backend/ordens/ordens.service.ts#L1-L800)
- [pdf-template.util.ts](file://backend/ordens/pdf-template.util.ts#L1-L462)

**Seção fonte**
- [useAI.ts](file://frontend/hooks/useAI.ts#L1-L41)
- [ai.controller.ts](file://backend/shared/controllers/ai.controller.ts#L1-L53)
- [ai.service.ts](file://backend/shared/services/ai.service.ts#L1-L91)
- [prompts.ts](file://backend/shared/services/prompts.ts#L1-L27)
- [ordens.controller.ts](file://backend/ordens/ordens.controller.ts#L1-L377)
- [ordens.service.ts](file://backend/ordens/ordens.service.ts#L1-L800)
- [pdf-template.util.ts](file://backend/ordens/pdf-template.util.ts#L1-L462)

## Considerações de Desempenho
- A IA é acionada via requisições assíncronas e pode impactar o tempo de resposta da interface. Recomenda-se:
  - Mostrar estados de carregamento durante as chamadas.
  - Limitar o tamanho do prompt e tokens máximos conforme configuração.
  - Armazenar respostas em cache temporário quando a mesma análise for solicitada novamente.

## Guia de Solução de Problemas
- Erros de configuração:
  - Verifique se a IA está habilitada e se a API Key está configurada para o tenant.
  - Utilize o endpoint de teste para validar a conexão.
- Erros de autenticação:
  - Certifique-se de que o usuário está logado e possui token válido.
- Erros de rede:
  - Verifique conectividade com a API externa e timeouts.
- Validação de dados:
  - Garanta que campos obrigatórios (descrição, problema, notas) estejam preenchidos antes de chamar a IA.

**Seção fonte**
- [configuracoes.controller.ts](file://backend/configuracoes/configuracoes.controller.ts#L80-L111)
- [configuracoes.service.ts](file://backend/configuracoes/configuracoes.service.ts#L254-L281)
- [ai.service.ts](file://backend/shared/services/ai.service.ts#L40-L46)

## Conclusão
A integração da IA no módulo de Ordens de Serviço proporciona uma assistência significativa na análise de problemas e geração de laudos técnicos. Com prompts estruturados, configurações por tenant e persistência de resultados, a IA se torna uma ferramenta eficaz para agilizar processos operacionais e melhorar a qualidade técnica dos documentos gerados. A arquitetura modular facilita manutenção e expansão futura.