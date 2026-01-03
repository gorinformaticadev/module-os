import { 
  Controller, 
  Get, 
  Post,
  Put,
  Delete,
  Body, 
  Param, 
  UseGuards, 
  Req, 
  Logger,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '@core/guards/jwt-auth.guard';
import { TemplateService } from '../services/template.service';
import { TemplatePermission } from '../interfaces/template.interface';

@Controller('modules/ordem_servico/templates')
@UseGuards(JwtAuthGuard)
export class TemplateController {
  private readonly logger = new Logger(TemplateController.name);

  constructor(private readonly templateService: TemplateService) {}

  @Get()
  async getAllTemplates() {
    try {
      this.logger.log('Buscando todos os templates');
      return await this.templateService.getAllTemplates();
    } catch (error) {
      this.logger.error('❌ Erro ao buscar templates:', error);
      throw new HttpException('Erro ao buscar templates', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':templateId')
  async getTemplateWithPermissions(@Param('templateId') templateId: string) {
    try {
      this.logger.log(`Buscando template ${templateId} com permissões`);
      return await this.templateService.getTemplateWithPermissions(templateId);
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar template ${templateId}:`, error);
      
      if (error.message.includes('não encontrado')) {
        throw new HttpException('Template não encontrado', HttpStatus.NOT_FOUND);
      }
      
      throw new HttpException('Erro ao buscar template', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post(':templateId/apply/:userId')
  async applyTemplateToUser(
    @Param('templateId') templateId: string,
    @Param('userId') userId: string,
    @Req() req: ExpressRequest & { user: any }
  ) {
    try {
      this.logger.log(`Aplicando template ${templateId} ao usuário ${userId}`);
      
      await this.templateService.applyTemplateToUser(
        req.user.tenantId,
        userId,
        templateId,
        req.user.id
      );

      return { 
        success: true, 
        message: 'Template aplicado com sucesso',
        templateId,
        userId
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao aplicar template ${templateId} ao usuário ${userId}:`, error);
      
      if (error.message.includes('não encontrado')) {
        throw new HttpException('Template não encontrado', HttpStatus.NOT_FOUND);
      }
      
      throw new HttpException(
        error.message || 'Erro ao aplicar template', 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post()
  async createCustomTemplate(
    @Body() body: {
      name: string;
      description: string;
      permissions: TemplatePermission[];
    }
  ) {
    try {
      this.logger.log(`Criando template customizado: ${body.name}`);
      
      if (!body.name || !body.description) {
        throw new HttpException('Nome e descrição são obrigatórios', HttpStatus.BAD_REQUEST);
      }

      if (!body.permissions || !Array.isArray(body.permissions)) {
        throw new HttpException('Lista de permissões é obrigatória', HttpStatus.BAD_REQUEST);
      }

      const template = await this.templateService.createCustomTemplate(
        body.name,
        body.description,
        body.permissions
      );

      return {
        success: true,
        message: 'Template criado com sucesso',
        template
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao criar template customizado:`, error);
      
      if (error.message.includes('já existe')) {
        throw new HttpException('Já existe um template com este nome', HttpStatus.CONFLICT);
      }
      
      throw new HttpException(
        error.message || 'Erro ao criar template', 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put(':templateId')
  async updateTemplate(
    @Param('templateId') templateId: string,
    @Body() body: { permissions: TemplatePermission[] }
  ) {
    try {
      this.logger.log(`Atualizando template ${templateId}`);
      
      if (!body.permissions || !Array.isArray(body.permissions)) {
        throw new HttpException('Lista de permissões é obrigatória', HttpStatus.BAD_REQUEST);
      }

      await this.templateService.updateTemplate(templateId, body.permissions);

      return {
        success: true,
        message: 'Template atualizado com sucesso',
        templateId
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao atualizar template ${templateId}:`, error);
      
      if (error.message.includes('não encontrado')) {
        throw new HttpException('Template não encontrado', HttpStatus.NOT_FOUND);
      }
      
      if (error.message.includes('sistema não podem ser editados')) {
        throw new HttpException('Templates do sistema não podem ser editados', HttpStatus.FORBIDDEN);
      }
      
      throw new HttpException(
        error.message || 'Erro ao atualizar template', 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':templateId')
  async deleteTemplate(@Param('templateId') templateId: string) {
    try {
      this.logger.log(`Excluindo template ${templateId}`);
      
      await this.templateService.deleteTemplate(templateId);

      return {
        success: true,
        message: 'Template excluído com sucesso',
        templateId
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao excluir template ${templateId}:`, error);
      
      if (error.message.includes('não encontrado')) {
        throw new HttpException('Template não encontrado', HttpStatus.NOT_FOUND);
      }
      
      if (error.message.includes('sistema não podem ser excluídos')) {
        throw new HttpException('Templates do sistema não podem ser excluídos', HttpStatus.FORBIDDEN);
      }
      
      throw new HttpException(
        error.message || 'Erro ao excluir template', 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}