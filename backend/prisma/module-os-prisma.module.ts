import { Global, Module } from "@nestjs/common";
import { ModuleOsPrismaService } from "./module-os-prisma.service";

@Global()
@Module({
  providers: [ModuleOsPrismaService],
  exports: [ModuleOsPrismaService],
})
export class ModuleOsPrismaModule {}
