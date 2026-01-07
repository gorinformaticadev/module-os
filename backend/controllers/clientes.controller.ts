import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Req, HttpException, HttpStatus, Logger, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { Request as ExpressRequest, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as path from 'path';
import { ClientesService } from '../services/clientes.service';
import { JwtAuthGuard } from '../../../apps/backend/src/core/guards/jwt-auth.guard';
import { PermissionGuard } from '../guards/permission.guard';
import { RequireClientsPermission } from '../decorators/require-permission.decorator';
import { Public } from '../../../apps/backend/src/core/common/decorators/public.decorator';

@Controller('api/ordem_servico/clientes')
export class ClientesController {
    private readonly logger = new Logger(ClientesController.name);

    constructor(private readonly clientesService: ClientesService) {
        this.logger.log('✅✅✅ CLIENTES CONTROLLER INICIADO COM SISTEMA DE PERMISSÕES!!! ✅✅✅');
        this.logger.log('🔍 Constructor: ClientesService injetado com sucesso');
    }

    @Get('test')
    async test() {
        this.logger.log('🔍 Test endpoint chamado');
        return { message: 'ClientesController funcionando!' };
    }

    @Get()
    @UseGuards(JwtAuthGuard, PermissionGuard)
    @RequireClientsPermission('view')
    async findAll(@Query() filters: any, @Req() req: ExpressRequest & { user: any }) {
        try {
            this.logger.log(`🔍 ClientesController.findAll chamado`);
            this.logger.log(`🔍 Query params recebidos: ${JSON.stringify(filters)}`);
            
            const tenantId = req.user?.tenantId;
            this.logger.log(`🔍 TenantId: ${tenantId}`);
            
            const result = await this.clientesService.findAll(tenantId, filters);
            this.logger.log(`🔍 Resultado obtido do service: ${JSON.stringify(result)}`);
            return result;
        } catch (error) {
            this.logger.error(`❌ Erro no controller findAll: ${error.message}`);
            this.logger.error(`❌ Stack trace: ${error.stack}`);
            throw error;
        }
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, PermissionGuard)
    @RequireClientsPermission('view')
    async findById(@Param('id') id: string, @Req() req: ExpressRequest & { user: any }) {
        const tenantId = req.user?.tenantId;
        return this.clientesService.findById(tenantId, id);
    }

    @Post()
    @UseGuards(JwtAuthGuard, PermissionGuard)
    @RequireClientsPermission('create')
    async create(@Body() data: any, @Req() req: ExpressRequest & { user: any }) {
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id;
        return this.clientesService.create(tenantId, data, userId);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard, PermissionGuard)
    @RequireClientsPermission('edit')
    async update(@Param('id') id: string, @Body() data: any, @Req() req: ExpressRequest & { user: any }) {
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id;
        return this.clientesService.update(tenantId, id, data, userId);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, PermissionGuard)
    @RequireClientsPermission('delete')
    async delete(@Param('id') id: string, @Req() req: ExpressRequest & { user: any }) {
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id;
        return this.clientesService.delete(tenantId, id, userId);
    }

    @Post('upload')
    @UseGuards(JwtAuthGuard, PermissionGuard)
    @RequireClientsPermission('upload_images')
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
            const uploadDir = path.resolve(process.cwd(), 'uploads', 'clientes', tenantId);
            
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
            
            const fileUrl = `/uploads/clientes/${tenantId}/${uniqueName}`;

            return { url: fileUrl };
        } catch (error) {
            this.logger.error('Erro no upload:', error);
            throw new HttpException(`Erro ao processar upload: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get('uploads/:tenantId/:filename')
    @Public()
    async serveFile(@Param('filename') filename: string, @Param('tenantId') tenantId: string, @Res() res: Response) {
        try {
            const filePath = path.resolve(process.cwd(), 'uploads', 'clientes', tenantId, filename);

            if (!filePath.startsWith(path.resolve(process.cwd(), 'uploads', 'clientes'))) {
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