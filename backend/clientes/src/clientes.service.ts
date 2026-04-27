import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  Optional,
} from "@nestjs/common";
import { AuditService } from "@core/audit/audit.service";
import { RequestSecurityContextService } from "@common/services/request-security-context.service";
import { ClienteRepository } from "./repositories/cliente.repository";
import { Cliente } from "../contracts/cliente.api";
import { IClienteLookup } from "../../shared/interfaces/cliente-lookup.interface";
import { IClienteDeletionGuard } from "../../shared/interfaces/cliente-deletion-guard.interface";
import { CLIENTE_DELETION_GUARD } from "../../shared/constants/injection-tokens";

@Injectable()
export class ClientesService implements IClienteLookup {
  private readonly logger = new Logger(ClientesService.name);

  constructor(
    private readonly repository: ClienteRepository,
    private readonly auditService: AuditService,
    private readonly requestSecurityContext: RequestSecurityContextService,
    @Inject(CLIENTE_DELETION_GUARD)
    @Optional()
    private readonly deletionGuard?: IClienteDeletionGuard,
  ) {}

  async findAll(filters: { search?: string; status?: string | boolean } = {}) {
    const { search, status } = filters;
    const safeSearch = typeof search === "string" ? search.trim() : "";
    const statusFilter =
      status === "" || status === undefined || status === null
        ? undefined
        : status === true || status === "true";

    if (safeSearch.length > 0 && safeSearch.length < 2) {
      return [];
    }

    const clients = await this.repository.findAll({
      search: safeSearch.length >= 2 ? safeSearch : undefined,
      status: statusFilter,
    });

    return clients.map((client) => this.serializeClient(client));
  }

  async findById(id: string) {
    const client = await this.repository.findById(id);
    return client ? this.serializeClient(client) : null;
  }

  async lookupCep(cep: string) {
    const cleanCep = String(cep || "").replace(/\D/g, "");

    if (cleanCep.length !== 8) {
      throw new BadRequestException("CEP invalido.");
    }

    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      this.logger.warn(
        `ViaCEP respondeu ${response.status} para o CEP ${cleanCep}`,
      );
      throw new BadGatewayException("Falha ao consultar o CEP.");
    }

    const data = (await response.json()) as {
      erro?: boolean;
      logradouro?: string;
      bairro?: string;
      localidade?: string;
      uf?: string;
      cep?: string;
    };

    if (data.erro) {
      return { success: false };
    }

    return {
      success: true,
      cep: data.cep ?? cleanCep,
      logradouro: data.logradouro ?? "",
      bairro: data.bairro ?? "",
      localidade: data.localidade ?? "",
      uf: data.uf ?? "",
    };
  }

  async create(
    data: Partial<Cliente> & {
      phone_primary: string;
      phone_secondary?: string;
      address_zip?: string;
      address_street?: string;
      address_number?: string;
      address_complement?: string;
      address_neighborhood?: string;
      address_city?: string;
      address_state?: string;
      image_url?: string;
    },
  ) {
    if (!data.name || !data.phone_primary) {
      throw new Error("Nome e Telefone principal sao obrigatorios");
    }

    try {
      const actor = this.getActorContext();
      const createdClient = await this.repository.create({
        tenantId: actor.tenantId,
        name: data.name,
        document: data.document,
        phonePrimary: data.phone_primary,
        phoneSecondary: data.phone_secondary,
        email: data.email,
        address: data.address,
        addressZip: data.address_zip,
        addressStreet: data.address_street,
        addressNumber: data.address_number,
        addressComplement: data.address_complement,
        addressNeighborhood: data.address_neighborhood,
        addressCity: data.address_city,
        addressState: data.address_state,
        observations: data.observations,
        imageUrl: data.image_url,
      });

      await this.auditService.log({
        action: "CREATE_CLIENT",
        userId: actor.userId,
        tenantId: actor.tenantId,
        details: { clientId: createdClient.id, name: data.name },
      });

      return this.serializeClient(createdClient);
    } catch (error) {
      this.logger.error("Erro ao criar cliente:", error);
      throw new Error(
        "Erro ao salvar no banco de dados. Verifique os dados e tente novamente.",
      );
    }
  }

  async update(
    id: string,
    data: Partial<Cliente> & {
      phone_primary: string;
      phone_secondary?: string;
      address_zip?: string;
      address_street?: string;
      address_number?: string;
      address_complement?: string;
      address_neighborhood?: string;
      address_city?: string;
      address_state?: string;
      image_url?: string;
      is_active?: boolean;
    },
  ) {
    if (!data.name || !data.phone_primary) {
      throw new Error("Nome e Telefone principal sao obrigatorios");
    }

    try {
      const existing = await this.repository.findById(id);
      if (!existing) {
        throw new Error("Cliente nao encontrado");
      }

      await this.repository.update(id, {
        name: data.name,
        document: data.document,
        phonePrimary: data.phone_primary,
        phoneSecondary: data.phone_secondary,
        email: data.email,
        address: data.address,
        addressZip: data.address_zip,
        addressStreet: data.address_street,
        addressNumber: data.address_number,
        addressComplement: data.address_complement,
        addressNeighborhood: data.address_neighborhood,
        addressCity: data.address_city,
        addressState: data.address_state,
        observations: data.observations,
        imageUrl: data.image_url,
        isActive: data.is_active,
      });

      const actor = this.getActorContext();

      await this.auditService.log({
        action: "UPDATE_CLIENT",
        userId: actor.userId,
        tenantId: actor.tenantId,
        details: { clientId: id, updates: data },
      });

      return this.findById(id);
    } catch (error) {
      this.logger.error("Erro ao atualizar cliente:", error);
      throw error;
    }
  }

  async delete(id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error("Cliente nao encontrado");
    }

    if (this.deletionGuard) {
      const result = await this.deletionGuard.canDelete(id);
      if (!result.allowed) {
        throw new Error(result.reason || "Cliente nao pode ser excluido.");
      }
    }

    const actor = this.getActorContext();

    await this.auditService.log({
      action: "DELETE_CLIENT",
      userId: actor.userId,
      tenantId: actor.tenantId,
      details: { clientId: id },
    });

    await this.repository.delete(id);

    return { success: true };
  }

  private getActorContext() {
    const actor = this.requestSecurityContext.getActor();
    const tenantId =
      actor?.tenantId || this.requestSecurityContext.getTenantId();

    if (!tenantId) {
      throw new Error("Tenant ID nao identificado no contexto atual.");
    }

    return {
      tenantId,
      userId: actor?.id || undefined,
    };
  }

  private serializeClient(client: Cliente & { deletedAt?: Date }) {
    return {
      id: client.id,
      tenantId: client.tenantId,
      name: client.name,
      document: client.document,
      phonePrimary: client.phonePrimary,
      phone_secondary: client.phoneSecondary,
      email: client.email,
      address: client.address,
      address_zip: client.addressZip,
      address_street: client.addressStreet,
      address_number: client.addressNumber,
      address_complement: client.addressComplement,
      address_neighborhood: client.addressNeighborhood,
      address_city: client.addressCity,
      address_state: client.addressState,
      observations: client.observations,
      image_url: client.imageUrl,
      is_active: client.isActive ?? true,
      created_at: client.createdAt?.toISOString?.() ?? client.createdAt ?? null,
      updated_at: client.updatedAt?.toISOString?.() ?? client.updatedAt ?? null,
      deleted_at: client.deletedAt?.toISOString?.() ?? client.deletedAt ?? null,
    };
  }
}
