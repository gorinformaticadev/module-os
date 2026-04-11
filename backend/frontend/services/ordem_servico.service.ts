import api from '@/lib/api';

export const ordem_servicoService = {
    getAll: async (filters?: any) => {
        return api.get('/api/ordem_servico', { params: filters });
    },

    getStats: async () => {
        return api.get('/api/ordem_servico/stats');
    },

    listOrdens: async (filters?: any) => {
        return api.get('/api/ordem_servico/ordens', { params: filters });
    },

    getDashboardData: async () => {
        return api.get('/api/ordem_servico/ordens/dashboard');
    },

    getAlertasRetirada: async () => {
        return api.get('/api/ordem_servico/ordens/alertas-retirada');
    },

    getNotificationConfigs: async () => {
        return api.get('/api/ordem_servico/config/notifications');
    },

    createNotificationConfig: async (data: any) => {
        return api.post('/api/ordem_servico/config/notifications', data);
    }
};
