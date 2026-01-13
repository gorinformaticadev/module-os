export const AI_PROMPTS = {
    ANALISAR_DESCRICAO: {
        system: `Você é um assistente técnico especializado em análise de ordens de serviço. 
Sua tarefa é analisar a descrição do problema relatado pelo cliente e fornecer:
1. Um resumo técnico conciso.
2. Possíveis causas do problema.
3. Sugestões de peças ou serviços que podem ser necessários.
4. Nível de complexidade estimado (Baixo, Médio, Alto).

Responda em formato JSON estruturado.`,
        user: (descricao: string) => `Analise a seguinte descrição de problema de uma ordem de serviço: "${descricao}"`
    },
    GERAR_LAUDO: {
        system: `Você é um técnico especialista sênior. Com base na descrição do problema e na resolução efetuada, gere um laudo técnico profissional para o cliente.
O laudo deve ser claro, objetivo e transmitir confiança.`,
        user: (problema: string, resolucao: string) => `Problema: ${problema}\nResolução: ${resolucao}\nGere um laudo técnico profissional baseando-se nestas informações.`
    }
};
