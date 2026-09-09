import { describe, it, expect } from "vitest";
import { prisma } from "@/shared/lib/infra/prisma";
import { seedCore, seedUser } from "../../../../../prisma/lib/seed-core";
import { listRoles, createRole, updateRole, deleteRole } from "./role.service";

async function setup() {
  const core = await seedCore(prisma, { tenantCode: "T", nameTh: "ท", nameEn: "T" });
  const adminId = await seedUser(prisma, core.tenantId, { email: "a@t.t", name: "A", passwordHash: "x", roleIds: [core.roleIds.SUPER_ADMIN] });
  return { core, adminId, tenantId: core.tenantId };
}

/** ผู้กระทำที่เป็น super admin — สิทธิ์ที่ระบุไม่มีผลกับเขา (ดู assertCanGrantPermissions) */
const asSuper = { isSuperAdmin: true, permissions: [] as string[] };

describe("role.service", () => {
  it("listRoles คืน permissionCodes และ memberCount", async () => {
    const { tenantId } = await setup();
    const roles = await listRoles(tenantId);
    expect(roles.find((r) => r.code === "SUPER_ADMIN")!.memberCount).toBe(1);
    expect(roles.find((r) => r.code === "ADMIN")!.permissionCodes).toContain("users:manage");
  });
  it("createRole ตรวจ code ซ้ำและสิทธิ์ที่ไม่มี", async () => {
    const { tenantId, adminId } = await setup();
    const r = await createRole({ tenantId, actorId: adminId, ...asSuper, code: "DEAN", nameTh: "คณบดี", nameEn: "Dean", description: "", permissionCodes: ["users:read"] });
    expect(r.code).toBe("DEAN");
    await expect(createRole({ tenantId, actorId: adminId, ...asSuper, code: "dean", nameTh: "x", nameEn: "x", description: "", permissionCodes: [] })).rejects.toMatchObject({ code: "conflict" });
    await expect(createRole({ tenantId, actorId: adminId, ...asSuper, code: "X1", nameTh: "x", nameEn: "x", description: "", permissionCodes: ["nope:x"] })).rejects.toMatchObject({ code: "validation" });
  });
  it("updateRole แทนที่สิทธิ์ทั้งชุด · บทบาทระบบแก้สิทธิ์ไม่ได้", async () => {
    const { tenantId, adminId, core } = await setup();
    await updateRole({ tenantId, actorId: adminId, ...asSuper, roleId: core.roleIds.VIEWER, nameTh: "ผู้ดูใหม่", nameEn: "Viewer 2", description: "d", permissionCodes: ["users:read", "audit:read"] });
    const v = (await listRoles(tenantId)).find((r) => r.code === "VIEWER")!;
    expect(v.nameTh).toBe("ผู้ดูใหม่");
    expect(v.permissionCodes.sort()).toEqual(["audit:read", "users:read"]);
    await expect(updateRole({ tenantId, actorId: adminId, ...asSuper, roleId: core.roleIds.SUPER_ADMIN, nameTh: "x", nameEn: "x", description: "", permissionCodes: ["users:read"] })).rejects.toMatchObject({ code: "forbidden" });
  });
  it("deleteRole ล้มเมื่อมีผู้ถือหรือเป็นบทบาทระบบ สำเร็จเมื่อว่าง", async () => {
    const { tenantId, adminId, core } = await setup();
    await expect(deleteRole({ tenantId, actorId: adminId, ...asSuper, roleId: core.roleIds.SUPER_ADMIN })).rejects.toMatchObject({ code: "forbidden" });
    await seedUser(prisma, tenantId, { email: "v@t.t", name: "V", passwordHash: "x", roleIds: [core.roleIds.VIEWER] });
    await expect(deleteRole({ tenantId, actorId: adminId, ...asSuper, roleId: core.roleIds.VIEWER })).rejects.toMatchObject({ code: "conflict" });
    await deleteRole({ tenantId, actorId: adminId, ...asSuper, roleId: core.roleIds.STAFF });
    expect((await listRoles(tenantId)).map((r) => r.code)).not.toContain("STAFF");
    expect(await prisma.auditLog.count({ where: { action: "role.delete" } })).toBe(1);
  });
});

/**
 * A7 — ขยายรูปแบบเดียวกับ F1 (`assertCanAssignRoles`/`assertCanActOnTarget` ใน `user.service.ts`)
 * มาที่ role.service: เดิมผู้กระทำสร้าง/แก้บทบาทให้ถือสิทธิ์อะไรก็ได้ รวมถึงสิทธิ์ที่ตัวเองไม่มี แล้วเอา
 * บทบาทนั้นไปมอบให้ใครก็ได้ผ่าน `createUser` และรับลิงก์ตั้งรหัสผ่านของคนนั้นมาบนจอผ่าน
 * `issuePasswordSetupLink` — วันนี้ยังไม่ได้อะไรเพิ่มเพราะ ADMIN บังเอิญถือครบทุกสิทธิ์ของ identity
 * (คุณสมบัติของข้อมูล seed ไม่ใช่ของโค้ด) พอ sub-project 2 เพิ่มโมดูลใหม่ก็กลายเป็นทางยกระดับสิทธิ์ทันที
 *
 * `permissions` ของผู้กระทำมาจาก session snapshot (`ctx.permissions` จาก requirePermission) เหมือน
 * `isSuperAdmin` ของ F1 — ไม่ re-derive จากฐานข้อมูลเอง · แต่ละเคสพิสูจน์ทั้งสามด้าน: super admin ทำได้,
 * ผู้กระทำธรรมดามอบสิทธิ์ที่ไม่มีไม่ได้, และผู้กระทำธรรมดามอบสิทธิ์ที่ตัวเองมีได้ตามปกติ
 */
describe("role.service — A7: มอบสิทธิ์ที่ตัวเองไม่มีให้บทบาทไม่ได้", () => {
  const staff = { isSuperAdmin: false, permissions: ["roles:manage", "users:read"] };

  it("createRole: ผู้กระทำธรรมดาใส่สิทธิ์ที่ตัวเองไม่มีไม่ได้ แต่ super admin ได้", async () => {
    const { tenantId, adminId } = await setup();
    await expect(
      createRole({ tenantId, actorId: adminId, ...staff, code: "ESCALATE", nameTh: "x", nameEn: "x", description: "", permissionCodes: ["users:manage"] }),
    ).rejects.toMatchObject({ code: "forbidden", message: "cannot_grant_unheld_permission" });
    expect(await prisma.role.findUnique({ where: { tenantId_code: { tenantId, code: "ESCALATE" } } })).toBeNull();

    const r = await createRole({ tenantId, actorId: adminId, ...asSuper, code: "ESCALATE", nameTh: "x", nameEn: "x", description: "", permissionCodes: ["users:manage"] });
    expect(r.code).toBe("ESCALATE");
  });

  it("createRole: ผู้กระทำธรรมดามอบสิทธิ์ที่ตัวเองถืออยู่ได้ตามปกติ", async () => {
    const { tenantId, adminId } = await setup();
    const r = await createRole({ tenantId, actorId: adminId, ...staff, code: "READER", nameTh: "x", nameEn: "x", description: "", permissionCodes: ["users:read"] });
    expect((await listRoles(tenantId)).find((x) => x.id === r.id)!.permissionCodes).toEqual(["users:read"]);
  });

  it("updateRole: เติมสิทธิ์ที่ตัวเองไม่มีเข้าบทบาทที่มีอยู่แล้วไม่ได้", async () => {
    const { tenantId, adminId, core } = await setup();
    await expect(
      updateRole({ tenantId, actorId: adminId, ...staff, roleId: core.roleIds.VIEWER, nameTh: "x", nameEn: "x", description: "", permissionCodes: ["users:read", "settings:manage"] }),
    ).rejects.toMatchObject({ code: "forbidden", message: "cannot_grant_unheld_permission" });
    expect((await listRoles(tenantId)).find((r) => r.code === "VIEWER")!.permissionCodes).toEqual(["users:read"]);

    await updateRole({ tenantId, actorId: adminId, ...asSuper, roleId: core.roleIds.VIEWER, nameTh: "x", nameEn: "x", description: "", permissionCodes: ["users:read", "settings:manage"] });
    expect((await listRoles(tenantId)).find((r) => r.code === "VIEWER")!.permissionCodes.sort()).toEqual(["settings:manage", "users:read"]);
  });

  // B14m — เดิมกันบทบาท SUPER_ADMIN ตัวที่สองด้วย unique constraint tenantId_code เท่านั้น
  // (จริงเฉพาะ tenant ที่ผ่าน seedCore มาแล้ว) อำนาจทั้งระบบไม่ควรพิงข้อบังเอิญของข้อมูล
  it("createRole: จองรหัส SUPER_ADMIN ไว้ชัดเจน ไม่พิง unique constraint", async () => {
    const { tenantId, adminId } = await setup();
    // ลบบทบาท SUPER_ADMIN ออกจาก tenant นี้ทั้งหมด เพื่อให้ unique constraint ไม่ได้กันแทน — เหลือแค่ guard ที่ตั้งใจทดสอบ
    await prisma.userRole.deleteMany({ where: { role: { tenantId, code: "SUPER_ADMIN" } } });
    await prisma.role.deleteMany({ where: { tenantId, code: "SUPER_ADMIN" } });
    await expect(
      createRole({ tenantId, actorId: adminId, ...asSuper, code: "super_admin", nameTh: "x", nameEn: "x", description: "", permissionCodes: [] }),
    ).rejects.toMatchObject({ code: "conflict", message: "code_taken" });
  });
});
