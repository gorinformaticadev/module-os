import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { 
  IPermissionService, 
  UserPermission, 
  PermissionUpdate, 
  AvailablePermission,
  UserWithPermissions,
  PermissionAudit
} from '../interfaces/permission.interface';
import { AVAILABLE_PERMISSIONS } from '../constants/available-permissions';

@Injectable()
export class PermissionService implements IPermissionService {
  private readonly logger = new Logger(PermissionService.name);
  private permissionCache = new Map<string, UserPermission[]>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  constructor(private readonly prisma: PrismaService) {}

  async getUserPermissions(tenantId: string, userId: string): Promise<UserPermission[]> {
    const cacheKey = `${tenantId}:${userId}`;
    
    // Verificar cache
    if (this.permissionCache.has(cacheKey)) {
      this.logger.log(`Permissões encontradas no cache para usuário ${userId}`);
      return this.permissionCache.get(cacheKey)!;
    }

    try {
      this.logger.log(`Buscando permissões para usuário ${userId} no tenant ${tenantId}`);
      
      const permissions = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT 
          id, user_id, tenant_id, resource, action, allowed, 
          created_at, updated_at, created_by
         FROM mod_ordem_servico_user_permissions 
         WHERE tenant_id = $1 AND user_id = $2
         ORDER BY resource, action`,
        tenantId, userId
      );

      const userPermissions: UserPermission[] = permissions.map(p => ({
        id: p.id,
        userId: p.user_id,
        tenantId: p.tenant_id,
        resource: p.resource,
        action: p.action,
        allowed: p.allowed,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        createdBy: p.created_by
      }));

      // Adicionar ao cache
      this.permissionCache.set(cacheKey, userPermissions);
      setTimeout(() => {
        this.permissionCache.delete(cacheKey);
      }, this.CACHE_TTL);

      this.logger.log(`✅ ${userPermissions.length} permissões encontradas para usuário ${userId}`);
      return userPermissions;

    } catch (error) {
      this.logger.error(`❌ Erro ao buscar permissões do usuário ${userId}:`, error);
      throw error;
    }
  }

  async updateUserPermissions(
    tenantId: string, 
    userId: string, 
    permissions: PermissionUpdate[], 
    changedBy: string
  ): Promise<void> {
    try {
      this.logger.log(`Atualizando ${permissions.length} permissões para usuário ${userId}`);

      // Buscar permissões atuais para auditoria
      const currentPermissions = await this.getUserPermissions(tenantId, userId);
      
      for (const permission of permissions) {
        const current = currentPermissions.find(
          p => p.resource === permission.resource && p.action === permission.action
        );

        // Se a permissão já existe, atualizar
        if (current) {
          if (current.allowed !== permission.allowed) {
            await this.prisma.$executeRawUnsafe(
              `UPDATE mod_ordem_servico_user_permissions 
               SET allowed = $3, updated_at = NOW() 
               WHERE tenant_id = $1 AND user_id = $2 AND resource = $4 AND action = $5`,
              tenantId, userId, permission.allowed, permission.resource, permission.action
            );

            // Registrar auditoria
            await this.logPermissionChange(
              tenantId, userId, permission.resource, permission.action,
              current.allowed, permission.allowed, changedBy
            );
          }
        } else {
          // Se não existe, criar nova
          await this.prisma.$executeRawUnsafe(
            `INSERT INTO mod_ordem_servico_user_permissions 
             (tenant_id, user_id, resource, action, allowed, created_by)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            tenantId, userId, permission.resource, permission.action, permission.allowed, changedBy
          );

          // Registrar auditoria
          await this.logPermissionChange(
            tenantId, userId, permission.resource, permission.action,
            null, permission.allowed, changedBy
          );
        }
      }

      // Limpar cache
      this.permissionCache.delete(`${tenantId}:${userId}`);
      
      this.logger.log(`✅ Permissões atualizadas com sucesso para usuário ${userId}`);

    } catch (error) {
      this.logger.error(`❌ Erro ao atualizar permissões do usuário ${userId}:`, error);
      throw error;
    }
  }

  async hasPermission(tenantId: string, userId: string, resource: string, action: string): Promise<boolean> {
    try {
      // 🔑 BYPASS AUTOMÁTICO: Verificar se o usuário é ADMIN ou SUPER_ADMIN
      const users = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT role, name, email FROM users WHERE id = $1`,
        userId
      );

      const user = users[0];
      if (user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
        this.logger.log(`🔓 BYPASS ADMIN: ${user.name} (${user.role}) tem acesso automático a ${resource}:${action}`);
        return true;
      }

      // Verificação normal de permissões para outros usuários
      const permissions = await this.getUserPermissions(tenantId, userId);
      const permission = permissions.find(p => p.resource === resource && p.action === action);
      
      const hasAccess = permission?.allowed || false;
      
      if (!hasAccess) {
        this.logger.warn(`❌ Acesso negado: usuário ${userId} tentou acessar ${resource}:${action}`);
        // Registrar tentativa de acesso negado
        await this.logAccessDenied(tenantId, userId, resource, action);
      }

      return hasAccess;
    } catch (error) {
      this.logger.error(`❌ Erro ao verificar permissão ${resource}:${action} para usuário ${userId}:`, error);
      return false;
    }
  }

  getAvailablePermissions(): AvailablePermission[] {
    return AVAILABLE_PERMISSIONS;
  }

  async getUsersWithPermissions(tenantId: string): Promise<UserWithPermissions[]> {
    try {
      this.logger.log(`Buscando usuários com permissões para tenant ${tenantId}`);

      // Buscar todos os usuários (sem filtro de tenant se a tabela não tiver essa coluna)
      const users = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT id, name, email, role FROM users ORDER BY name ASC`
      );

      this.logger.log(`✅ ${users.length} usuários encontrados na base`);

      const usersWithPermissions: UserWithPermissions[] = [];

      for (const user of users) {
        const permissions = await this.getUserPermissions(tenantId, user.id);
        
        // 🔑 BYPASS AUTOMÁTICO: Se for ADMIN ou SUPER_ADMIN, considerar todas as permissões como permitidas
        let permissionSummary;
        
        if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
          const totalAvailablePermissions = AVAILABLE_PERMISSIONS.reduce((total, group) => total + group.actions.length, 0);
          permissionSummary = {
            total: totalAvailablePermissions,
            allowed: totalAvailablePermissions, // Todas permitidas para admins
            denied: 0
          };
        } else {
          permissionSummary = {
            total: permissions.length,
            allowed: permissions.filter(p => p.allowed).length,
            denied: permissions.filter(p => !p.allowed).length
          };
        }

        usersWithPermissions.push({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role, // Incluir o papel do usuário
          permissions,
          permissionSummary
        });
      }

      this.logger.log(`✅ ${usersWithPermissions.length} usuários processados com permissões`);
      return usersWithPermissions;

    } catch (error) {
      this.logger.error(`❌ Erro ao buscar usuários com permissões:`, error);
      throw error;
    }
  }

  private async logPermissionChange(
    tenantId: string,
    userId: string,
    resource: string,
    action: string,
    oldValue: boolean | null,
    newValue: boolean,
    changedBy: string,
    reason?: string
  ): Promise<void> {
    try {
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO mod_ordem_servico_permission_audit 
         (tenant_id, user_id, resource, action, old_value, new_value, changed_by, reason)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        tenantId, userId, resource, action, oldValue, newValue, changedBy, reason
      );
    } catch (error) {
      this.logger.error('❌ Erro ao registrar auditoria de permissão:', error);
    }
  }

  private async logAccessDenied(
    tenantId: string,
    userId: string,
    resource: string,
    action: string
  ): Promise<void> {
    try {
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO mod_ordem_servico_permission_audit 
         (tenant_id, user_id, resource, action, old_value, new_value, changed_by, reason)
         VALUES ($1, $2, $3, $4, null, false, $2, 'ACCESS_DENIED')`,
        tenantId, userId, resource, action
      );
    } catch (error) {
      this.logger.error('❌ Erro ao registrar tentativa de acesso negado:', error);
    }
  }

  async getPermissionAudit(
    tenantId: string,
    userId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<PermissionAudit[]> {
    try {
      let query = `
        SELECT id, tenant_id, user_id, resource, action, old_value, new_value,
               changed_by, changed_at, reason
        FROM mod_ordem_servico_permission_audit
        WHERE tenant_id = $1
      `;
      const params: any[] = [tenantId];

      if (userId) {
        query += ` AND user_id = $${params.length + 1}`;
        params.push(userId);
      }

      if (startDate) {
        query += ` AND changed_at >= $${params.length + 1}`;
        params.push(startDate);
      }

      if (endDate) {
        query += ` AND changed_at <= $${params.length + 1}`;
        params.push(endDate);
      }

      query += ` ORDER BY changed_at DESC LIMIT 1000`;

      const audits = await this.prisma.$queryRawUnsafe<any[]>(query, ...params);

      return audits.map(audit => ({
        id: audit.id,
        tenantId: audit.tenant_id,
        userId: audit.user_id,
        resource: audit.resource,
        action: audit.action,
        oldValue: audit.old_value,
        newValue: audit.new_value,
        changedBy: audit.changed_by,
        changedAt: audit.changed_at,
        reason: audit.reason
      }));

    } catch (error) {
      this.logger.error('❌ Erro ao buscar auditoria de permissões:', error);
      throw error;
    }
  }

  async getProfilePermissions(tenantId: string): Promise<Record<string, { admin: boolean; technician: boolean; attendant: boolean }>> {
    try {
      this.logger.log(`Buscando permissões de perfil para tenant ${tenantId}`);

      const permissions = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT permission_id, profile, allowed
         FROM mod_ordem_servico_profile_permissions
         WHERE tenant_id = $1
         ORDER BY permission_id, profile`,
        tenantId
      );

      const result: Record<string, { admin: boolean; technician: boolean; attendant: boolean }> = {};

      permissions.forEach(perm => {
        if (!result[perm.permission_id]) {
          result[perm.permission_id] = { admin: false, technician: false, attendant: false };
        }
        result[perm.permission_id][perm.profile as keyof typeof result[string]] = perm.allowed;
      });

      this.logger.log(`✅ ${Object.keys(result).length} permissões de perfil encontradas`);
      return result;

    } catch (error) {
      this.logger.error('❌ Erro ao buscar permissões de perfil:', error);
      throw error;
    }
  }

  async updateProfilePermissions(
    tenantId: string,
    permissions: Record<string, { admin: boolean; technician: boolean; attendant: boolean }>,
    changedBy: string
  ): Promise<void> {
    try {
      this.logger.log(`Atualizando ${Object.keys(permissions).length} permissões de perfil para tenant ${tenantId}`);

      for (const [permissionId, profilePerms] of Object.entries(permissions)) {
        for (const [profile, allowed] of Object.entries(profilePerms)) {
          // Verificar se já existe
          const existing = await this.prisma.$queryRawUnsafe<any[]>(
            `SELECT id, allowed FROM mod_ordem_servico_profile_permissions
             WHERE tenant_id = $1 AND permission_id = $2 AND profile = $3`,
            tenantId, permissionId, profile
          );

          if (existing.length > 0) {
            // Se mudou, atualizar
            if (existing[0].allowed !== allowed) {
              await this.prisma.$executeRawUnsafe(
                `UPDATE mod_ordem_servico_profile_permissions
                 SET allowed = $4, updated_at = NOW()
                 WHERE tenant_id = $1 AND permission_id = $2 AND profile = $3`,
                tenantId, permissionId, profile, allowed
              );

              // Registrar auditoria
              await this.logPermissionChange(
                tenantId, changedBy, permissionId, profile,
                existing[0].allowed, allowed, changedBy,
                'PROFILE_PERMISSION_UPDATE'
              );
            }
          } else {
            // Se não existe, criar
            await this.prisma.$executeRawUnsafe(
              `INSERT INTO mod_ordem_servico_profile_permissions
               (tenant_id, permission_id, profile, allowed)
               VALUES ($1, $2, $3, $4)`,
              tenantId, permissionId, profile, allowed
            );

            // Registrar auditoria
            await this.logPermissionChange(
              tenantId, changedBy, permissionId, profile,
              null, allowed, changedBy,
              'PROFILE_PERMISSION_CREATE'
            );
          }
        }
      }

      this.logger.log(`✅ Permissões de perfil atualizadas com sucesso`);

    } catch (error) {
      this.logger.error('❌ Erro ao atualizar permissões de perfil:', error);
      throw error;
    }
  }
}