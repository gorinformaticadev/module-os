import api from '@/lib/api';

export const ordem_servicoService = {
    getAll: async (filters?: any) => {
        return api.get('/api/ordem_servico', { params: filters });
    },

    getStats: async () => {
        return api.get('/api/ordem_servico/stats');
    },

    getNotificationConfigs: async () => {
        return api.get('/api/ordem_servico/config/notifications');
    },

    createNotificationConfig: async (data: any) => {
        return api.post('/api/ordem_servico/config/notifications', data);
    }
};
