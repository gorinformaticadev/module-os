export interface UserPermission {
  id: string;
  userId: string;
  tenantId: string;
  resource: string;
  action: string;
  allowed: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface PermissionUpdate {
  resource: string;
  action: string;
  allowed: boolean;
}

export interface AvailablePermission {
  resource: string;
  resourceLabel: string;
  actions: PermissionAction[];
}

export interface PermissionAction {
  action: string;
  actionLabel: string;
  description: string;
}

export interface PermissionAudit {
  id: string;
  tenantId: string;
  userId: string;
  resource: string;
  action: string;
  oldValue: boolean | null;
  newValue: boolean;
  changedBy: string;
  changedAt: Date;
  reason?: string;
}

export interface IPermissionService {
  getUserPermissions(tenantId: string, userId: string): Promise<UserPermission[]>;
  updateUserPermissions(tenantId: string, userId: string, permissions: PermissionUpdate[], changedBy: string): Promise<void>;
  hasPermission(tenantId: string, userId: string, resource: string, action: string): Promise<boolean>;
  getAvailablePermissions(): AvailablePermission[];
  getUsersWithPermissions(tenantId: string): Promise<UserWithPermissions[]>;
}

export interface UserWithPermissions {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: UserPermission[];
  permissionSummary: {
    total: number;
    allowed: number;
    denied: number;
  };
}