import { errors, FORBIDDEN_DIGEST } from "@/shared/lib/errors";
import { requireSession, type SessionContext } from "./session";
import { hasPermission, type PermissionScope } from "./rbac-pure";

export { hasPermission, permissionScopes } from "./rbac-pure";
export type { PermissionScope, PermissionScopes, PermissionCtx } from "./rbac-pure";

/**
 * เรียกได้ทั้งจาก Server Action (ผ่าน runAction → ได้ envelope) และจาก Server Component ตอน render
 * (ผ่าน error boundary) — เส้นทางหลังต้องแยก 403 ออกจาก 500 ให้ได้แม้ใน production ที่ Next กลืน
 * message ทิ้ง จึง stamp `digest` คงที่ไว้ตั้งแต่ต้นทาง (ดู FORBIDDEN_DIGEST ใน shared/lib/errors.ts)
 */
export async function requirePermission(code: string, scope?: PermissionScope): Promise<SessionContext> {
  const ctx = await requireSession();
  if (!hasPermission(ctx, code, scope)) {
    const err = errors.forbidden(`forbidden:${code}`);
    err.digest = FORBIDDEN_DIGEST;
    throw err;
  }
  return ctx;
}
