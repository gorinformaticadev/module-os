import {
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
import { JwtAuthGuard } from '@core/common/guards/jwt-auth.guard';
import { PermissionGuard } from '../shared/guards/permission.guard';
import { RequireProductsPermission } from '../shared/decorators/require-permission.decorator';
import { ProdutosService } from './produtos.service';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import {
  assertTenantUploadAccess,
  buildTenantModuleUploadUrl,
  ORDEM_SERVICO_UPLOAD_OPTIONS,
  persistTenantModuleUpload,
  resolveTenantModuleUploadPath,
} from '../shared/utils/upload-security.util';

@Controller('ordem_servico/produtos')
export class ProdutosController {
  private readonly logger = new Logger(ProdutosController.name);

  constructor(private readonly produtosService: ProdutosService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequireProductsPermission('view')
  async findAll(@Query() filters: any, @Req() req: ExpressRequest & { user: any }) {
    return this.produtosService.findAll(req.user?.tenantId, filters);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequireProductsPermission('view')
  async findById(@Param('id') id: string, @Req() req: ExpressRequest & { user: any }) {
    return this.produtosService.findById(req.user?.tenantId, id);
  }

  @Get('uploads/:tenantId/:filename')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequireProductsPermission('view')
  async serveFile(
    @Param('filename') filename: string,
    @Param('tenantId') tenantId: string,
    @Req() req: ExpressRequest & { user: any },
    @Res() res: Response,
  ) {
    try {
      assertTenantUploadAccess(String(req.user?.tenantId || ''), tenantId);
      const filePath = resolveTenantModuleUploadPath('produtos', tenantId, filename);

      if (fs.existsSync(filePath)) {
        res.setHeader('Cache-Control', 'private, max-age=300');
        res.sendFile(filePath);
        return;
      }

      res.status(404).json({ message: 'Arquivo nao encontrado' });
    } catch (error) {
      this.logger.error('Erro ao servir imagem do produto', error as Error);
      if (error instanceof HttpException) {
        throw error;
      }
      res.status(500).json({ message: 'Erro interno ao buscar imagem' });
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequireProductsPermission('create')
  async create(@Body() data: any, @Req() req: ExpressRequest & { user: any }) {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    return this.produtosService.create(tenantId, data, userId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequireProductsPermission('edit')
  async update(@Param('id') id: string, @Body() data: any, @Req() req: ExpressRequest & { user: any }) {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    return this.produtosService.update(tenantId, id, data, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequireProductsPermission('delete')
  async delete(@Param('id') id: string, @Req() req: ExpressRequest & { user: any }) {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    return this.produtosService.delete(tenantId, id, userId);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequireProductsPermission('upload_images')
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

      const persistedUpload = persistTenantModuleUpload('produtos', tenantId, file);
      return { url: buildTenantModuleUploadUrl('produtos', tenantId, persistedUpload.fileName) };
    } catch (error: any) {
      this.logger.error('Erro no upload de imagem do produto', error as Error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(`Erro ao processar upload: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
