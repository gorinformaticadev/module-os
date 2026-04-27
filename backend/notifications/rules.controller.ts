import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { NotificationRuleService } from "./rules.service";
import { NotificationHistoryService } from "./history.service";
import { JwtAuthGuard } from "../../../core/guards/jwt-auth.guard";
import {
  validateCreatePayload,
  validateUpdatePayload,
  handlePrismaError,
} from "./dto/rule.dto";
import { PermissionGuard } from "../shared/guards/permission.guard";
import { RequireConfigPermission } from "../shared/decorators/require-permission.decorator";
import { Permissions } from "../shared/decorators/permissions.decorator";

@Controller("ordem_servico/notificacoes")
@Permissions("ordem_servico.notifications")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class NotificationRuleController {
  constructor(
    private readonly rules: NotificationRuleService,
    private readonly history: NotificationHistoryService,
  ) {}

  @Get("regras")
  @RequireConfigPermission("manage_notifications")
  async findAllRules(@Req() req: any) {
    return this.rules.findAll();
  }

  @Get("regras/:id")
  @RequireConfigPermission("manage_notifications")
  async findOneRule(@Req() req: any, @Param("id") id: string) {
    return this.rules.findOne(id);
  }

  @Post("regras")
  @RequireConfigPermission("manage_notifications")
  async createRule(@Req() req: any, @Body() data: any) {
    try {
      const validatedData = validateCreatePayload(data);
      return this.rules.create(validatedData);
    } catch (error: any) {
      if (error.status) throw error;
      handlePrismaError(error, "criacao de regra");
    }
  }

  @Put("regras/:id")
  @RequireConfigPermission("manage_notifications")
  async updateRule(
    @Req() req: any,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    try {
      const existingRule = await this.rules.findOne(id);
      const validatedData = validateUpdatePayload({
        ...data,
        trigger_type: data.trigger_type || existingRule.triggerType,
      });

      return this.rules.update(id, validatedData);
    } catch (error: any) {
      if (error.status) throw error;
      handlePrismaError(error, "atualizacao de regra");
    }
  }

  @Patch("regras/:id")
  @RequireConfigPermission("manage_notifications")
  async patchRule(@Req() req: any, @Param("id") id: string, @Body() data: any) {
    try {
      const validatedData = validateUpdatePayload(data);
      return this.rules.update(id, validatedData);
    } catch (error: any) {
      if (error.status) throw error;
      handlePrismaError(error, "atualizacao parcial de regra");
    }
  }

  @Patch("regras/:id/toggle")
  @RequireConfigPermission("manage_notifications")
  async toggleRule(
    @Req() req: any,
    @Param("id") id: string,
    @Body() data: any,
  ) {
    try {
      if (data.enabled === undefined) {
        throw {
          status: 400,
          message: "Campo enabled e obrigatorio para toggle",
        };
      }
      return this.rules.update(id, { enabled: Boolean(data.enabled) });
    } catch (error: any) {
      if (error.status) throw error;
      handlePrismaError(error, "toggle de regra");
    }
  }

  @Delete("regras/:id")
  @RequireConfigPermission("manage_notifications")
  async removeRule(@Req() req: any, @Param("id") id: string) {
    try {
      return this.rules.remove(id);
    } catch (error: any) {
      if (error.status) throw error;
      handlePrismaError(error, "exclusao de regra");
    }
  }

  @Get("historico")
  @RequireConfigPermission("manage_notifications")
  async findAllHistory(@Req() req: any, @Query() filters: any) {
    return this.history.findAll(filters);
  }
}
