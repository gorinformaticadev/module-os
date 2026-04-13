import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionService } from '../services/permissionService';

interface UsePermissionResult {
  hasPermission: boolean | null;
  loading: boolean;
  error: string | null;
  checkPermission: (resource: string, action: string) => Promise<boolean>;
  refetch: () => void;
}

export const usePermission = (resource?: string, action?: string): UsePermissionResult => {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkPermission = useCallback(async (res: string, act: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        setHasPermission(false);
        return false;
      }

      if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
        setHasPermission(true);
        return true;
      }

      const allowed = await PermissionService.checkPermission(res, act);
      setHasPermission(allowed);
      return allowed;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao verificar permissao';
      setError(errorMessage);
      setHasPermission(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refetch = useCallback(() => {
    if (resource && action) {
      void checkPermission(resource, action);
    }
  }, [resource, action, checkPermission]);

  useEffect(() => {
    if (resource && action) {
      void checkPermission(resource, action);
    }
  }, [resource, action, checkPermission]);

  return {
    hasPermission,
    loading,
    error,
    checkPermission,
    refetch,
  };
};

export const useMultiplePermissions = (permissions: Array<{ resource: string; action: string }>) => {
  const { user } = useAuth();
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAllPermissions = useCallback(async () => {
    if (!permissions.length) return;

    try {
      setLoading(true);
      setError(null);

      if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') {
        const allowedResults = permissions.reduce<Record<string, boolean>>((acc, permission) => {
          acc[`${permission.resource}:${permission.action}`] = true;
          return acc;
        }, {});
        setResults(allowedResults);
        return;
      }

      const checks = await Promise.all(
        permissions.map(async ({ resource, action }) => ({
          key: `${resource}:${action}`,
          allowed: await PermissionService.checkPermission(resource, action),
        })),
      );

      const newResults: Record<string, boolean> = {};
      checks.forEach(({ key, allowed }) => {
        newResults[key] = allowed;
      });

      setResults(newResults);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao verificar permissoes';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [permissions, user]);

  useEffect(() => {
    void checkAllPermissions();
  }, [checkAllPermissions]);

  const hasPermission = useCallback((resource: string, action: string): boolean => {
    return results[`${resource}:${action}`] || false;
  }, [results]);

  const hasAnyPermission = useCallback((perms: Array<{ resource: string; action: string }>): boolean => {
    return perms.some(({ resource, action }) => hasPermission(resource, action));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((perms: Array<{ resource: string; action: string }>): boolean => {
    return perms.every(({ resource, action }) => hasPermission(resource, action));
  }, [hasPermission]);

  return {
    results,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refetch: checkAllPermissions,
  };
};

export const useHasAnyPermission = (permissions: Array<{ resource: string; action: string }>) => {
  const { hasAnyPermission, loading, error } = useMultiplePermissions(permissions);

  return {
    hasAnyPermission: hasAnyPermission(permissions),
    loading,
    error,
  };
};

export const useHasAllPermissions = (permissions: Array<{ resource: string; action: string }>) => {
  const { hasAllPermissions, loading, error } = useMultiplePermissions(permissions);

  return {
    hasAllPermissions: hasAllPermissions(permissions),
    loading,
    error,
  };
};
