# Documentação de Configuração de Notificações - Módulo Ordem de Serviço

Este documento descreve como configurar e utilizar o sistema de notificações do módulo de Ordem de Serviço.

## Visão Geral

O sistema de notificações permite criar regras automatizadas para enviar alertas via Sistema (In-App), E-mail ou WhatsApp com base em eventos da Ordem de Serviço (Criação, Mudança de Status, etc.) ou condições temporais (Vencimento).

## Tipos de Notificação

1.  **Eventos (Imediato):** Disparado instantaneamente quando uma ação ocorre.
    *   Exemplo: "Nova OS Criada", "Status mudou para Concluído".
2.  **OFFSET (Tempo Relativo):** Disparado X tempo antes ou depois de uma data de referência.
    *   Exemplo: "Avisar 24h antes do Vencimento".
3.  **Condição (Estado):** Verifica periodicamente se uma OS atende a uma condição.
    *   Exemplo: "OS atrasada há mais de 2 dias".
4.  **Agendamento Fixo (Cron):** Executa em horário específico (menos comum para notificações transacionais).

## Como Criar uma Nova Regra

1.  Acesse o módulo **Ordem de Serviço**.
2.  Vá para o menu **Configurações** -> Aba **Agendamento**.
3.  Clique em **"Nova Regra"**.

### Passo a Passo da Configuração

#### 1. Informações Básicas
*   **Título da Regra:** Nome interno para identificar a regra (ex: "Alerta de Conclusão").
*   **Ativa:** Se a regra está funcionando ou pausada.

#### 2. Gatilho (Quando disparar?)
Selecione o **Tipo de Gatilho**:

*   **⚡ Evento (Imediato):**
    *   Selecione os eventos desejados:
        *   `CREATED`: Ao abrir uma nova OS.
        *   `STATUS_CHANGED`: Sempre que o status mudar (ex: de Aberto para Em Andamento).
        *   `FINISHED`: Atalho para quando o status final for atingido (cancelado ou concluído).

*   **🕒 Tempo Relativo (Offset):**
    *   Defina o tempo (ex: 1 Dia, 0 Horas).
    *   Escolha a referência:
        *   `BEFORE_DEADLINE`: Antes da data de previsão de entrega.
        *   `AFTER_CREATED`: Após a data de abertura.

*   **🔍 Condição (Estado):**
    *   Escolha a condição:
        *   `OVERDUE`: Quando a data atual passar da previsão de entrega.
        *   `NO_TECHNICIAN`: Quando a OS ficar sem técnico responsável por muito tempo.

#### 3. Canal de Envio (Por onde enviar?)
*   **🔔 Sistema (Notificação Interna):** Aparece no "sininho" do painel web.
    *   **Fallback Inteligente:** Se o destinatário for apenas "Cliente" e o canal for Sistema, o sistema enviará automaticamente também para o **Técnico Responsável/Admin**, garantindo que a equipe interna veja o alerta.
*   **📧 E-mail:** Envia um e-mail formatado.
*   **📱 WhatsApp:** Envia mensagem via integração de WhatsApp (requer módulo de integração ativo).

#### 4. Destinatários (Quem recebe?)
Selecione quem deve receber a notificação:
*   **Cliente:** Envia para o email/whatsapp do cadastro do cliente da OS.
*   **Técnico Responsável:** Envia para o usuário atribuído à OS.
*   **Administradores:** Envia para todos os usuários com perfil ADMIN no sistema.
*   **Super Admins (Global):** (Visível apenas para Super Admins) Envia para os gestores globais da plataforma.

#### 5. Configurações Avançadas (Opcional)
*   **Limite de Execuções:** Quantas vezes essa regra pode disparar para a mesma OS (ex: 1 vez). Deixe em branco para ilimitado (útil para alertas recorrentes).
*   **Janela de Silêncio:** Horário em que notificações NÃO devem ser enviadas (ex: 22:00 às 08:00).
*   **Frequência de Repetição:** Se a condição persistir, a cada quanto tempo reenviar o alerta.

#### 6. Template da Mensagem
Escreva a mensagem que será enviada. Use as variáveis disponíveis:
*   `{{cliente}}`: Nome do cliente.
*   `{{numero}}`: Número da OS.
*   `{{status}}`: Status atual da OS (ex: "Aberto", "Concluído").
*   `{{data_previsao}}`: Data prevista de entrega.
*   `{{valor}}`: Valor total do serviço.

**Exemplo:**
> "Olá {{cliente}}, sua Ordem de Serviço #{{numero}} foi atualizada para o status: {{status}}. Previsão de entrega: {{data_previsao}}."

### Exemplos de Regras Comuns

1.  **Notificar Técnico de Nova OS:**
    *   Gatilho: `EVENT` -> `CREATED`
    *   Canal: `SYSTEM`
    *   Destinatário: `TECHNICIAN`
    *   Mensagem: "Nova OS #{{numero}} atribuída a você ou aguardando técnico."

2.  **Avisar Cliente sobre Conclusão:**
    *   Gatilho: `EVENT` -> `STATUS_CHANGED` (ou lógica específica de status)
    *   Canal: `WHATSAPP`
    *   Destinatário: `CLIENT`
    *   Mensagem: "Olá {{cliente}}, sua OS #{{numero}} está pronta! Venha retirar."

3.  **Alerta de Atraso para Gestores:**
    *   Gatilho: `CONDITION` -> `OVERDUE`
    *   Canal: `EMAIL`
    *   Destinatário: `ADMIN`
    *   Mensagem: "ATENÇÃO: A OS #{{numero}} do cliente {{cliente}} está atrasada!"
