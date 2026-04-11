import api from '@/lib/api';
import type { PermissionUpdate } from '../types/permission.types';
import { PermissionService } from './permissionService';

type BackendTemplate = {
  id: string;
  name: string;
  content: string;
  type?: string | null;
};

export interface PermissionTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  permissions: PermissionUpdate[];
  rawContent: string;
}

const API_BASE = '/api/ordem_servico/templates';

const parsePermissionId = (permissionId: string): PermissionUpdate | null => {
  const normalized = permissionId.trim();
  if (!normalized.includes('_')) {
    return null;
  }

  const [resource, ...actionParts] = normalized.split('_');
  if (!resource || actionParts.length === 0) {
    return null;
  }

  return {
    resource,
    action: actionParts.join('_'),
    allowed: true,
  };
};

const normalizePermissions = (value: unknown): PermissionUpdate[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry): PermissionUpdate | null => {
      if (typeof entry === 'string') {
        return parsePermissionId(entry);
      }

      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const record = entry as Record<string, unknown>;
      if (typeof record.resource === 'string' && typeof record.action === 'string') {
        return {
          resource: record.resource,
          action: record.action,
          allowed: record.allowed !== false,
        };
      }

      if (typeof record.permissionId === 'string') {
        return parsePermissionId(record.permissionId);
      }

      if (typeof record.id === 'string') {
        return parsePermissionId(record.id);
      }

      return null;
    })
    .filter((permission): permission is PermissionUpdate => Boolean(permission));
};

const parseTemplatePermissions = (content: string): PermissionUpdate[] => {
  if (!content) {
    return [];
  }

  try {
    const parsed = JSON.parse(content) as unknown;

    if (Array.isArray(parsed)) {
      return normalizePermissions(parsed);
    }

    if (parsed && typeof parsed === 'object') {
      const record = parsed as Record<string, unknown>;
      return normalizePermissions(record.permissions);
    }
  } catch (error) {
    console.warn('Não foi possível interpretar o conteúdo do template:', error);
  }

  return [];
};

const mapTemplate = (template: BackendTemplate): PermissionTemplate => ({
  id: template.id,
  name: template.name,
  description: template.type || 'Template geral',
  type: template.type || 'GENERAL',
  permissions: parseTemplatePermissions(template.content),
  rawContent: template.content,
});

export class TemplateService {
  static async getAllTemplates(): Promise<PermissionTemplate[]> {
    const response = await api.get(API_BASE);
    const templates: BackendTemplate[] = Array.isArray(response.data) ? response.data : [];
    return templates.map(mapTemplate);
  }

  static async getTemplateWithPermissions(templateId: string): Promise<PermissionTemplate | null> {
    const response = await api.get(`${API_BASE}/${templateId}`);
    if (!response.data) {
      return null;
    }

    return mapTemplate(response.data as BackendTemplate);
  }

  static async applyTemplateToUser(templateId: string, userId: string) {
    const template = await this.getTemplateWithPermissions(templateId);

    if (!template) {
      throw new Error('Template não encontrado.');
    }

    if (template.permissions.length === 0) {
      throw new Error('Template sem permissões válidas para aplicação.');
    }

    await PermissionService.updateUserPermissions(userId, template.permissions);

    return {
      success: true,
      template,
    };
  }

  static async createCustomTemplate(name: string, description: string, permissions: any[]) {
    const response = await api.post(API_BASE, {
      name,
      type: description || 'GENERAL',
      content: JSON.stringify(permissions),
    });
    return response.data;
  }

  static async updateTemplate(templateId: string, permissions: any[]) {
    const currentTemplate = await this.getTemplateWithPermissions(templateId);
    const response = await api.put(`${API_BASE}/${templateId}`, {
      name: currentTemplate?.name || 'Template',
      type: currentTemplate?.type || 'GENERAL',
      content: JSON.stringify(permissions),
    });
    return response.data;
  }

  static async deleteTemplate(templateId: string) {
    const response = await api.delete(`${API_BASE}/${templateId}`);
    return response.data;
  }
}
