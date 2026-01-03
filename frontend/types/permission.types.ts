export interface UserPermission {
  id: string;
  userId: string;
  tenantId: string;
  resource: string;
  action: string;
  allowed: boolean;
  createdAt: string;
  updatedAt: string;
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

export interface UserWithPermissions {
  id: string;
  name: string;
  email: string;
  permissions: UserPermission[];
  permissionSummary: {
    total: number;
    allowed: number;
    denied: number;
  };
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
  changedAt: string;
  reason?: string;
}