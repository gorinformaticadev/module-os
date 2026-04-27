import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PermissionService } from "../services/permission.service";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Verificar se o endpoint é público
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // 2. Tentar obter permissão do método (Singular)
    let permission = this.reflector.get<{
      resource: string;
      action: string;
    }>("permission", context.getHandler());

    // 3. Se não houver no método, tentar obter do nível de classe (Plural/Scope)
    if (!permission) {
        const classPermissions = this.reflector.get<string[]>("permissions", context.getClass());
        if (classPermissions && classPermissions.length > 0) {
            // Se houver @Permissions na classe, usamos o primeiro como recurso padrão
            // e tentamos inferir a ação pelo nome do método ou metadados extras
            // Por enquanto, exigimos que o método tenha ao menos a ação.
            const action = this.reflector.get<string>("action", context.getHandler());
            if (action) {
                permission = { resource: classPermissions[0], action };
            }
        }
    }

    // 4. DENY BY DEFAULT: Se não houver nenhuma definição de permissão, bloqueia.
    if (!permission) {
      throw new ForbiddenException("Acesso negado: Nenhuma regra de permissão definida para este recurso.");
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new ForbiddenException("Usuario nao autenticado");
    }

    try {
      const hasPermission = await this.permissionService.hasPermission(
        user.id,
        permission.resource,
        permission.action,
        user.role,
      );

      if (!hasPermission) {
        throw new ForbiddenException(
          `Acesso negado. Voce nao possui a permissao necessária: ${permission.resource}:${permission.action}`,
        );
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      throw new ForbiddenException("Erro ao verificar permissoes de acesso.");
    }
  }
}
