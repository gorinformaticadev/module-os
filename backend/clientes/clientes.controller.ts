import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Req, HttpException, HttpStatus, Logger, UseInterceptors, UploadedFile, Res, BadRequestException } from '@nestjs/common';
import { Request as ExpressRequest, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as path from 'path';
import { ClientesService } from './clientes.service';
import { JwtAuthGuard } from '@core/common/guards/jwt-auth.guard';
import { PermissionGuard } from '../shared/guards/permission.guard';
import { RequireClientsPermission } from '../shared/decorators/require-permission.decorator';
import { Public } from '@core/common/decorators/public.decorator';

@Controller('api/ordem_servico/clientes')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ClientesController {
    private readonly logger = new Logger(ClientesController.name);

    constructor(private readonly clientesService: ClientesService) {
        console.log('✅✅✅ CLIENTES CONTROLLER INSTANCIADO COM SISTEMA DE PERMISSÕES!!! ✅✅✅');
    }

    @Get()
    @RequireClientsPermission('view')
    async findAll(
        @Query('search') search: string,
        @Req() req: ExpressRequest & { user: any }
    ) {
        const tenantId = req.user?.tenantId;
        return this.clientesService.findAll(tenantId, search);
    }

    @Get(':id')
    @RequireClientsPermission('view_details')
    async findOne(@Param('id') id: string, @Req() req: ExpressRequest & { user: any }) {
        const tenantId = req.user?.tenantId;
        const client = await this.clientesService.findById(tenantId, id);
        if (!client) {
            throw new HttpException('Cliente não encontrado', HttpStatus.NOT_FOUND);
        }
        return client;
    }

    @Post()
    @RequireClientsPermission('create')
    async create(@Body() data: any, @Req() req: ExpressRequest & { user: any }) {
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id;
        try {
            return await this.clientesService.create(tenantId, data, userId);
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    @Put(':id')
    @RequireClientsPermission('edit')
    async update(@Param('id') id: string, @Body() data: any, @Req() req: ExpressRequest & { user: any }) {
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id;
        try {
            return await this.clientesService.update(tenantId, id, data, userId);
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    @Delete(':id')
    @RequireClientsPermission('delete')
    async remove(@Param('id') id: string, @Req() req: ExpressRequest & { user: any }) {
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id;
        return this.clientesService.delete(tenantId, id, userId);
    }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file: any, @Req() req: ExpressRequest & { user: any }) {
        try {
            if (!file) {
                throw new BadRequestException('Nenhum arquivo enviado');
            }

            // 1. Recuperação e Validação do Buffer
            let bufferData = file.buffer;

            if (bufferData && typeof bufferData === 'object' && !Buffer.isBuffer(bufferData)) {
                if (bufferData.type === 'Buffer' && Array.isArray(bufferData.data)) {
                    bufferData = Buffer.from(bufferData.data);
                } else {
                    const values = Object.values(bufferData) as number[];
                    bufferData = Buffer.from(values);
                }
            }

            if ((!bufferData || !Buffer.isBuffer(bufferData)) && file.path) {
                bufferData = fs.readFileSync(file.path);
            }

            if (!Buffer.isBuffer(bufferData)) {
                throw new Error('Falha crítica: Buffer inválido.');
            }

            // 2. Caminho Seguro e Isolado por Tenant
            const tenantId = req.user?.tenantId || 'global';
            const uploadDir = path.resolve(process.cwd(), 'uploads', 'modules', 'ordem_servico', 'clientes', tenantId);

            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

            // 3. Salvar Arquivo
            const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
            const filePath = path.join(uploadDir, uniqueName);
            fs.writeFileSync(filePath, bufferData);

            // 4. Retornar URL Pública
            return { url: `/api/ordem_servico/clientes/uploads/${tenantId}/${uniqueName}` };
        } catch (error) {
            this.logger.error('Erro no upload de foto do cliente:', error);
            throw new HttpException('Erro ao processar upload: ' + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get('uploads/:tenantId/:filename')
    @Public()
    async serveFile(@Param('filename') filename: string, @Param('tenantId') tenantId: string, @Res() res: Response) {
        try {
            const filePath = path.resolve(process.cwd(), 'uploads', 'modules', 'ordem_servico', 'clientes', tenantId, filename);

            if (!filePath.startsWith(path.resolve(process.cwd(), 'uploads', 'modules', 'ordem_servico', 'clientes'))) {
                return res.status(403).json({ message: 'Acesso negado' });
            }

            if (fs.existsSync(filePath)) {
                res.sendFile(filePath);
            } else {
                res.status(404).json({ message: 'Arquivo não encontrado' });
            }
        } catch (error) {
            this.logger.error('Erro ao servir arquivo:', error);
            res.status(500).json({ message: 'Erro interno ao buscar imagem' });
        }
    }
}