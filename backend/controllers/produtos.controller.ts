import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, HttpException, HttpStatus, UploadedFile, UseInterceptors, Logger } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '@core/guards/jwt-auth.guard';
import { PermissionGuard } from '../guards/permission.guard';
import { RequireProductsPermission } from '../decorators/require-permission.decorator';
import { ProdutosService } from '../services/produtos.service';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as path from 'path';

// Note: Removing @UseGuards from class level to allow Public access to uploads
@Controller('api/ordem_servico/produtos')
export class ProdutosController {
    private readonly logger = new Logger(ProdutosController.name);

    constructor(private readonly produtosService: ProdutosService) {
        this.logger.log('✅✅✅ PRODUTOS CONTROLLER INICIADO COM SISTEMA DE PERMISSÕES!!! ✅✅✅');
    }

    @Get()
    @UseGuards(JwtAuthGuard, PermissionGuard)
    @RequireProductsPermission('view')
    async findAll(@Query() filters: any, @Req() req: ExpressRequest & { user: any }) {
        const tenantId = req.user?.tenantId;
        return this.produtosService.findAll(tenantId, filters);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, PermissionGuard)
    @RequireProductsPermission('view')
    async findById(@Param('id') id: string, @Req() req: ExpressRequest & { user: any }) {
        const tenantId = req.user?.tenantId;
        return this.produtosService.findById(tenantId, id);
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
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file: any, @Req() req: ExpressRequest & { user: any }) {
        if (!file) {
            throw new HttpException('Nenhum arquivo enviado', HttpStatus.BAD_REQUEST);
        }

        try {
            // Validar tipo de arquivo
            const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            if (!allowedMimeTypes.includes(file.mimetype)) {
                throw new HttpException('Tipo de arquivo não permitido', HttpStatus.BAD_REQUEST);
            }

            // Validar tamanho (5MB)
            if (file.size > 5 * 1024 * 1024) {
                throw new HttpException('Arquivo muito grande. Máximo 5MB', HttpStatus.BAD_REQUEST);
            }

            // Recuperação e validação do Buffer
            let bufferData = file.buffer;
            
            // Verifica se "parece" um buffer, mas é um objeto (JSON)
            if (bufferData && typeof bufferData === 'object' && !Buffer.isBuffer(bufferData)) {
                const keys = Object.keys(bufferData);
                
                try {
                    // Cenário A: JSON representation { type: 'Buffer', data: [...] }
                    if (bufferData.type === 'Buffer' && Array.isArray(bufferData.data)) {
                        this.logger.log('Restaurando buffer do formato JSON padrão...');
                        bufferData = Buffer.from(bufferData.data);
                    }
                    // Cenário B: Object com chaves numéricas { '0': 255, '1': 10... }
                    else if (keys.length > 0 && keys.every(k => !isNaN(parseInt(k)))) {
                        this.logger.log('Restaurando buffer do formato Array-Like Object...');
                        const values = Object.values(bufferData) as number[];
                        bufferData = Buffer.from(values);
                    }
                } catch (e) {
                    this.logger.error(`Falha na recuperação do buffer: ${e.message}`);
                }
            }

            // Fallback: Ler do path se existir (caso Multer configure diferente)
            if ((!bufferData || !Buffer.isBuffer(bufferData)) && file.path) {
                this.logger.log(`Buffer inválido, usando fallback para path: ${file.path}`);
                bufferData = fs.readFileSync(file.path);
            }

            // Verificação final de integridade
            if (!Buffer.isBuffer(bufferData)) {
                throw new Error('Falha crítica: O arquivo não pôde ser processado (Buffer inválido).');
            }

            const tenantId = req.user?.tenantId || 'global';
            const uploadDir = path.resolve(process.cwd(), 'uploads', 'produtos', tenantId);
            
            // Criar diretório se não existir
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            // Gerar nome único
            const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
            const filePath = path.join(uploadDir, uniqueName);

            // Salvar arquivo
            fs.writeFileSync(filePath, bufferData);
            
            this.logger.log(`File uploaded successfully: ${uniqueName}`);
            
            const fileUrl = `/uploads/produtos/${tenantId}/${uniqueName}`;

            return { url: fileUrl };
        } catch (error) {
            this.logger.error('Erro no upload:', error);
            throw new HttpException(`Erro ao processar upload: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

}