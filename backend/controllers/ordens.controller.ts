import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, Logger, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '@core/guards/jwt-auth.guard';
import { OrdensService } from '../services/ordens.service';
import { CreateOrdemServicoDTO, UpdateOrdemServicoDTO, OrdemServicoFilters } from '../dto/ordem-servico.dto';

@Controller('api/ordem_servico/ordens')
@UseGuards(JwtAuthGuard)
export class OrdensController {
    private readonly logger = new Logger(OrdensController.name);

    constructor(private readonly ordensService: OrdensService) {
        console.log('✅✅✅ ORDENS CONTROLLER INSTANCIADO (STANDALONE)!!! ✅✅✅');
    }

    @Get()
    async findAll(
        @Req() req: ExpressRequest & { user: any },
        @Query() filters: OrdemServicoFilters
    ) {
        try {
            this.logger.log(`Buscando ordens de serviço. Tenant: ${req.user?.tenantId}`);
            return await this.ordensService.findAll(req.user.tenantId, filters);
        } catch (error) {
            this.logger.error(`Erro ao buscar ordens de serviço:`, error);
            throw error;
        }
    }

    @Get('dashboard')
    async getDashboardData(@Req() req: ExpressRequest & { user: any }) {
        try {
            this.logger.log(`Buscando dados do dashboard. Tenant: ${req.user?.tenantId}`);
            return await this.ordensService.getDashboardData(req.user.tenantId);
        } catch (error) {
            this.logger.error(`Erro ao buscar dados do dashboard:`, error);
            throw error;
        }
    }

    @Get(':id')
    async findOne(
        @Req() req: ExpressRequest & { user: any },
        @Param('id') id: string
    ) {
        try {
            this.logger.log(`Buscando ordem de serviço ${id}. Tenant: ${req.user?.tenantId}`);
            const ordem = await this.ordensService.findOne(req.user.tenantId, id);
            
            if (!ordem) {
                throw new NotFoundException('Ordem de serviço não encontrada');
            }
            
            return ordem;
        } catch (error) {
            this.logger.error(`Erro ao buscar ordem de serviço ${id}:`, error);
            throw error;
        }
    }

    @Get(':id/historico')
    async getHistorico(
        @Req() req: ExpressRequest & { user: any },
        @Param('id') id: string
    ) {
        try {
            this.logger.log(`Buscando histórico da ordem ${id}. Tenant: ${req.user?.tenantId}`);
            return await this.ordensService.getHistorico(req.user.tenantId, id);
        } catch (error) {
            this.logger.error(`Erro ao buscar histórico da ordem ${id}:`, error);
            throw error;
        }
    }

    @Post()
    async create(
        @Req() req: ExpressRequest & { user: any },
        @Body() createDto: CreateOrdemServicoDTO
    ) {
        try {
            this.logger.log(`Criando nova ordem de serviço. Tenant: ${req.user?.tenantId}`);
            
            // Validar se o cliente está ativo
            const clienteAtivo = await this.ordensService.isClienteAtivo(req.user.tenantId, createDto.cliente_id);
            if (!clienteAtivo) {
                throw new BadRequestException('Cliente inativo não pode abrir ordem de serviço');
            }
            
            return await this.ordensService.create(req.user.tenantId, req.user.id, createDto);
        } catch (error) {
            this.logger.error(`Erro ao criar ordem de serviço:`, error);
            throw error;
        }
    }

    @Put(':id')
    async update(
        @Req() req: ExpressRequest & { user: any },
        @Param('id') id: string,
        @Body() updateDto: UpdateOrdemServicoDTO
    ) {
        try {
            this.logger.log(`Atualizando ordem de serviço ${id}. Tenant: ${req.user?.tenantId}`);
            
            // Verificar se a ordem existe e pertence ao tenant
            const ordem = await this.ordensService.findOne(req.user.tenantId, id);
            if (!ordem) {
                throw new NotFoundException('Ordem de serviço não encontrada');
            }
            
            // Verificar se a ordem pode ser editada
            if (ordem.status === 6 || ordem.status === 7) { // FINALIZADA ou CANCELADA
                throw new ForbiddenException('Ordem de serviço finalizada ou cancelada não pode ser editada');
            }
            
            return await this.ordensService.update(req.user.tenantId, req.user.id, id, updateDto);
        } catch (error) {
            this.logger.error(`Erro ao atualizar ordem de serviço ${id}:`, error);
            throw error;
        }
    }

    @Put(':id/status')
    async updateStatus(
        @Req() req: ExpressRequest & { user: any },
        @Param('id') id: string,
        @Body() body: { status: number; motivo_cancelamento?: string; observacoes?: string }
    ) {
        try {
            this.logger.log(`Atualizando status da ordem ${id} para ${body.status}. Tenant: ${req.user?.tenantId}`);
            
            // Verificar se a ordem existe
            const ordem = await this.ordensService.findOne(req.user.tenantId, id);
            if (!ordem) {
                throw new NotFoundException('Ordem de serviço não encontrada');
            }
            
            // Validar transição de status
            const transicaoValida = await this.ordensService.validarTransicaoStatus(ordem.status, body.status);
            if (!transicaoValida) {
                throw new BadRequestException(`Transição de status inválida: ${ordem.status} → ${body.status}`);
            }
            
            // Se for cancelamento, motivo é obrigatório
            if (body.status === 7 && !body.motivo_cancelamento) {
                throw new BadRequestException('Motivo do cancelamento é obrigatório');
            }
            
            // Se for finalização, validar se pode finalizar
            if (body.status === 6) {
                if (ordem.status !== 5) { // EM_EXECUCAO
                    throw new BadRequestException('Só é possível finalizar ordens em execução');
                }
                if (!ordem.valor_servico || ordem.valor_servico <= 0) {
                    throw new BadRequestException('Valor do serviço deve estar definido para finalizar');
                }
            }
            
            return await this.ordensService.updateStatus(
                req.user.tenantId, 
                req.user.id, 
                id, 
                body.status, 
                body.motivo_cancelamento,
                body.observacoes
            );
        } catch (error) {
            this.logger.error(`Erro ao atualizar status da ordem ${id}:`, error);
            throw error;
        }
    }

    @Delete(':id')
    async remove(
        @Req() req: ExpressRequest & { user: any },
        @Param('id') id: string
    ) {
        try {
            this.logger.log(`Excluindo ordem de serviço ${id}. Tenant: ${req.user?.tenantId}`);
            
            // Verificar se a ordem existe
            const ordem = await this.ordensService.findOne(req.user.tenantId, id);
            if (!ordem) {
                throw new NotFoundException('Ordem de serviço não encontrada');
            }
            
            // Só permite excluir se for orçamento ou se for admin
            if (ordem.status !== 0 && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
                throw new ForbiddenException('Apenas orçamentos podem ser excluídos por usuários não-admin');
            }
            
            return await this.ordensService.remove(req.user.tenantId, req.user.id, id);
        } catch (error) {
            this.logger.error(`Erro ao excluir ordem de serviço ${id}:`, error);
            throw error;
        }
    }

    @Post(':id/aprovar-orcamento')
    async aprovarOrcamento(
        @Req() req: ExpressRequest & { user: any },
        @Param('id') id: string
    ) {
        try {
            this.logger.log(`Aprovando orçamento ${id}. Tenant: ${req.user?.tenantId}`);
            
            const ordem = await this.ordensService.findOne(req.user.tenantId, id);
            if (!ordem) {
                throw new NotFoundException('Ordem de serviço não encontrada');
            }
            
            if (ordem.status !== 0) { // ORCAMENTO
                throw new BadRequestException('Apenas orçamentos podem ser aprovados');
            }
            
            return await this.ordensService.aprovarOrcamento(req.user.tenantId, req.user.id, id);
        } catch (error) {
            this.logger.error(`Erro ao aprovar orçamento ${id}:`, error);
            throw error;
        }
    }
}