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

    return {
        analisarDescricao,
        analyzing
    };
};
