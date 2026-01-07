import { SetMetadata } from '@nestjs/common';

export interface RequiredPermission {
  resource: string;
  action: string;
}

export const RequirePermission = (resource: string, action: string) => 
  SetMetadata('permission', { resource, action });

// Decorators específicos para facilitar o uso
export const RequireDashboardPermission = (action: string) => 
  RequirePermission('dashboard', action);

export const RequireOrdersPermission = (action: string) => 
  RequirePermission('orders', action);

export const RequireClientsPermission = (action: string) => 
  RequirePermission('clients', action);

export const RequireProductsPermission = (action: string) => 
  RequirePermission('products', action);

export const RequireConfigPermission = (action: string) => 
  RequirePermission('config', action);