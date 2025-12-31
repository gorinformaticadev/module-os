import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, HttpException, HttpStatus, UploadedFile, UseInterceptors, Res, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '@core/guards/jwt-auth.guard';
import { RolesGuard } from '@core/guards/roles.guard';
import { Roles } from '@core/decorators/roles.decorator';
import { Public } from '@core/decorators/public.decorator'; // Import Public decorator
import { ProdutosService } from '../services/produtos.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

// Note: Removing @UseGuards from class level to allow Public access to uploads
@Controller('api/ordem_servico/produtos')
export class ProdutosController {
    private readonly logger = new Logger(ProdutosController.name);

    constructor(private readonly produtosService: ProdutosService) {
        this.logger.log('✅✅✅ PRODUTOS CONTROLLER INICIADO (Serve Fix)!!! ✅✅✅');
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'SUPER_ADMIN')
    async findAll(@Query() filters: any, @Req() req) {
        const tenantId = req.user?.tenantId;
        return this.produtosService.findAll(tenantId, filters);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'SUPER_ADMIN')
    async findById(@Param('id') id: string, @Req() req) {
        const tenantId = req.user?.tenantId;
        return this.produtosService.findById(tenantId, id);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'SUPER_ADMIN')
    async create(@Body() data: any, @Req() req) {
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id;
        return this.produtosService.create(tenantId, data, userId);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'SUPER_ADMIN')
    async update(@Param('id') id: string, @Body() data: any, @Req() req) {
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id;
        return this.produtosService.update(tenantId, id, data, userId);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'SUPER_ADMIN')
    async delete(@Param('id') id: string, @Req() req) {
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id;
        return this.produtosService.delete(tenantId, id, userId);
    }

    @Post('upload')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'SUPER_ADMIN')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file: any, @Req() req) {
        if (!file) {
            throw new HttpException('Nenhum arquivo enviado', HttpStatus.BAD_REQUEST);
        }

        try {
            this.logger.log(`Processing upload: ${file.originalname}`);

            let bufferData = file.buffer;

            // ⚠️ HIGH LEVEL DIAGNOSTICS & RECOVERY
            if (bufferData && typeof bufferData === 'object' && !Buffer.isBuffer(bufferData)) {
                // Squelch error log if recovery works to reduce panic, but log info
                const keys = Object.keys(bufferData);

                try {
                    // Scenario A: JSON representation { type: 'Buffer', data: [...] }
                    if (bufferData.type === 'Buffer' && Array.isArray(bufferData.data)) {
                        this.logger.log('Restoring from standard JSON Buffer...');
                        bufferData = Buffer.from(bufferData.data);
                    }
                    // Scenario B: Object with numeric keys { '0': 255, '1': 10... }
                    else if (keys.length > 0 && keys.every(k => !isNaN(parseInt(k)))) {
                        this.logger.log('Restoring from Array-Like Object...');
                        const values = Object.values(bufferData) as number[];
                        bufferData = Buffer.from(values);
                    }
                } catch (e) {
                    this.logger.error(`Recovery attempt failed: ${e.message}`);
                }
            }

            // Fallback: Read from path if exists
            if ((!bufferData || !Buffer.isBuffer(bufferData)) && file.path) {
                this.logger.log(`Buffer invalid, fallback to file path: ${file.path}`);
                bufferData = fs.readFileSync(file.path);
            }

            // Final integrity check
            if (!Buffer.isBuffer(bufferData)) {
                throw new Error('Falha crítica: O arquivo não pôde ser processado (Buffer inválido).');
            }

            const tenantId = req.user?.tenantId || 'global';
            // Secure Path
            const uploadDir = path.resolve(process.cwd(), 'uploads', 'modules', 'ordem_servico', tenantId);

            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
            const filePath = path.join(uploadDir, uniqueName);

            fs.writeFileSync(filePath, bufferData);
            this.logger.log(`File saved success: ${filePath}`);

            const fileUrl = `/api/ordem_servico/produtos/uploads/${tenantId}/${uniqueName}`;

            return { url: fileUrl };
        } catch (error) {
            this.logger.error('Erro detalhado no upload:', error);
            throw new HttpException(`Erro ao processar upload: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get('uploads/:tenantId/:filename')
    @Public() // Explicitly mark as Public to bypass Global Guards
    async serveFile(@Param('filename') filename: string, @Param('tenantId') tenantId: string, @Res() res: Response) {
        this.logger.log(`Serve File Request: Tenant=${tenantId}, File=${filename}`);

        const filePath = path.resolve(process.cwd(), 'uploads', 'modules', 'ordem_servico', tenantId, filename);

        if (!filePath.startsWith(path.resolve(process.cwd(), 'uploads', 'modules', 'ordem_servico'))) {
            this.logger.warn(`Access Denied (Traversal): ${filePath}`);
            return res.status(403).json({ message: 'Acesso negado' });
        }

        if (fs.existsSync(filePath)) {
            res.sendFile(filePath);
        } else {
            this.logger.warn(`File Not Found: ${filePath}`);
            res.status(404).json({ message: 'Arquivo não encontrado' });
        }
    }
}
