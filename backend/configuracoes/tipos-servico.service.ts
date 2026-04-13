import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { RequestSecurityContextService } from '@common/services/request-security-context.service';
import { ModuleOsPrismaService } from '../prisma/module-os-prisma.service';

@Injectable()
export class TiposServicoService {
  // tenantId e aplicado pelo ALS + ModuleOsPrismaService.
  constructor(
    private readonly prisma: ModuleOsPrismaService,
    private readonly requestSecurityContext: RequestSecurityContextService,
  ) {}

  async findAll() {
    return (this.prisma as any).mod_ordem_servico_tipos_servico.findMany({
      orderBy: [{ isDefault: 'desc' }, { nome: 'asc' }],
    });
  }

  async findOne(id: string) {
    const tipo = await (this.prisma as any).mod_ordem_servico_tipos_servico.findFirst({
      where: { id },
    });

    if (!tipo) {
      throw new NotFoundException('Tipo de servico nao encontrado');
    }

    return tipo;
  }

  async create(createDto: any) {
    const normalizedNome = String(createDto?.nome || '').trim();
    if (!normalizedNome) {
      throw new BadRequestException('Nome e obrigatorio');
    }

    const existing = await (this.prisma as any).mod_ordem_servico_tipos_servico.findFirst({
      where: { nome: { equals: normalizedNome, mode: 'insensitive' } },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException('Ja existe um tipo de servico com este nome');
    }

    return (this.prisma as any).mod_ordem_servico_tipos_servico.create({
      data: {
        tenantId: this.getTenantIdOrThrow(),
        nome: normalizedNome,
        isDefault: false,
      },
    });
  }

  async update(id: string, updateDto: any) {
    const existing = await this.findOne(id);
    const normalizedNome = String(updateDto?.nome || '').trim();

    if (!normalizedNome) {
      throw new BadRequestException('Nome e obrigatorio');
    }

    if (normalizedNome !== existing.nome) {
      const duplicate = await (this.prisma as any).mod_ordem_servico_tipos_servico.findFirst({
        where: {
          id: { not: id },
          nome: { equals: normalizedNome, mode: 'insensitive' },
        },
        select: { id: true },
      });

      if (duplicate) {
        throw new BadRequestException('Ja existe um tipo de servico com este nome');
      }
    }

    const updateResult = await (this.prisma as any).mod_ordem_servico_tipos_servico.updateMany({
      where: { id },
      data: { nome: normalizedNome },
    });

    if (updateResult.count === 0) {
      throw new NotFoundException('Tipo de servico nao encontrado');
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    const existing = await this.findOne(id);

    if (existing.isDefault) {
      throw new BadRequestException('Tipos de servico padrao nao podem ser excluidos');
    }

    const inUseCount = await (this.prisma as any).mod_ordem_servico_ordens.count({
      where: { tipoServico: existing.nome },
    });

    if (inUseCount > 0) {
      throw new BadRequestException(
        'Este tipo de servico nao pode ser excluido pois esta sendo usado em ordens de servico',
      );
    }

    await (this.prisma as any).mod_ordem_servico_tipos_servico.deleteMany({
      where: { id },
    });

    return { message: 'Tipo de servico excluido com sucesso' };
  }

  private getTenantIdOrThrow(): string {
    const tenantId = this.requestSecurityContext.getTenantId();
    if (!tenantId) {
      throw new BadRequestException('Tenant ID nao identificado no contexto atual.');
    }
    return tenantId;
  }
}
