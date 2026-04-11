import api from '@/lib/api';
import {
  AvailablePermission,
  PermissionAudit,
  PermissionUpdate,
  UserPermission,
  UserWithPermissions,
} from '../types/permission.types';

type BackendAvailablePermission = {
  resource: string;
  name: string;
  description: string;
  actions: Array<{
    action: string;
    name: string;
    description: string;
  }>;
};

const API_BASE = '/api/ordem_servico/permissions';

export class PermissionService {
  static async getAvailablePermissions(): Promise<AvailablePermission[]> {
    const response = await api.get(`${API_BASE}/available`);
    const rawPermissions: BackendAvailablePermission[] = Array.isArray(response.data) ? response.data : [];

    return rawPermissions.map((permission) => ({
      resource: permission.resource,
      resourceLabel: permission.name,
      actions: (permission.actions || []).map((action) => ({
        action: action.action,
        actionLabel: action.name,
        description: action.description,
      })),
    }));
  }

  static async getUsersWithPermissions(): Promise<UserWithPermissions[]> {
    const response = await api.get(`${API_BASE}/users`);
    return Array.isArray(response.data) ? response.data : [];
  }

  static async getUserPermissions(userId: string): Promise<UserPermission[]> {
    const response = await api.get(`${API_BASE}/users/${userId}`);
    return Array.isArray(response.data) ? response.data : [];
  }

  static async updateUserPermissions(userId: string, permissions: PermissionUpdate[]): Promise<void> {
    await api.put(`${API_BASE}/users/${userId}`, { permissions });
  }

  static async checkPermission(resource: string, action: string): Promise<boolean> {
    try {
      const response = await api.get(`${API_BASE}/check/${resource}/${action}`);
      return Boolean(response.data?.hasPermission);
    } catch {
      return false;
    }
  }

  static async getPermissionAudit(
    userId?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<PermissionAudit[]> {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const queryString = params.toString();
    const response = await api.get(`${API_BASE}/audit${queryString ? `?${queryString}` : ''}`);
    return Array.isArray(response.data) ? response.data : [];
  }
}
