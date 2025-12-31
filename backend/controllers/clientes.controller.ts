import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Req, HttpException, HttpStatus } from '@nestjs/common';
import { ClientesService } from '../services/clientes.service';
import { JwtAuthGuard } from '@core/guards/jwt-auth.guard';
import { RolesGuard } from '@core/guards/roles.guard';
import { Roles } from '@core/decorators/roles.decorator';

@Controller('api/ordem_servico/clientes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientesController {
    constructor(private readonly clientesService: ClientesService) { }

    @Get()
    @Roles('ADMIN', 'SUPER_ADMIN', 'ATENDENTE', 'TECNICO')
    async findAll(@Query() filters: any, @Req() req) {
        const tenantId = req.user?.tenantId;
        return this.clientesService.findAll(tenantId, filters);
    }

    @Get(':id')
    @Roles('ADMIN', 'SUPER_ADMIN', 'ATENDENTE', 'TECNICO')
    async findOne(@Param('id') id: string, @Req() req) {
        const tenantId = req.user?.tenantId;
        const client = await this.clientesService.findById(tenantId, id);
        if (!client) {
            throw new HttpException('Cliente não encontrado', HttpStatus.NOT_FOUND);
        }
        return client;
    }

    @Post()
    @Roles('ADMIN', 'SUPER_ADMIN', 'ATENDENTE', 'TECNICO')
    async create(@Body() data: any, @Req() req) {
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id;
        try {
            return await this.clientesService.create(tenantId, data, userId);
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    @Put(':id')
    @Roles('ADMIN', 'SUPER_ADMIN', 'ATENDENTE', 'TECNICO')
    async update(@Param('id') id: string, @Body() data: any, @Req() req) {
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
    async remove(@Param('id') id: string, @Req() req) {
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id;
        return this.clientesService.delete(tenantId, id, userId);
    }
}
