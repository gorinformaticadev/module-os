// API client simples
const api = {
  get: async (url: string) => {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Adicionar headers de autenticação conforme necessário
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
  }
};

import { 
  AvailablePermission, 
  UserWithPermissions, 
  UserPermission, 
  PermissionUpdate,
  PermissionAudit 
} from '../types/permission.types';

const API_BASE = '/modules/ordem_servico/permissions';

export class PermissionService {
  static async getAvailablePermissions(): Promise<AvailablePermission[]> {
    try {
      const response = await api.get(`${API_BASE}/available`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar permissões disponíveis:', error);
      throw error;
    }
  }

  static async getUsersWithPermissions(): Promise<UserWithPermissions[]> {
    try {
      console.log('🔍 Carregando usuários com permissões...');
      
      const response = await api.get(`${API_BASE}/users`);
      
      console.log('📡 Status da resposta:', response.status);
      console.log('📦 Dados da resposta:', response.data);
      console.log('📊 Tipo dos dados:', typeof response.data);
      console.log('📋 É array?', Array.isArray(response.data));
      
      // Verificar se a resposta é um array válido
      if (Array.isArray(response.data)) {
        console.log(`✅ ${response.data.length} usuários carregados`);
        return response.data;
      } else {
        console.error('❌ Resposta da API não é um array:', response.data);
        throw new Error('Formato de dados inválido recebido do servidor.');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar usuários com permissões:', error);
      throw error;
    }
  }

  static async getUserPermissions(userId: string): Promise<UserPermission[]> {
    try {
      const response = await api.get(`${API_BASE}/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar permissões do usuário ${userId}:`, error);
      throw error;
    }
  }

  static async updateUserPermissions(userId: string, permissions: PermissionUpdate[]): Promise<void> {
    try {
      await api.put(`${API_BASE}/users/${userId}`, { permissions });
    } catch (error) {
      console.error(`Erro ao atualizar permissões do usuário ${userId}:`, error);
      throw error;
    }
  }

  static async checkPermission(resource: string, action: string): Promise<boolean> {
    try {
      const response = await api.get(`${API_BASE}/check/${resource}/${action}`);
      return response.data.hasPermission;
    } catch (error) {
      console.error(`Erro ao verificar permissão ${resource}:${action}:`, error);
      return false;
    }
  }

  static async getPermissionAudit(
    userId?: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<PermissionAudit[]> {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await api.get(`${API_BASE}/audit?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar auditoria de permissões:', error);
      throw error;
    }
  }
}