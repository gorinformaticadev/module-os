import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Req, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ClientesService } from '../services/clientes.service';
import { JwtAuthGuard } from '@core/guards/jwt-auth.guard';
import { RolesGuard } from '@core/guards/roles.guard';
import { Roles } from '@core/decorators/roles.decorator';

@Controller('api/ordem_servico/clientes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientesController {
    private readonly logger = new Logger(ClientesController.name);

    constructor(private readonly clientesService: ClientesService) {
        console.log('✅✅✅ CLIENTES CONTROLLER INSTANCIADO!!! ✅✅✅');
    }

    @Get()
    @Roles('ADMIN', 'SUPER_ADMIN')
    async findAll(@Query() filters: any, @Req() req: ExpressRequest & { user: any }) {
        this.logger.log('📥 GET findAll chamado');
        const tenantId = req.user?.tenantId;
        try {
            const result = await this.clientesService.findAll(tenantId, filters);
            this.logger.log(`🔙 Retornando ${(result as any[]).length} clientes`);
            return result;
        } catch (error) {
            this.logger.error('❌ Erro no findAll:', error);
            throw new HttpException('Erro ao buscar clientes: ' + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get(':id')
    @Roles('ADMIN', 'SUPER_ADMIN')
    async findOne(@Param('id') id: string, @Req() req: ExpressRequest & { user: any }) {
        const tenantId = req.user?.tenantId;
        const client = await this.clientesService.findById(tenantId, id);
        if (!client) {
            throw new HttpException('Cliente não encontrado', HttpStatus.NOT_FOUND);
        }
        return client;
    }

    @Post()
    @Roles('ADMIN', 'SUPER_ADMIN')
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
    @Roles('ADMIN', 'SUPER_ADMIN')
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
    @Roles('ADMIN', 'SUPER_ADMIN')
    async remove(@Param('id') id: string, @Req() req: ExpressRequest & { user: any }) {
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id;
        return this.clientesService.delete(tenantId, id, userId);
    }
}