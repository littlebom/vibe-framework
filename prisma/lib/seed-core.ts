import type { PrismaClient } from "../../src/generated/prisma";
import { ALL_PERMISSIONS } from "../../src/permissions";
import { DEFAULT_ROLES } from "../../src/features/identity/permissions";

export interface SeedCoreOptions { tenantCode: string; nameTh: string; nameEn: string }
export interface SeedCoreResult { tenantId: string; roleIds: Record<string, string> }

/** upsert ทั้งหมด รันซ้ำได้ — ใช้โดย seed.ts, bootstrap.ts และ integration test */
export async function seedCore(db: PrismaClient, opts: SeedCoreOptions): Promise<SeedCoreResult> {
  const tenant = await db.tenant.upsert({
    where: { code: opts.tenantCode },
    update: {},
    create: { code: opts.tenantCode, nameTh: opts.nameTh, nameEn: opts.nameEn, settings: { palette: "blue" } },
  });

  const permIds: Record<string, string> = {};
  for (const p of ALL_PERMISSIONS) {
    const row = await db.permission.upsert({
      where: { code: p.code },
      update: { module: p.module, action: p.action, description: p.description ?? null },
      create: { code: p.code, module: p.module, action: p.action, description: p.description ?? null },
    });
    permIds[p.code] = row.id;
  }

  const roleIds: Record<string, string> = {};
  for (const r of DEFAULT_ROLES) {
    const role = await db.role.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: r.code } },
      update: { isSystem: r.isSystem },
      create: { tenantId: tenant.id, code: r.code, nameTh: r.nameTh, nameEn: r.nameEn, isSystem: r.isSystem },
    });
    roleIds[r.code] = role.id;
    // สิทธิ์ตั้งต้นเติมเฉพาะที่ขาด ไม่ลบที่แอดมินเพิ่มเอง
    for (const code of r.permissions) {
      await db.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permIds[code] } },
        update: {},
        create: { roleId: role.id, permissionId: permIds[code] },
      });
    }
  }
  return { tenantId: tenant.id, roleIds };
}

/** สร้าง/อัปเดตผู้ใช้พร้อมสมาชิกภาพและบทบาท scope ALL */
export async function seedUser(
  db: PrismaClient,
  tenantId: string,
  input: { email: string; name: string; passwordHash: string; roleIds: string[]; mustChangePassword?: boolean; isActive?: boolean },
): Promise<string> {
  const user = await db.user.upsert({
    where: { email: input.email.toLowerCase() },
    update: { name: input.name, passwordHash: input.passwordHash, mustChangePassword: input.mustChangePassword ?? false, isActive: input.isActive ?? true },
    create: { email: input.email.toLowerCase(), name: input.name, passwordHash: input.passwordHash, emailVerified: true, mustChangePassword: input.mustChangePassword ?? false, isActive: input.isActive ?? true },
  });
  const ut = await db.userTenant.upsert({
    where: { userId_tenantId: { userId: user.id, tenantId } },
    update: { isActive: true },
    create: { userId: user.id, tenantId },
  });
  await db.userRole.deleteMany({ where: { userTenantId: ut.id } });
  await db.userRole.createMany({ data: input.roleIds.map((roleId) => ({ userTenantId: ut.id, roleId, scopeType: "ALL" })) });
  return user.id;
}
