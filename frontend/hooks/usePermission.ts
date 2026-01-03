import { useState, useEffect, useCallback } from 'react';
import { PermissionService } from '../services/permissionService';

interface UsePermissionResult {
  hasPermission: boolean | null;
  loading: boolean;
  error: string | null;
  checkPermission: (resource: string, action: string) => Promise<boolean>;
  refetch: () => void;
}

export const usePermission = (resource?: string, action?: string): UsePermissionResult => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkPermission = useCallback(async (res: string, act: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const allowed = await PermissionService.checkPermission(res, act);
      setHasPermission(allowed);
      
      return allowed;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao verificar permissão';
      setError(errorMessage);
      setHasPermission(false);
      console.error('Erro ao verificar permissão:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    if (resource && action) {
      checkPermission(resource, action);
    }
  }, [resource, action, checkPermission]);

  useEffect(() => {
    if (resource && action) {
      checkPermission(resource, action);
    }
  }, [resource, action, checkPermission]);

  return {
    hasPermission,
    loading,
    error,
    checkPermission,
    refetch
  };
};

// Hook para verificar múltiplas permissões
export const useMultiplePermissions = (permissions: Array<{ resource: string; action: string }>) => {
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAllPermissions = useCallback(async () => {
    if (!permissions.length) return;

    try {
      setLoading(true);
      setError(null);
      
      const checks = await Promise.all(
        permissions.map(async ({ resource, action }) => {
          const key = `${resource}:${action}`;
          const allowed = await PermissionService.checkPermission(resource, action);
          return { key, allowed };
        })
      );

      const newResults: Record<string, boolean> = {};
      checks.forEach(({ key, allowed }) => {
        newResults[key] = allowed;
      });

      setResults(newResults);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao verificar permissões';
      setError(errorMessage);
      console.error('Erro ao verificar permissões:', err);
    } finally {
      setLoading(false);
    }
  }, [permissions]);

  useEffect(() => {
    checkAllPermissions();
  }, [checkAllPermissions]);

  const hasPermission = useCallback((resource: string, action: string): boolean => {
    const key = `${resource}:${action}`;
    return results[key] || false;
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
    refetch: checkAllPermissions
  };
};

// Hook para verificar se o usuário tem pelo menos uma permissão de uma lista
export const useHasAnyPermission = (permissions: Array<{ resource: string; action: string }>) => {
  const { hasAnyPermission, loading, error } = useMultiplePermissions(permissions);
  
  return {
    hasAnyPermission: hasAnyPermission(permissions),
    loading,
    error
  };
};

// Hook para verificar se o usuário tem todas as permissões de uma lista
export const useHasAllPermissions = (permissions: Array<{ resource: string; action: string }>) => {
  const { hasAllPermissions, loading, error } = useMultiplePermissions(permissions);
  
  return {
    hasAllPermissions: hasAllPermissions(permissions),
    loading,
    error
  };
};