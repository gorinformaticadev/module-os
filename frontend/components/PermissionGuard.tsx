import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionService } from '../services/permissionService';
import { PermissionDenied } from './PermissionDenied';

interface PermissionGuardProps {
  resource: string;
  action: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  resource,
  action,
  children,
  fallback,
}) => {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        if (!user) {
          setHasPermission(false);
          return;
        }

        if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
          setHasPermission(true);
          return;
        }

        const allowed = await PermissionService.checkPermission(resource, action);
        setHasPermission(allowed);
      } catch {
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    };

    void checkPermission();
  }, [action, resource, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!hasPermission) {
    return fallback || <PermissionDenied resource={resource} action={action} />;
  }

  return <>{children}</>;
};
