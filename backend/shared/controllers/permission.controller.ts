import { PermissionGuard } from '../guards/permission.guard';
import { ModulePermissions } from '../decorators/module-permissions.decorator';
import { Action } from '../decorators/action.decorator';
import { Public } from '../decorators/public.decorator';
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Logger,
  Param,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Role } from "@prisma/client";
import { Request as ExpressRequest } from "express";
import { Roles } from "@core/common/decorators/roles.decorator";
import { JwtAuthGuard } from "@core/common/guards/jwt-auth.guard";
import { RolesGuard } from "@core/common/guards/roles.guard";
import { PermissionService } from "../services/permission.service";

type PermissionRequestUser = {
  id: string;
  role: Role;
  tenantId?: string | null;
};

@ModulePermissions('ordem_servico.permissions')
@Controller("ordem_servico/permissions")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PermissionController {
  private readonly logger = new Logger(PermissionController.name);

  constructor(private readonly permissionService: PermissionService) {}

  @Get("available")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getAvailableModulePermissions() {
    try {
      this.logger.log("Buscando permissoes disponiveis");
      return this.permissionService.getAvailablePermissions();
    } catch (error) {
      this.logger.error(
        "Erro ao buscar permissoes disponiveis",
        error as Error,
      );
      throw error;
    }
  }

  @Get("users")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getUsersWithModulePermissions(
    @Req() req: ExpressRequest & { user: PermissionRequestUser },
  ) {
    try {
      this.logger.log(
        `Buscando usuarios com permissoes. Tenant: ${req.user?.tenantId}`,
      );
      return await this.permissionService.getUsersWithPermissions();
    } catch (error) {
      this.logger.error(
        "Erro ao buscar usuarios com permissoes",
        error as Error,
      );
      throw error;
    }
  }

  @Get("users/:userId")
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.USER, Role.CLIENT)
  async getUserModulePermissions(
    @Req() req: ExpressRequest & { user: PermissionRequestUser },
    @Param("userId") userId: string,
  ) {
    try {
      if (
        req.user?.role !== Role.ADMIN &&
        req.user?.role !== Role.SUPER_ADMIN &&
        req.user?.id !== userId
      ) {
        throw new ForbiddenException(
          "Voce so pode consultar as proprias permissoes",
        );
      }

      this.logger.log(
        `Buscando permissoes do usuario ${userId}. Tenant: ${req.user?.tenantId}`,
      );
      return await this.permissionService.getUserPermissions(userId);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar permissoes do usuario ${userId}`,
        error as Error,
      );
      throw error;
    }
  }

  @Put("users/:userId")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async updateUserModulePermissions(
    @Req() req: ExpressRequest & { user: PermissionRequestUser },
    @Param("userId") userId: string,
    @Body() body: { permissions: any[] },
  ) {
    try {
      this.logger.log(
        `Atualizando permissoes do usuario ${userId}. Tenant: ${req.user?.tenantId}`,
      );
      await this.permissionService.updateUserPermissions(
        userId,
        body.permissions || [],
        req.user.id,
      );
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar permissoes do usuario ${userId}`,
        error as Error,
      );
      throw error;
    }
  }

  @Get("check/:resource/:action")
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.USER, Role.CLIENT)
  async checkPermission(
    @Req() req: ExpressRequest & { user: PermissionRequestUser },
    @Param("resource") resource: string,
    @Param("action") action: string,
  ) {
    const hasPermission = await this.permissionService.hasPermission(
      req.user.id,
      resource,
      action,
      req.user.role,
    );

    return { hasPermission };
  }

  @Get("audit")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getPermissionAudit(
    @Req() req: ExpressRequest & { user: PermissionRequestUser },
    @Query("userId") userId?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    try {
      this.logger.log(
        `Buscando auditoria de permissoes. Tenant: ${req.user?.tenantId}`,
      );
      return await this.permissionService.getPermissionAudit(
        userId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined,
      );
    } catch (error) {
      this.logger.error(
        "Erro ao buscar auditoria de permissoes",
        error as Error,
      );
      throw error;
    }
  }
}
