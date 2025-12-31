
import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Req, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ProdutosService } from '../services/produtos.service';
import { JwtAuthGuard } from '@core/guards/jwt-auth.guard';
import { RolesGuard } from '@core/guards/roles.guard';
import { Roles } from '@core/decorators/roles.decorator';

@Controller('api/ordem_servico/produtos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProdutosController {
    private readonly logger = new Logger(ProdutosController.name);

    constructor(private readonly produtosService: ProdutosService) { }

    @Get()
    @Roles('ADMIN', 'SUPER_ADMIN') // Ajustar para 'ATENDENTE', 'TECNICO' quando enum estiver corrigido
    async findAll(@Query() filters: any, @Req() req) {
        const tenantId = req.user?.tenantId;
        return this.produtosService.findAll(tenantId, filters);
    }

    @Get(':id')
    @Roles('ADMIN', 'SUPER_ADMIN')
    async findOne(@Param('id') id: string, @Req() req) {
        const tenantId = req.user?.tenantId;
        const product = await this.produtosService.findById(tenantId, id);
        if (!product) {
            throw new HttpException('Produto não encontrado', HttpStatus.NOT_FOUND);
        }
        return product;
    }

    @Post()
    @Roles('ADMIN', 'SUPER_ADMIN')
    async create(@Body() data: any, @Req() req) {
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id;
        try {
            return await this.produtosService.create(tenantId, data, userId);
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    @Put(':id')
    @Roles('ADMIN', 'SUPER_ADMIN')
    async update(@Param('id') id: string, @Body() data: any, @Req() req) {
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id;
        try {
            return await this.produtosService.update(tenantId, id, data, userId);
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    @Delete(':id')
    @Roles('ADMIN', 'SUPER_ADMIN')
    async remove(@Param('id') id: string, @Req() req) {
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id;
        return this.produtosService.delete(tenantId, id, userId);
    }
}
