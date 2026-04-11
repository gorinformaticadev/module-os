import { useState } from 'react';
import api from '@/lib/api';

export const useAI = () => {
    const [analyzing, setAnalyzing] = useState(false);

    const analisarDescricao = async (descricao: string) => {
        if (!descricao) return null;

        try {
            setAnalyzing(true);
            const response = await api.post('/api/ordem_servico/ai/analisar-descricao', { descricao });
            return response.data;
        } catch (error) {
            console.error('Erro ao analisar descrição com IA:', error);
            throw error;
        } finally {
            setAnalyzing(false);
        }
    };

    const gerarLaudo = async (problema: string, notas: string) => {
        try {
            setAnalyzing(true);
            const response = await api.post('/api/ordem_servico/ai/gerar-laudo', { problema, notas });
            return response.data.laudo;
        } catch (error) {
            console.error('Erro ao gerar laudo técnico com IA:', error);
            throw error;
        } finally {
            setAnalyzing(false);
        }
    };

    return {
        analisarDescricao,
        gerarLaudo,
        analyzing
    };
};
