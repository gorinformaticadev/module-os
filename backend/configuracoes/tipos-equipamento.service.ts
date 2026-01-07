import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';

@Injectable()
export class TiposEquipamentoService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    const tipos = await this.prisma.$queryRaw`
      SELECT id, nome, created_at
      FROM mod_ordem_servico_tipos_equipamento
      WHERE tenant_id = ${tenantId}
      ORDER BY nome ASC
    `;

    return tipos;
  }

  async findOne(tenantId: string, id: string) {
    const tipo = await this.prisma.$queryRaw`
      SELECT id, nome, created_at
      FROM mod_ordem_servico_tipos_equipamento
      WHERE tenant_id = ${tenantId} AND id = ${id}::uuid
    `;

    if (!tipo || (Array.isArray(tipo) && tipo.length === 0)) {
      throw new NotFoundException('Tipo de equipamento não encontrado');
    }

    return Array.isArray(tipo) ? tipo[0] : tipo;
  }

  async create(tenantId: string, createDto: any) {
    const { nome } = createDto;

    if (!nome || nome.trim() === '') {
      throw new BadRequestException('Nome é obrigatório');
    }

    // Verificar se já existe um tipo com o mesmo nome
    const existing = await this.prisma.$queryRaw`
      SELECT id FROM mod_ordem_servico_tipos_equipamento
      WHERE tenant_id = ${tenantId} AND LOWER(nome) = LOWER(${nome.trim()})
    `;

    if (existing && Array.isArray(existing) && existing.length > 0) {
      throw new BadRequestException('Já existe um tipo de equipamento com este nome');
    }

    const result = await this.prisma.$queryRaw`
      INSERT INTO mod_ordem_servico_tipos_equipamento (tenant_id, nome)
      VALUES (${tenantId}, ${nome.trim()})
      RETURNING id, nome, created_at
    `;

    return Array.isArray(result) ? result[0] : result;
  }

  async update(tenantId: string, id: string, updateDto: any) {
    const { nome } = updateDto;

    // Verificar se o tipo existe
    const existing = await this.findOne(tenantId, id);
    
    if (!existing) {
      throw new NotFoundException('Tipo de equipamento não encontrado');
    }

    if (!nome || nome.trim() === '') {
      throw new BadRequestException('Nome é obrigatório');
    }

    // Se está alterando o nome, verificar duplicatas
    if (nome.trim() !== existing.nome) {
      const duplicate = await this.prisma.$queryRaw`
        SELECT id FROM mod_ordem_servico_tipos_equipamento
        WHERE tenant_id = ${tenantId} AND LOWER(nome) = LOWER(${nome.trim()}) AND id != ${id}::uuid
      `;

      if (duplicate && Array.isArray(duplicate) && duplicate.length > 0) {
        throw new BadRequestException('Já existe um tipo de equipamento com este nome');
      }
    }

    const result = await this.prisma.$queryRaw`
      UPDATE mod_ordem_servico_tipos_equipamento
      SET nome = ${nome.trim()}
      WHERE tenant_id = ${tenantId} AND id = ${id}::uuid
      RETURNING id, nome, created_at
    `;

    return Array.isArray(result) ? result[0] : result;
  }

  async remove(tenantId: string, id: string) {
    // Verificar se o tipo existe
    const existing = await this.findOne(tenantId, id);
    
    if (!existing) {
      throw new NotFoundException('Tipo de equipamento não encontrado');
    }

    // Verificar se está sendo usado em alguma ordem de serviço
    const inUse = await this.prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM mod_ordem_servico_ordens
      WHERE tenant_id = ${tenantId} AND tipo_equipamento = ${existing.nome}
    `;

    const count = Array.isArray(inUse) ? (inUse[0] as any)?.count : (inUse as any)?.count;
    
    if (count && parseInt(count) > 0) {
      throw new BadRequestException('Este tipo de equipamento não pode ser excluído pois está sendo usado em ordens de serviço');
    }

    await this.prisma.$queryRaw`
      DELETE FROM mod_ordem_servico_tipos_equipamento
      WHERE tenant_id = ${tenantId} AND id = ${id}::uuid
    `;

    return { message: 'Tipo de equipamento excluído com sucesso' };
  }
}