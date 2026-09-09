export interface PermissionDef {
  /** เช่น "users:manage" */
  code: string;
  module: string;
  action: string;
  description?: string;
}
