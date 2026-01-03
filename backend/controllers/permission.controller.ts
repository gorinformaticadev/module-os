import { 
  Controller, 
  Get, 
  Put, 
  Body, 
  Param, 
  Query,
  UseGuards, 
  Req, 
  Logger,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '@core/guards/jwt-auth.guard';
import { PermissionService } from '../services/permission.service';
import { PermissionUpdate } from '../interfaces/permission.interface';

@Controller('modules/ordem_servico/permissions')
@UseGuards(JwtAuthGuard)
export class PermissionController {
  private readonly logger = new Logger(PermissionController.name);

  constructor(private readonly permissionService: PermissionService) {}

  @Get('available')
  async getAvailablePermissions() {
    try {
      this.logger.log('Buscando permissões disponíveis');
      return this.permissionService.getAvailablePermissions();
    } catch (error) {
      this.logger.error('❌ Erro ao buscar permissões disponíveis:', error);
      throw new HttpException('Erro ao buscar permissões disponíveis', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('users')
  async getUsersWithPermissions(@Req() req: ExpressRequest & { user: any }) {
    try {
      this.logger.log(`Buscando usuários com permissões. Tenant: ${req.user?.tenantId}`);
      return await this.permissionService.getUsersWithPermissions(req.user.tenantId);
    } catch (error) {
      this.logger.error('❌ Erro ao buscar usuários com permissões:', error);
      throw new HttpException('Erro ao buscar usuários com permissões', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('users/:userId')
  async getUserPermissions(
    @Param('userId') userId: string,
    @Req() req: ExpressRequest & { user: any }
  ) {
    try {
      this.logger.log(`Buscando permissões do usuário ${userId}`);
      return await this.permissionService.getUserPermissions(req.user.tenantId, userId);
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar permissões do usuário ${userId}:`, error);
      throw new HttpException('Erro ao buscar permissões do usuário', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put('users/:userId')
  async updateUserPermissions(
    @Param('userId') userId: string,
    @Body() body: { permissions: PermissionUpdate[] },
    @Req() req: ExpressRequest & { user: any }
  ) {
    try {
      this.logger.log(`Atualizando permissões do usuário ${userId}`);
      
      if (!body.permissions || !Array.isArray(body.permissions)) {
        throw new HttpException('Lista de permissões é obrigatória', HttpStatus.BAD_REQUEST);
      }

      await this.permissionService.updateUserPermissions(
        req.user.tenantId,
        userId,
        body.permissions,
        req.user.id
      );

      return { success: true, message: 'Permissões atualizadas com sucesso' };

    } catch (error) {
      this.logger.error(`❌ Erro ao atualizar permissões do usuário ${userId}:`, error);
      throw new HttpException(
        error.message || 'Erro ao atualizar permissões do usuário', 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('check/:resource/:action')
  async checkPermission(
    @Req() req: ExpressRequest & { user: any },
    @Param('resource') resource: string,
    @Param('action') action: string
  ) {
    try {
      const hasPermission = await this.permissionService.hasPermission(
        req.user.tenantId,
        req.user.id,
        resource,
        action
      );

      return { 
        hasPermission,
        resource,
        action,
        userId: req.user.id
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao verificar permissão ${resource}:${action}:`, error);
      return { 
        hasPermission: false,
        resource,
        action,
        userId: req.user.id,
        error: 'Erro na verificação'
      };
    }
  }

  @Get('audit')
  async getPermissionAudit(
    @Req() req: ExpressRequest & { user: any },
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    try {
      this.logger.log('Buscando auditoria de permissões');

      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;

      return await this.permissionService.getPermissionAudit(
        req.user.tenantId,
        userId,
        start,
        end
      );

    } catch (error) {
      this.logger.error('❌ Erro ao buscar auditoria de permissões:', error);
      throw new HttpException('Erro ao buscar auditoria de permissões', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}