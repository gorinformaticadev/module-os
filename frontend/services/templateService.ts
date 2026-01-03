// API client simples
const api = {
  get: async (url: string) => {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return {
      data: await response.json(),
      status: response.status
    };
  },
  
  post: async (url: string, data?: any) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return {
      data: await response.json(),
      status: response.status
    };
  },
  
  put: async (url: string, data: any) => {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return {
      data: await response.json(),
      status: response.status
    };
  },
  
  delete: async (url: string) => {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return {
      data: await response.json(),
      status: response.status
    };
  }
};

const API_BASE = '/api/modules/ordem_servico/templates';

export class TemplateService {
  static async getAllTemplates() {
    try {
      const response = await api.get(API_BASE);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar templates:', error);
      throw error;
    }
  }

  static async getTemplateWithPermissions(templateId: string) {
    try {
      const response = await api.get(`${API_BASE}/${templateId}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar template ${templateId}:`, error);
      throw error;
    }
  }

  static async applyTemplateToUser(templateId: string, userId: string) {
    try {
      const response = await api.post(`${API_BASE}/${templateId}/apply/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao aplicar template ${templateId} ao usuário ${userId}:`, error);
      throw error;
    }
  }

  static async createCustomTemplate(name: string, description: string, permissions: any[]) {
    try {
      const response = await api.post(API_BASE, {
        name,
        description,
        permissions
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao criar template customizado:', error);
      throw error;
    }
  }

  static async updateTemplate(templateId: string, permissions: any[]) {
    try {
      const response = await api.put(`${API_BASE}/${templateId}`, {
        permissions
      });
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar template ${templateId}:`, error);
      throw error;
    }
  }

  static async deleteTemplate(templateId: string) {
    try {
      const response = await api.delete(`${API_BASE}/${templateId}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao excluir template ${templateId}:`, error);
      throw error;
    }
  }
}