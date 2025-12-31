import api from '@/lib/api';

export const moduloOsService = {
    getAll: async (filters?: any) => {
        return api.get('/api/moduloOs', { params: filters });
    },

    getStats: async () => {
        return api.get('/api/moduloOs/stats');
    },

    getNotificationConfigs: async () => {
        return api.get('/modules/moduloOs/config/notifications');
    },

    createNotificationConfig: async (data: any) => {
        return api.post('/modules/moduloOs/config/notifications', data);
    }
};
