import { SetMetadata } from "@nestjs/common";

export const MODULE_PERMISSIONS_KEY = "module_permissions";
export const ModulePermissions = (...permissions: string[]) =>
  SetMetadata(MODULE_PERMISSIONS_KEY, permissions);
