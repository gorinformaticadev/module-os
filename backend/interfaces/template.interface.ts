export interface ProfileTemplate {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplatePermission {
  id: string;
  templateId: string;
  resource: string;
  action: string;
  allowed: boolean;
  createdAt: Date;
}

export interface TemplateWithPermissions {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: TemplatePermission[];
  permissionCount: {
    total: number;
    allowed: number;
  };
}

export interface ITemplateService {
  getAllTemplates(): Promise<ProfileTemplate[]>;
  getTemplateWithPermissions(templateId: string): Promise<TemplateWithPermissions>;
  applyTemplateToUser(tenantId: string, userId: string, templateId: string, appliedBy: string): Promise<void>;
  createCustomTemplate(name: string, description: string, permissions: TemplatePermission[]): Promise<ProfileTemplate>;
  updateTemplate(templateId: string, permissions: TemplatePermission[]): Promise<void>;
  deleteTemplate(templateId: string): Promise<void>;
}