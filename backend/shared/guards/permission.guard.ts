import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionService } from '../services/permission.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<{ resource: string; action: string }>(
      'permission',
      context.getHandler(),
    );

    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new ForbiddenException('Usuario nao autenticado');
    }

    try {
      const hasPermission = await this.permissionService.hasPermission(
        user.id,
        requiredPermission.resource,
        requiredPermission.action,
      );

      if (!hasPermission) {
        throw new ForbiddenException(
          `Acesso negado. Permissao necessaria: ${requiredPermission.resource}:${requiredPermission.action}`,
        );
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      throw new ForbiddenException('Erro ao verificar permissoes');
    }
  }
}
