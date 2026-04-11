"use client";

import React from 'react';
import { usePermission } from '../hooks/usePermission';
import { PermissionDenied } from './PermissionDenied';

type ModuleAccessGuardProps = {
  resource: string;
  action: string;
  children: React.ReactNode;
};

export function ModuleAccessGuard({ resource, action, children }: ModuleAccessGuardProps) {
  const { hasPermission, loading } = usePermission(resource, action);

  if (loading || hasPermission === null) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  if (!hasPermission) {
    return <PermissionDenied resource={resource} action={action} />;
  }

  return <>{children}</>;
}
