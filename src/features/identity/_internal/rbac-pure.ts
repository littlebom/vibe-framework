import type { RoleGrant } from "./grants";

export interface PermissionScope { campusId?: string; orgUnitId?: string }

export interface PermissionCtx { roles: RoleGrant[]; permissions: string[]; isSuperAdmin: boolean }
type Ctx = PermissionCtx;

function grantCovers(g: RoleGrant, scope: PermissionScope): boolean {
  if (g.scopeType === "ALL") return true;
  if (g.scopeType === "CAMPUS") return !!scope.campusId && g.scopeId === scope.campusId;
  if (g.scopeType === "ORG_UNIT") return !!scope.orgUnitId && g.scopeId === scope.orgUnitId;
  return false;
}

/** การจับคู่ ORG_UNIT กับหน่วยงานลูกในต้นไม้เป็นหน้าที่ของ feature org (sub-project 2) — ที่นี่เทียบ id ตรง ๆ */
export function hasPermission(ctx: Ctx, code: string, scope?: PermissionScope): boolean {
  if (ctx.isSuperAdmin) return true;
  // ⚠️ กิ่ง "ไม่ระบุ scope" = ไม่บังคับขอบเขตเลย · `ctx.permissions` เป็น union แบบไม่สนขอบเขต
  // (ดูคำเตือนที่ SessionContext.permissions ใน session.ts) บทบาทที่ให้มาแบบ CAMPUS/ORG_UNIT จึงมีค่า
  // เท่ากับ ALL ทุกประการเมื่อเรียกแบบนี้ · ทั้ง sub-project 1 เรียกแบบนี้ตาม spec B5 โดยตั้งใจ
  // ความผิดพลาดของกิ่งนี้ให้สิทธิ์ "มากกว่า" ที่ควร ไม่ใช่น้อยกว่า และมองไม่เห็นจากภายนอก —
  // sub-project 2 ที่เพิ่มตัวเลือกวิทยาเขต/หน่วยงานต้องไล่แก้ทุกจุดตามรายการใน spec B14
  if (!scope) return ctx.permissions.includes(code);
  return ctx.roles.some((g) => g.permissions.includes(code) && grantCovers(g, scope));
}

export type PermissionScopes = { all: true } | { all: false; campusIds: string[]; orgUnitIds: string[] };

/** สำหรับ feature ที่ต้องกรอง query ตามขอบเขต */
export function permissionScopes(ctx: Ctx, code: string): PermissionScopes {
  if (ctx.isSuperAdmin) return { all: true };
  const granting = ctx.roles.filter((g) => g.permissions.includes(code));
  if (granting.some((g) => g.scopeType === "ALL")) return { all: true };
  return {
    all: false,
    campusIds: [...new Set(granting.filter((g) => g.scopeType === "CAMPUS" && g.scopeId).map((g) => g.scopeId as string))],
    orgUnitIds: [...new Set(granting.filter((g) => g.scopeType === "ORG_UNIT" && g.scopeId).map((g) => g.scopeId as string))],
  };
}
