import {
  BadGatewayException,
  BadRequestException,
  Controller,
  Delete,
  Get,
  Body,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  Logger,
  Res,
} from '@nestjs/common';
import { Request as ExpressRequest, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import { JwtAuthGuard } from '@core/common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../shared/guards/permission.guard';
import { RequireClientsPermission } from '../../shared/decorators/require-permission.decorator';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { ClientesService } from './clientes.service';
import {
  assertTenantUploadAccess,
  buildTenantModuleUploadUrl,
  ORDEM_SERVICO_UPLOAD_OPTIONS,
  persistTenantModuleUpload,
  resolveTenantModuleUploadPath,
} from '../../shared/utils/upload-security.util';

@Controller('ordem_servico/clientes')
@Permissions('ordem_servico.clients')
export class ClientesController {
  private readonly logger = new Logger(ClientesController.name);

  constructor(private readonly clientesService: ClientesService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequireClientsPermission('view')
  async findAll(@Query() filters: any) {
    return this.clientesService.findAll(filters);
  }

  @Get('cep/:cep')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequireClientsPermission('view')
  async lookupCep(@Param('cep') cep: string) {
    try {
      return await this.clientesService.lookupCep(cep);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof BadGatewayException) {
        throw error;
      }

      this.logger.error(`Erro ao consultar CEP ${cep}`, error as Error);
      throw new BadGatewayException('Nao foi possivel consultar o CEP.');
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequireClientsPermission('view_details')
  async findById(@Param('id') id: string) {
    return this.clientesService.findById(id);
  }

  @Get('uploads/:tenantId/:filename')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequireClientsPermission('view')
  async serveFile(
    @Param('filename') filename: string,
    @Param('tenantId') tenantId: string,
    @Req() req: ExpressRequest & { user: any },
    @Res() res: Response,
  ) {
    try {
      assertTenantUploadAccess(String(req.user?.tenantId || ''), tenantId);
      const filePath = resolveTenantModuleUploadPath('clientes', tenantId, filename);

      if (fs.existsSync(filePath)) {
        res.setHeader('Cache-Control', 'private, max-age=300');
        res.sendFile(filePath);
        return;
      }

      res.status(404).json({ message: 'Arquivo nao encontrado' });
    } catch (error) {
      this.logger.error('Erro ao servir imagem do cliente', error as Error);
      if (error instanceof HttpException) {
        throw error;
      }
      res.status(500).json({ message: 'Erro interno ao buscar imagem' });
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequireClientsPermission('create')
  async create(@Body() data: any) {
    return this.clientesService.create(data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequireClientsPermission('edit')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.clientesService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequireClientsPermission('delete')
  async delete(@Param('id') id: string) {
    return this.clientesService.delete(id);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequireClientsPermission('upload_images')
  @UseInterceptors(FileInterceptor('file', ORDEM_SERVICO_UPLOAD_OPTIONS))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req: ExpressRequest & { user: any }) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }

    try {
      const tenantId = String(req.user?.tenantId || '').trim();
      if (!tenantId) {
        throw new BadRequestException('Tenant invalido para upload');
      }

      const persistedUpload = persistTenantModuleUpload('clientes', tenantId, file);
      return { url: buildTenantModuleUploadUrl('clientes', tenantId, persistedUpload.fileName) };
    } catch (error: any) {
      this.logger.error('Erro no upload de imagem do cliente', error as Error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(`Erro ao processar upload: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
