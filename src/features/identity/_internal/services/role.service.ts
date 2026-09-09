import { prisma, type Db } from "@/shared/lib/infra/prisma";
import { errors } from "@/shared/lib/errors";
import { SUPER_ADMIN_CODE } from "../../permissions";
import { writeAudit } from "../audit";
import type { CreateRoleInput, UpdateRoleInput } from "../validations/roles";

export interface RoleItem { id: string; code: string; nameTh: string; nameEn: string; description: string | null; isSystem: boolean; permissionCodes: string[]; memberCount: number }

/**
 * `isSuperAdmin` และ `permissions` คือ session snapshot ของผู้เรียก (`ctx.isSuperAdmin`/`ctx.permissions`
 * จาก requirePermission) ที่ชั้น action ส่งต่อมา — ไม่ re-derive ที่นี่ รูปแบบเดียวกับ Actor ของ
 * `user.service.ts` และเป็นที่มาของอำนาจให้ guard A7 ด้านล่าง
 */
interface Actor { tenantId: string; actorId: string; isSuperAdmin: boolean; permissions: string[] }

export async function listRoles(tenantId: string): Promise<RoleItem[]> {
  const rows = await prisma.role.findMany({
    where: { tenantId }, orderBy: [{ isSystem: "desc" }, { code: "asc" }],
    include: { rolePermissions: { select: { permission: { select: { code: true } } } }, _count: { select: { userRoles: true } } },
  });
  return rows.map((r) => ({ id: r.id, code: r.code, nameTh: r.nameTh, nameEn: r.nameEn, description: r.description, isSystem: r.isSystem, permissionCodes: r.rolePermissions.map((p) => p.permission.code), memberCount: r._count.userRoles }));
}

export async function listPermissions() {
  return prisma.permission.findMany({ orderBy: [{ module: "asc" }, { action: "asc" }], select: { code: true, module: true, action: true } });
}

async function permissionIds(codes: string[], db: Db): Promise<string[]> {
  const uniq = [...new Set(codes)];
  const rows = await db.permission.findMany({ where: { code: { in: uniq } }, select: { id: true } });
  if (rows.length !== uniq.length) throw errors.validation("unknown_permission", { permissionCodes: ["unknown_permission"] });
  return rows.map((r) => r.id);
}

/**
 * A7 — ผู้กระทำที่ไม่ใช่ super admin จะใส่สิทธิ์ที่ตัวเองไม่ถืออยู่ลงในบทบาทไม่ได้ ไม่ว่าจะตอนสร้างหรือแก้
 *
 * ขยายรูปแบบเดียวกับ F1 (`assertCanAssignRoles` ใน `user.service.ts`): ถ้าไม่กันตรงนี้ ผู้ถือ
 * `roles:manage` + `users:manage` สร้างบทบาทที่ถือสิทธิ์อะไรก็ได้ แล้วมอบให้บัญชีที่ตัวเองสร้าง
 * พร้อมรับลิงก์ตั้งรหัสผ่านของบัญชีนั้นมาบนจอ — ยกระดับสิทธิ์ตัวเองครบวงจรโดยไม่ต้องแตะ SUPER_ADMIN เลย
 */
function assertCanGrantPermissions(codes: string[], actor: Actor): void {
  if (actor.isSuperAdmin) return;
  const held = new Set(actor.permissions);
  if (codes.some((c) => !held.has(c))) throw errors.forbidden("cannot_grant_unheld_permission");
}

export async function createRole(input: Actor & CreateRoleInput) {
  const code = input.code.toUpperCase();
  // B14m: จองรหัส SUPER_ADMIN ไว้ชัดเจน ไม่พิง unique constraint tenantId_code (ซึ่งกันได้เฉพาะ
  // tenant ที่ seedCore สร้างบทบาทนี้ไว้แล้วจริง ๆ) — อำนาจสูงสุดของระบบผูกกับ magic string ตัวนี้
  if (code === SUPER_ADMIN_CODE) throw errors.conflict("code_taken");
  if (await prisma.role.findUnique({ where: { tenantId_code: { tenantId: input.tenantId, code } } })) throw errors.conflict("code_taken");
  assertCanGrantPermissions(input.permissionCodes, input);
  return prisma.$transaction(async (tx) => {
    const ids = await permissionIds(input.permissionCodes, tx);
    const role = await tx.role.create({ data: { tenantId: input.tenantId, code, nameTh: input.nameTh, nameEn: input.nameEn, description: input.description || null, rolePermissions: { create: ids.map((permissionId) => ({ permissionId })) } } });
    await writeAudit({ tenantId: input.tenantId, actorId: input.actorId, action: "role.create", entity: "role", entityId: role.id, after: input }, tx);
    return role;
  });
}

export async function updateRole(input: Actor & UpdateRoleInput) {
  await prisma.$transaction(async (tx) => {
    const role = await tx.role.findFirst({ where: { id: input.roleId, tenantId: input.tenantId }, include: { rolePermissions: { select: { permission: { select: { code: true } } } } } });
    if (!role) throw errors.not_found();
    if (role.isSystem) throw errors.forbidden("system_role");
    assertCanGrantPermissions(input.permissionCodes, input);
    const ids = await permissionIds(input.permissionCodes, tx);
    await tx.rolePermission.deleteMany({ where: { roleId: role.id } });
    await tx.role.update({ where: { id: role.id }, data: { nameTh: input.nameTh, nameEn: input.nameEn, description: input.description || null, rolePermissions: { create: ids.map((permissionId) => ({ permissionId })) } } });
    await writeAudit({ tenantId: input.tenantId, actorId: input.actorId, action: "role.update", entity: "role", entityId: role.id, before: { nameTh: role.nameTh, nameEn: role.nameEn, permissionCodes: role.rolePermissions.map((p) => p.permission.code) }, after: input }, tx);
  });
}

export async function deleteRole(input: Actor & { roleId: string }) {
  await prisma.$transaction(async (tx) => {
    const role = await tx.role.findFirst({ where: { id: input.roleId, tenantId: input.tenantId }, include: { _count: { select: { userRoles: true } } } });
    if (!role) throw errors.not_found();
    if (role.isSystem) throw errors.forbidden("system_role");
    if (role._count.userRoles > 0) throw errors.conflict(`in_use:${role._count.userRoles}`);
    await tx.role.delete({ where: { id: role.id } });
    await writeAudit({ tenantId: input.tenantId, actorId: input.actorId, action: "role.delete", entity: "role", entityId: role.id, before: { code: role.code } }, tx);
  });
}
