import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionService } from '../services/permission.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionGuard.name);

  constructor(
    private readonly permissionService: PermissionService,
    private readonly reflector: Reflector
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Buscar metadados de permissão necessária
    const requiredPermission = this.reflector.get<{ resource: string; action: string }>(
      'permission',
      context.getHandler()
    );

    // Se não há permissão definida, permitir acesso
    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Verificar se usuário está autenticado
    if (!user || !user.id || !user.tenantId) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    try {
      // Verificar permissão específica
      const hasPermission = await this.permissionService.hasPermission(
        user.tenantId,
        user.id,
        requiredPermission.resource,
        requiredPermission.action
      );

      if (!hasPermission) {
        throw new ForbiddenException(
          `Acesso negado. Permissão necessária: ${requiredPermission.resource}:${requiredPermission.action}`
        );
      }

      return true;

    } catch (error: any) {
      this.logger.error(`❌ ERRO NO PERMISSION GUARD:`, error);
      if (error.stack) this.logger.error(error.stack);

      if (error instanceof ForbiddenException) {
        throw error;
      }

      // Em caso de erro no sistema, negar acesso por segurança
      throw new ForbiddenException(`Erro ao verificar permissões: ${error.message}`);
    }
  }
}