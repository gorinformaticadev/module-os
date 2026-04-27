import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@core/prisma/prisma.service";
import { RequestSecurityContextService } from "@common/services/request-security-context.service";
import { ModuleOsPrismaService } from "../../prisma/module-os-prisma.service";
import {
  AvailablePermission,
  IPermissionService,
  PermissionAudit,
  PermissionUpdate,
  UserPermission,
  UserWithPermissions,
} from "../interfaces/permission.interface";
import { AVAILABLE_PERMISSIONS } from "../constants/available-permissions";

type ModuleProfile = "admin" | "technician" | "attendant";

@Injectable()
export class PermissionService implements IPermissionService {
  private readonly logger = new Logger(PermissionService.name);
  private permissionCache = new Map<string, UserPermission[]>();
  private readonly CACHE_TTL = 5 * 60 * 1000;
  private readonly profilePermissionCache = new Map<
    string,
    Record<string, Record<ModuleProfile, boolean>>
  >();
  private readonly PROFILE_CACHE_TTL = 5 * 60 * 1000;

  private readonly LEGACY_PROFILE_PERMISSION_MAP: Record<string, string> = {
    dashboard_export: "dashboard_view_statistics",
    orders_assign: "orders_change_status",
    config_users: "config_manage_permissions",
    config_permissions: "config_manage_permissions",
    config_system: "config_edit",
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly modulePrisma: ModuleOsPrismaService,
    private readonly requestSecurityContext: RequestSecurityContextService,
  ) {}

  async getUserPermissions(userId: string): Promise<UserPermission[]> {
    const tenantId = this.getTenantIdOrThrow();
    await this.getTenantUserOrThrow(userId);

    const cacheKey = `${tenantId}:${userId}`;
    if (this.permissionCache.has(cacheKey)) {
      return this.permissionCache.get(cacheKey)!;
    }

    try {
      const permissions = await (
        this.modulePrisma as any
      ).mod_ordem_servico_user_permissions.findMany({
        where: { userId },
        orderBy: [{ resource: "asc" }, { action: "asc" }],
      });

      const userPermissions: UserPermission[] = permissions.map(
        (permission) => ({
          id: permission.id,
          userId: permission.userId,
          tenantId: permission.tenantId,
          resource: permission.resource,
          action: permission.action,
          allowed: permission.allowed === true,
          createdAt: permission.createdAt || new Date(),
          updatedAt: permission.updatedAt || new Date(),
          createdBy: permission.createdBy,
        }),
      );

      this.permissionCache.set(cacheKey, userPermissions);
      setTimeout(() => {
        this.permissionCache.delete(cacheKey);
      }, this.CACHE_TTL);

      return userPermissions;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar permissoes do usuario ${userId}`,
        error as Error,
      );
      throw error;
    }
  }

  async updateUserPermissions(
    userId: string,
    permissions: PermissionUpdate[],
    changedBy: string,
  ): Promise<void> {
    const tenantId = this.getTenantIdOrThrow();

    try {
      const targetUser = await this.getTenantUserOrThrow(userId);

      if (targetUser.role === "ADMIN" || targetUser.role === "SUPER_ADMIN") {
        throw new ForbiddenException(
          "Permissoes explicitas nao podem sobrescrever papeis administrativos",
        );
      }

      const currentPermissions = await this.getUserPermissions(userId);

      for (const permission of permissions) {
        const current = currentPermissions.find(
          (item) =>
            item.resource === permission.resource &&
            item.action === permission.action,
        );

        if (current) {
          if (current.allowed !== permission.allowed) {
            await (
              this.modulePrisma as any
            ).mod_ordem_servico_user_permissions.updateMany({
              where: {
                userId,
                resource: permission.resource,
                action: permission.action,
              },
              data: {
                allowed: permission.allowed,
                updatedAt: new Date(),
              },
            });

            await this.logPermissionChange(
              userId,
              permission.resource,
              permission.action,
              current.allowed,
              permission.allowed,
              changedBy,
            );
          }
        } else {
          await (
            this.modulePrisma as any
          ).mod_ordem_servico_user_permissions.create({
            data: {
              tenantId,
              userId,
              resource: permission.resource,
              action: permission.action,
              allowed: permission.allowed,
              createdBy: changedBy,
            },
          });

          await this.logPermissionChange(
            userId,
            permission.resource,
            permission.action,
            null,
            permission.allowed,
            changedBy,
          );
        }
      }

      this.permissionCache.delete(`${tenantId}:${userId}`);
      this.profilePermissionCache.delete(tenantId);
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar permissoes do usuario ${userId}`,
        error as Error,
      );
      throw error;
    }
  }

  async hasPermission(
    userId: string,
    resource: string,
    action: string,
    requesterRole?: string | null,
  ): Promise<boolean> {
    try {
      // Verificar role ANTES de qualquer consulta ao banco
      // ADMIN e SUPER_ADMIN têm acesso total, independente do estado do módulo
      const normalizedRequesterRole = this.normalizeRole(requesterRole);
      if (
        normalizedRequesterRole === "ADMIN" ||
        normalizedRequesterRole === "SUPER_ADMIN"
      ) {
        return true;
      }

      const moduleEnabled = await this.isModuleEnabled();
      if (!moduleEnabled) {
        return false;
      }

      const user = await this.getTenantUserOrThrow(userId, {
        id: true,
        role: true,
        name: true,
        email: true,
      });

      const normalizedUserRole = this.normalizeRole(user.role);
      if (
        normalizedUserRole === "ADMIN" ||
        normalizedUserRole === "SUPER_ADMIN"
      ) {
        return true;
      }

      const permissions = await this.getUserPermissions(userId);
      const explicitPermission = permissions.find(
        (item) => item.resource === resource && item.action === action,
      );

      if (explicitPermission) {
        if (!explicitPermission.allowed) {
          await this.logAccessDenied(userId, resource, action);
        }
        return explicitPermission.allowed;
      }

      const permissionKey = this.buildProfilePermissionKey(resource, action);
      const profilePermissions = await this.getProfilePermissionsMatrix();
      const userProfiles = await this.resolveUserProfiles(userId);
      const permissionConfig = profilePermissions[permissionKey];
      const hasAccess = permissionConfig
        ? userProfiles.some((profile) => permissionConfig[profile] === true)
        : false;

      if (!hasAccess) {
        await this.logAccessDenied(userId, resource, action);
      }

      return hasAccess;
    } catch (error) {
      this.logger.error(
        `Erro ao verificar permissao ${resource}:${action} para usuario ${userId}`,
        error as Error,
      );
      return false;
    }
  }

  getAvailablePermissions(): AvailablePermission[] {
    return AVAILABLE_PERMISSIONS;
  }

  async getUsersWithPermissions(): Promise<UserWithPermissions[]> {
    try {
      const tenantId = this.getTenantIdOrThrow();
      const users = await this.prisma.user.findMany({
        where: { tenantId },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      const allPermissionActions = AVAILABLE_PERMISSIONS.flatMap((group) =>
        group.actions.map((action) => ({
          resource: group.resource,
          action: action.action,
        })),
      );

      const usersWithPermissions: UserWithPermissions[] = [];

      for (const user of users) {
        const permissions = await this.getUserPermissions(user.id);
        const totalAvailablePermissions = allPermissionActions.length;

        if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
          usersWithPermissions.push({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            permissions,
            permissionSummary: {
              total: totalAvailablePermissions,
              allowed: totalAvailablePermissions,
              denied: 0,
            },
          });
          continue;
        }

        let allowed = 0;
        for (const permission of allPermissionActions) {
          const granted = await this.hasPermission(
            user.id,
            permission.resource,
            permission.action,
          );
          if (granted) {
            allowed += 1;
          }
        }

        usersWithPermissions.push({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          permissions,
          permissionSummary: {
            total: totalAvailablePermissions,
            allowed,
            denied: totalAvailablePermissions - allowed,
          },
        });
      }

      return usersWithPermissions;
    } catch (error) {
      this.logger.error(
        "Erro ao buscar usuarios com permissoes",
        error as Error,
      );
      throw error;
    }
  }

  async getPermissionAudit(
    userId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<PermissionAudit[]> {
    try {
      if (userId) {
        await this.getTenantUserOrThrow(userId);
      }

      const where: any = {};
      if (userId) where.userId = userId;
      if (startDate || endDate) {
        where.changedAt = {
          ...(startDate ? { gte: startDate } : {}),
          ...(endDate ? { lte: endDate } : {}),
        };
      }

      const audits = await (
        this.modulePrisma as any
      ).mod_ordem_servico_permission_audit.findMany({
        where,
        orderBy: { changedAt: "desc" },
        take: 1000,
      });

      return audits.map((audit) => ({
        id: audit.id,
        tenantId: audit.tenantId,
        userId: audit.userId,
        resource: audit.resource,
        action: audit.action,
        oldValue: audit.oldValue ?? null,
        newValue: audit.newValue,
        changedBy: audit.changedBy,
        changedAt: audit.changedAt || new Date(),
        reason: audit.reason || undefined,
      }));
    } catch (error) {
      this.logger.error(
        "Erro ao buscar auditoria de permissoes",
        error as Error,
      );
      throw error;
    }
  }

  private async logPermissionChange(
    userId: string,
    resource: string,
    action: string,
    oldValue: boolean | null,
    newValue: boolean,
    changedBy: string,
    reason?: string,
  ): Promise<void> {
    try {
      await (
        this.modulePrisma as any
      ).mod_ordem_servico_permission_audit.create({
        data: {
          tenantId: this.getTenantIdOrThrow(),
          userId,
          resource,
          action,
          oldValue,
          newValue,
          changedBy,
          reason,
        },
      });
    } catch (error) {
      this.logger.error(
        "Erro ao registrar auditoria de permissao",
        error as Error,
      );
    }
  }

  private async logAccessDenied(
    userId: string,
    resource: string,
    action: string,
  ): Promise<void> {
    try {
      await (
        this.modulePrisma as any
      ).mod_ordem_servico_permission_audit.create({
        data: {
          tenantId: this.getTenantIdOrThrow(),
          userId,
          resource,
          action,
          oldValue: null,
          newValue: false,
          changedBy: userId,
          reason: "ACCESS_DENIED",
        },
      });
    } catch (error) {
      this.logger.error(
        "Erro ao registrar tentativa de acesso negado",
        error as Error,
      );
    }
  }

  private getTenantIdOrThrow(): string {
    const tenantId = this.requestSecurityContext.getTenantId();
    if (!tenantId) {
      throw new BadRequestException("Operacao exige tenant valido");
    }
    return tenantId;
  }

  private async isModuleEnabled(): Promise<boolean> {
    this.getTenantIdOrThrow();

    try {
      const config = await (
        this.modulePrisma as any
      ).mod_ordem_servico_configs.findFirst({
        where: { key: "module_enabled" },
        select: { value: true },
      });

      if (!config?.value) {
        return false;
      }

      const normalizedValue = String(config.value).trim().toLowerCase();
      return ["1", "true", "yes", "on", "enabled"].includes(normalizedValue);
    } catch (error) {
      this.logger.error(
        "Erro ao verificar se o modulo ordem_servico esta habilitado para o tenant",
        error as Error,
      );
      return false;
    }
  }

  private normalizeRole(role: unknown): string | null {
    if (typeof role !== "string") {
      return null;
    }

    const normalizedRole = role.trim().toUpperCase();
    return normalizedRole.length > 0 ? normalizedRole : null;
  }

  private buildProfilePermissionKey(resource: string, action: string): string {
    return `${String(resource || "").trim()}_${String(action || "").trim()}`;
  }

  private normalizeProfilePermissionKey(rawKey: string): string {
    const key = String(rawKey || "").trim();
    return this.LEGACY_PROFILE_PERMISSION_MAP[key] || key;
  }

  private getDefaultProfilePermissions(): Record<
    string,
    Record<ModuleProfile, boolean>
  > {
    const defaults: Record<string, Record<ModuleProfile, boolean>> = {};

    const technicianDefaults = new Set<string>([
      "dashboard_view",
      "dashboard_view_statistics",
      "orders_view",
      "orders_view_details",
      "orders_create",
      "orders_edit",
      "orders_change_status",
      "orders_view_history",
      "clients_view",
      "clients_view_details",
      "clients_create",
      "clients_edit",
      "clients_upload_images",
      "products_view",
      "products_create",
      "products_edit",
      "products_upload_images",
      "config_view",
    ]);

    const attendantDefaults = new Set<string>([
      "dashboard_view",
      "orders_view",
      "orders_view_details",
      "orders_create",
      "clients_view",
      "clients_view_details",
      "clients_create",
      "clients_edit",
      "clients_upload_images",
      "products_view",
      "products_create",
      "products_edit",
      "products_upload_images",
    ]);

    for (const group of AVAILABLE_PERMISSIONS) {
      for (const action of group.actions) {
        const key = this.buildProfilePermissionKey(
          group.resource,
          action.action,
        );
        defaults[key] = {
          admin: true,
          technician: technicianDefaults.has(key),
          attendant: attendantDefaults.has(key),
        };
      }
    }

    return defaults;
  }

  private async getProfilePermissionsMatrix(): Promise<
    Record<string, Record<ModuleProfile, boolean>>
  > {
    const tenantId = this.getTenantIdOrThrow();
    const cached = this.profilePermissionCache.get(tenantId);
    if (cached) {
      return cached;
    }

    const defaults = this.getDefaultProfilePermissions();

    try {
      const rows = await (
        this.modulePrisma as any
      ).mod_ordem_servico_profile_permissions.findMany({
        orderBy: [{ profile: "asc" }, { permissionId: "asc" }],
      });

      const merged: Record<string, Record<ModuleProfile, boolean>> = {
        ...defaults,
      };

      for (const row of rows) {
        const key = this.normalizeProfilePermissionKey(
          String(row.permissionId || ""),
        );
        if (!key) {
          continue;
        }

        if (!merged[key]) {
          merged[key] = { admin: true, technician: false, attendant: false };
        }

        const profile = String(row.profile || "").toLowerCase();
        if (
          profile === "admin" ||
          profile === "technician" ||
          profile === "attendant"
        ) {
          merged[key][profile] = row.allowed === true;
        }
      }

      this.profilePermissionCache.set(tenantId, merged);
      setTimeout(() => {
        this.profilePermissionCache.delete(tenantId);
      }, this.PROFILE_CACHE_TTL);

      return merged;
    } catch (error) {
      this.logger.error(
        `Erro ao carregar permissoes por perfil do tenant ${tenantId}. Usando defaults.`,
        error as Error,
      );
      return defaults;
    }
  }

  private async resolveUserProfiles(userId: string): Promise<ModuleProfile[]> {
    try {
      const roles = await (
        this.modulePrisma as any
      ).mod_ordem_servico_user_roles.findFirst({
        where: { userId },
        select: {
          isAdmin: true,
          isTechnician: true,
          isAttendant: true,
        },
      });

      if (!roles) {
        return ["attendant"];
      }

      const profiles: ModuleProfile[] = [];
      if (roles.isAdmin) profiles.push("admin");
      if (roles.isTechnician) profiles.push("technician");
      if (roles.isAttendant || profiles.length === 0)
        profiles.push("attendant");

      return profiles;
    } catch (error) {
      const tenantId = this.requestSecurityContext.getTenantId();
      this.logger.error(
        `Erro ao resolver perfis do usuario ${userId} no tenant ${tenantId}. Aplicando fallback.`,
        error as Error,
      );
      return ["attendant"];
    }
  }

  private async getTenantUserOrThrow<
    TSelect extends Record<string, boolean> | undefined = undefined,
  >(userId: string, select?: TSelect) {
    const tenantId = this.getTenantIdOrThrow();
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
      },
      select: select || {
        id: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException("Usuario nao encontrado neste tenant");
    }

    return user;
  }
}
