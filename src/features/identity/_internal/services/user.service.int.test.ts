import { describe, it, expect, vi } from "vitest";
import { prisma } from "@/shared/lib/infra/prisma";
import { seedCore, seedUser } from "../../../../../prisma/lib/seed-core";
import { listUsers, createUser, updateUser, setUserActive, issuePasswordSetupLink, requestEmailChange, confirmEmailChange } from "./user.service";
import { consumeToken } from "../tokens";

vi.mock("@/shared/lib/infra/mailer", () => ({ sendMail: vi.fn(async () => ({ delivered: false })) }));

async function setup() {
  const core = await seedCore(prisma, { tenantCode: "T", nameTh: "ท", nameEn: "T" });
  const adminId = await seedUser(prisma, core.tenantId, { email: "admin@t.t", name: "Admin", passwordHash: "x", roleIds: [core.roleIds.SUPER_ADMIN] });
  return { core, adminId, tenantId: core.tenantId };
}

describe("user.service", () => {
  it("createUser สร้างผู้ใช้ สมาชิกภาพ บทบาท โทเคนตั้งรหัส และ audit", async () => {
    const { core, adminId, tenantId } = await setup();
    const r = await createUser({ tenantId, actorId: adminId, isSuperAdmin: true, permissions: [], email: "New@T.t", name: "New", roles: [{ roleId: core.roleIds.VIEWER, scopeType: "ALL", scopeId: null }] });
    expect(r.user.email).toBe("new@t.t");
    expect(r.user.passwordHash).toBeNull();
    expect(await consumeToken(r.rawToken, "PASSWORD_RESET")).toMatchObject({ userId: r.user.id });
    const ut = await prisma.userTenant.findUniqueOrThrow({ where: { userId_tenantId: { userId: r.user.id, tenantId } }, include: { userRoles: true } });
    expect(ut.userRoles).toHaveLength(1);
    expect(await prisma.auditLog.count({ where: { action: "user.create", entityId: r.user.id } })).toBe(1);
  });
  it("อีเมลซ้ำ → conflict · บทบาทคนละ tenant → not_found", async () => {
    const { core, adminId, tenantId } = await setup();
    await expect(createUser({ tenantId, actorId: adminId, isSuperAdmin: true, permissions: [], email: "admin@t.t", name: "x", roles: [{ roleId: core.roleIds.VIEWER, scopeType: "ALL", scopeId: null }] })).rejects.toMatchObject({ code: "conflict" });
    await expect(createUser({ tenantId, actorId: adminId, isSuperAdmin: true, permissions: [], email: "y@t.t", name: "x", roles: [{ roleId: "00000000-0000-0000-0000-000000000001", scopeType: "ALL", scopeId: null }] })).rejects.toMatchObject({ code: "not_found" });
  });
  it("updateUser แทนที่บทบาททั้งชุด และห้ามแก้บทบาทตัวเอง", async () => {
    const { core, adminId, tenantId } = await setup();
    const uid = await seedUser(prisma, tenantId, { email: "u@t.t", name: "U", passwordHash: "x", roleIds: [core.roleIds.VIEWER] });
    await updateUser({ tenantId, actorId: adminId, isSuperAdmin: true, permissions: [], userId: uid, name: "U2", roles: [{ roleId: core.roleIds.ADMIN, scopeType: "ALL", scopeId: null }, { roleId: core.roleIds.STAFF, scopeType: "ALL", scopeId: null }], mustChangePassword: true });
    const list = await listUsers(tenantId, { page: 1, perPage: 20, search: "u@", status: "all" });
    expect(list.items[0].roles.map((r) => r.code).sort()).toEqual(["ADMIN", "STAFF"]);
    expect(list.items[0].mustChangePassword).toBe(true);
    await expect(updateUser({ tenantId, actorId: adminId, isSuperAdmin: true, permissions: [], userId: adminId, roles: [{ roleId: core.roleIds.VIEWER, scopeType: "ALL", scopeId: null }] })).rejects.toMatchObject({ code: "forbidden", message: "cannot_edit_self" });
  });
  /**
   * แก้จากต้นฉบับ brief: เดิมเคส "ห้ามระงับ SUPER_ADMIN คนสุดท้าย" ใช้ admin2 เป็นทั้ง actor และ
   * userId ในการเรียก setUserActive เดียวกัน — ชน guard cannot_edit_self (userId === actorId) ก่อน
   * ที่จะไปถึง guard last_super_admin เลย ทำให้ assertion "rejects code forbidden" ผ่านได้โดยไม่ได้
   * พิสูจน์อะไรเกี่ยวกับ guard last_super_admin เลย (ผ่านด้วยเหตุผลผิด)
   *
   * แก้รอบ 2 (fix round 1, F1): เดิมใช้ staffActor (non-super) เป็นผู้กระทำคนที่สาม แต่หลังเพิ่ม guard
   * F1 (assertCanActOnTarget) แล้ว ผู้กระทำที่ไม่ใช่ super admin แตะผู้ใช้ที่ถือ SUPER_ADMIN ไม่ได้เลย —
   * staffActor จะชน guard F1 ก่อนถึง guard last_super_admin เสมอ ทำให้เคสนี้กลับไปผ่านด้วยเหตุผลผิดอีกครั้ง
   * (คนละเหตุผลจากรอบก่อน แต่ปัญหาเดิม) จึงเปลี่ยนผู้กระทำเป็น adminId เอง (เป็น super admin จริง —
   * ผ่าน guard F1 เสมอ) แต่ไม่ใช่ผู้ถูกกระทำ (target คือ admin2) จึงไม่ชน cannot_edit_self ด้วย — สถานะ
   * active ของ adminId ใน DB ปิดไว้ก่อนเรียก เพื่อไม่ให้ตัวเองถูกนับเป็น "super admin active คนอื่น"
   * (otherActiveSuperAdmins นับเฉพาะที่ isActive จริงใน DB เท่านั้น ไม่เกี่ยวกับพารามิเตอร์ isSuperAdmin
   * ที่ส่งเข้าไปตรง ๆ ซึ่งจำลอง session snapshot ที่อาจไม่ตรงกับ DB ล่าสุดเป๊ะ ๆ — เจตนาเพื่อแยกการทดสอบ
   * guard last_super_admin ออกจาก guard F1 ให้ขาดจากกันจริง ๆ) ดู RED proof ในรายงาน task-11 fix round 1
   */
  it("setUserActive ห้ามระงับตัวเอง และห้ามระงับ SUPER_ADMIN คนสุดท้าย", async () => {
    const { core, adminId, tenantId } = await setup();
    await expect(setUserActive({ tenantId, actorId: adminId, isSuperAdmin: true, permissions: [], userId: adminId, isActive: false })).rejects.toMatchObject({ code: "forbidden", message: "cannot_edit_self" });
    const admin2 = await seedUser(prisma, tenantId, { email: "a2@t.t", name: "A2", passwordHash: "x", roleIds: [core.roleIds.SUPER_ADMIN] });
    await setUserActive({ tenantId, actorId: adminId, isSuperAdmin: true, permissions: [], userId: admin2, isActive: false }); // ยังเหลือ admin คนแรก
    await prisma.user.update({ where: { id: admin2 }, data: { isActive: true } });

    // ปิด adminId ไว้ก่อน — เหลือ admin2 เป็น super admin active คนเดียวในระบบ แล้วให้ adminId (super admin
    // ตัวจริง ผ่าน guard F1 เสมอ แต่ไม่ใช่ผู้ถูกกระทำ) เป็นผู้กระทำ เพื่อพิสูจน์ guard last_super_admin แยกจาก guard F1
    await prisma.user.update({ where: { id: adminId }, data: { isActive: false } });
    await expect(setUserActive({ tenantId, actorId: adminId, isSuperAdmin: true, permissions: [], userId: admin2, isActive: false })).rejects.toMatchObject({ code: "forbidden", message: "last_super_admin" });

    // ถอด SUPER_ADMIN ออกจากคนสุดท้ายก็ไม่ได้ (updateUser ถอดบทบาท) — สถานการณ์เดิม: admin2 เหลือ super admin active คนเดียว
    await expect(updateUser({ tenantId, actorId: adminId, isSuperAdmin: true, permissions: [], userId: admin2, roles: [{ roleId: core.roleIds.VIEWER, scopeType: "ALL", scopeId: null }] })).rejects.toMatchObject({ code: "forbidden", message: "last_super_admin" });
  });
  it("listUsers กรอง search/status/role และแบ่งหน้า", async () => {
    const { core, tenantId } = await setup();
    for (let i = 0; i < 3; i++) await seedUser(prisma, tenantId, { email: `v${i}@t.t`, name: `Viewer ${i}`, passwordHash: "x", roleIds: [core.roleIds.VIEWER], isActive: i !== 0 });
    expect((await listUsers(tenantId, { page: 1, perPage: 20, search: "", status: "all" })).total).toBe(4);
    expect((await listUsers(tenantId, { page: 1, perPage: 20, search: "", status: "inactive" })).total).toBe(1);
    expect((await listUsers(tenantId, { page: 1, perPage: 20, search: "", status: "all", roleId: core.roleIds.VIEWER })).total).toBe(3);
    expect((await listUsers(tenantId, { page: 2, perPage: 2, search: "viewer", status: "all" })).items).toHaveLength(1);
  });
  it("เปลี่ยนอีเมล: ออกโทเคน → ยืนยัน → อีเมลเปลี่ยน · อีเมลใหม่ซ้ำ → conflict", async () => {
    const { core, adminId, tenantId } = await setup();
    const uid = await seedUser(prisma, tenantId, { email: "u@t.t", name: "U", passwordHash: "x", roleIds: [core.roleIds.VIEWER] });
    await expect(requestEmailChange({ tenantId, actorId: adminId, isSuperAdmin: true, permissions: [], userId: uid, newEmail: "admin@t.t" })).rejects.toMatchObject({ code: "conflict" });
    const { rawToken } = await requestEmailChange({ tenantId, actorId: adminId, isSuperAdmin: true, permissions: [], userId: uid, newEmail: "fresh@t.t" });
    expect(await confirmEmailChange(rawToken)).toBe(true);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: uid } })).email).toBe("fresh@t.t");
    expect(await confirmEmailChange(rawToken)).toBe(false);
  });
  it("issuePasswordSetupLink ออกโทเคน 72 ชั่วโมงและบันทึก audit", async () => {
    const { core, adminId, tenantId } = await setup();
    const uid = await seedUser(prisma, tenantId, { email: "u@t.t", name: "U", passwordHash: "x", roleIds: [core.roleIds.VIEWER] });
    const r = await issuePasswordSetupLink({ tenantId, actorId: adminId, isSuperAdmin: true, permissions: [], userId: uid });
    expect(r.expiresAt.getTime() - Date.now()).toBeGreaterThan(71 * 3600 * 1000);
    expect(await prisma.auditLog.count({ where: { action: "user.password_link", entityId: uid } })).toBe(1);
  });
});

/**
 * F1 (task-11 fix round 1) — ผู้กระทำที่ไม่ใช่ super admin ต้อง (1) มอบบทบาท SUPER_ADMIN ให้ใครไม่ได้เลย
 * และ (2) กระทำการใด ๆ กับผู้ใช้ที่ถือ SUPER_ADMIN อยู่แล้วไม่ได้เลย — ครอบคลุมทั้ง 5 จุดที่เคยเป็นช่องโหว่
 * ยกระดับสิทธิ์ (ADMIN → SUPER_ADMIN ผ่าน createUser/updateUser โดยตรง, หรือผ่านการยึดบัญชี super admin
 * เดิมด้วย issuePasswordSetupLink/requestEmailChange/setUserActive) แต่ละเคสพิสูจน์ทั้งสองด้าน: ผู้กระทำที่
 * ไม่ใช่ super admin ต้องโดนปฏิเสธ และ super admin ตัวจริงต้องยังทำได้ตามปกติ
 *
 * `permissions: []` ในบล็อกนี้ไม่ได้ทำให้เคสผ่านด้วยเหตุผลผิด — กฎ SUPER_ADMIN ทำงานก่อนกฎ F2 เสมอ
 * (ดู `assertCanAssignRoles`) ข้อความที่ assert จึงเป็น `super_admin_protected` ไม่ใช่ของ F2
 */
describe("user.service — F1: ป้องกันการยกระดับสิทธิ์เป็น SUPER_ADMIN", () => {
  it("createUser: มอบบทบาท SUPER_ADMIN ตอนสร้างผู้ใช้ได้เฉพาะ super admin", async () => {
    const { core, adminId, tenantId } = await setup();
    const staffActor = await seedUser(prisma, tenantId, { email: "staff-f1a@t.t", name: "Staff", passwordHash: "x", roleIds: [core.roleIds.VIEWER] });
    await expect(
      createUser({ tenantId, actorId: staffActor, isSuperAdmin: false, permissions: [], email: "hacker@t.t", name: "Hacker", roles: [{ roleId: core.roleIds.SUPER_ADMIN, scopeType: "ALL", scopeId: null }] }),
    ).rejects.toMatchObject({ code: "forbidden", message: "super_admin_protected" });
    expect(await prisma.user.findUnique({ where: { email: "hacker@t.t" } })).toBeNull();

    const r = await createUser({ tenantId, actorId: adminId, isSuperAdmin: true, permissions: [], email: "newsuper@t.t", name: "NewSuper", roles: [{ roleId: core.roleIds.SUPER_ADMIN, scopeType: "ALL", scopeId: null }] });
    expect(r.user.email).toBe("newsuper@t.t");
  });

  it("updateUser: มอบบทบาท SUPER_ADMIN ให้คนอื่นได้เฉพาะ super admin", async () => {
    const { core, adminId, tenantId } = await setup();
    const staffActor = await seedUser(prisma, tenantId, { email: "staff-f1b@t.t", name: "Staff", passwordHash: "x", roleIds: [core.roleIds.VIEWER] });
    const target = await seedUser(prisma, tenantId, { email: "target-f1b@t.t", name: "Target", passwordHash: "x", roleIds: [core.roleIds.VIEWER] });
    await expect(
      updateUser({ tenantId, actorId: staffActor, isSuperAdmin: false, permissions: [], userId: target, roles: [{ roleId: core.roleIds.SUPER_ADMIN, scopeType: "ALL", scopeId: null }] }),
    ).rejects.toMatchObject({ code: "forbidden", message: "super_admin_protected" });

    await updateUser({ tenantId, actorId: adminId, isSuperAdmin: true, permissions: [], userId: target, roles: [{ roleId: core.roleIds.SUPER_ADMIN, scopeType: "ALL", scopeId: null }] });
    const list = await listUsers(tenantId, { page: 1, perPage: 20, search: "target-f1b@", status: "all" });
    expect(list.items[0].roles.map((r) => r.code)).toEqual(["SUPER_ADMIN"]);
  });

  it("updateUser: แก้ไขผู้ใช้ที่ถือ SUPER_ADMIN อยู่แล้วได้เฉพาะ super admin แม้ไม่แตะบทบาท", async () => {
    const { core, adminId, tenantId } = await setup();
    const staffActor = await seedUser(prisma, tenantId, { email: "staff-f1c@t.t", name: "Staff", passwordHash: "x", roleIds: [core.roleIds.VIEWER] });
    const admin2 = await seedUser(prisma, tenantId, { email: "admin2-f1c@t.t", name: "Admin2", passwordHash: "x", roleIds: [core.roleIds.SUPER_ADMIN] });
    await expect(
      updateUser({ tenantId, actorId: staffActor, isSuperAdmin: false, permissions: [], userId: admin2, name: "Hacked Name" }),
    ).rejects.toMatchObject({ code: "forbidden", message: "super_admin_protected" });

    await updateUser({ tenantId, actorId: adminId, isSuperAdmin: true, permissions: [], userId: admin2, name: "Renamed By Super" });
    const list = await listUsers(tenantId, { page: 1, perPage: 20, search: "admin2-f1c@", status: "all" });
    expect(list.items[0].name).toBe("Renamed By Super");
  });

  it("setUserActive: ระงับ/เปิดใช้งานผู้ใช้ที่ถือ SUPER_ADMIN ได้เฉพาะ super admin", async () => {
    const { core, adminId, tenantId } = await setup();
    const staffActor = await seedUser(prisma, tenantId, { email: "staff-f1d@t.t", name: "Staff", passwordHash: "x", roleIds: [core.roleIds.VIEWER] });
    // มี super admin active สองคน (adminId, admin2) — guard last_super_admin ไม่ทำงานในเคสนี้ จึง
    // พิสูจน์ได้ว่า forbidden มาจาก guard F1 ล้วน ๆ ไม่ปนกับ last_super_admin
    const admin2 = await seedUser(prisma, tenantId, { email: "admin2-f1d@t.t", name: "Admin2", passwordHash: "x", roleIds: [core.roleIds.SUPER_ADMIN] });
    await expect(
      setUserActive({ tenantId, actorId: staffActor, isSuperAdmin: false, permissions: [], userId: admin2, isActive: false }),
    ).rejects.toMatchObject({ code: "forbidden", message: "super_admin_protected" });

    await setUserActive({ tenantId, actorId: adminId, isSuperAdmin: true, permissions: [], userId: admin2, isActive: false });
    const list = await listUsers(tenantId, { page: 1, perPage: 20, search: "admin2-f1d@", status: "all" });
    expect(list.items[0].isActive).toBe(false);
  });

  it("issuePasswordSetupLink: ออกลิงก์ตั้งรหัสผ่านให้ผู้ใช้ที่ถือ SUPER_ADMIN ได้เฉพาะ super admin", async () => {
    const { core, adminId, tenantId } = await setup();
    const staffActor = await seedUser(prisma, tenantId, { email: "staff-f1e@t.t", name: "Staff", passwordHash: "x", roleIds: [core.roleIds.VIEWER] });
    const admin2 = await seedUser(prisma, tenantId, { email: "admin2-f1e@t.t", name: "Admin2", passwordHash: "x", roleIds: [core.roleIds.SUPER_ADMIN] });
    await expect(
      issuePasswordSetupLink({ tenantId, actorId: staffActor, isSuperAdmin: false, permissions: [], userId: admin2 }),
    ).rejects.toMatchObject({ code: "forbidden", message: "super_admin_protected" });

    const r = await issuePasswordSetupLink({ tenantId, actorId: adminId, isSuperAdmin: true, permissions: [], userId: admin2 });
    expect(r.rawToken).toBeTruthy();
  });

  it("requestEmailChange: เปลี่ยนอีเมลของผู้ใช้ที่ถือ SUPER_ADMIN ได้เฉพาะ super admin", async () => {
    const { core, adminId, tenantId } = await setup();
    const staffActor = await seedUser(prisma, tenantId, { email: "staff-f1f@t.t", name: "Staff", passwordHash: "x", roleIds: [core.roleIds.VIEWER] });
    const admin2 = await seedUser(prisma, tenantId, { email: "admin2-f1f@t.t", name: "Admin2", passwordHash: "x", roleIds: [core.roleIds.SUPER_ADMIN] });
    await expect(
      requestEmailChange({ tenantId, actorId: staffActor, isSuperAdmin: false, permissions: [], userId: admin2, newEmail: "stolen@t.t" }),
    ).rejects.toMatchObject({ code: "forbidden", message: "super_admin_protected" });

    const r = await requestEmailChange({ tenantId, actorId: adminId, isSuperAdmin: true, permissions: [], userId: admin2, newEmail: "legit-f1f@t.t" });
    expect(r.rawToken).toBeTruthy();
  });
});

/**
 * F2 (รีวิวรอบสุดท้าย ข้อ 2) — ผู้กระทำที่ไม่ใช่ super admin มอบ "บทบาท" ที่ถือสิทธิ์ซึ่งตัวเองไม่มีให้ใครไม่ได้
 *
 * รอบก่อนปิดฝั่ง "สร้างบทบาท" ไปแล้ว (A7 `assertCanGrantPermissions` ใน `role.service.ts`) แต่ฝั่ง
 * "มอบบทบาท" ยังเปิดอยู่: `assertCanAssignRoles` ปฏิเสธเฉพาะบทบาท SUPER_ADMIN และไม่เคยดูเลยว่า
 * บทบาทที่กำลังมอบนั้นถือสิทธิ์อะไรบ้าง ผู้ถือ `users:manage` (แต่ไม่มี `settings:manage`) จึงมอบบทบาท
 * ADMIN ที่ seed มาให้บัญชีที่ตัวเองสร้าง แล้วเรียก `issuePasswordLinkAction` รับลิงก์ตั้งรหัสผ่านของ
 * บัญชีนั้นมาบนจอ ตั้งรหัสแล้ว login เป็นหุ่นเชิดที่ถือสิทธิ์ identity ครบทุกตัว — ยกระดับสิทธิ์เต็มวง
 * โดยไม่ต้องแตะ SUPER_ADMIN และไม่ต้องสร้างบทบาทใหม่ (จึงไม่โดน guard A7) เลยสักครั้ง
 *
 * `permissions` ของผู้กระทำมาจาก session snapshot (`ctx.permissions` จาก requirePermission) เหมือน
 * `isSuperAdmin` ของ F1 — ไม่ re-derive จากฐานข้อมูลเอง บทบาทจริงของ actor ใน DB จึงไม่ใช่ที่มาของอำนาจ
 */
describe("user.service — F2: มอบบทบาทที่ถือสิทธิ์เกินตัวผู้กระทำไม่ได้", () => {
  /** ผู้กระทำถือ users:read + users:manage (พอเข้าหน้าผู้ใช้และสร้างผู้ใช้ได้) แต่ไม่มีอีกสามสิทธิ์ที่ ADMIN ถือ */
  const staff = { isSuperAdmin: false, permissions: ["users:read", "users:manage"] };
  const at = (roleId: string) => [{ roleId, scopeType: "ALL" as const, scopeId: null }];

  it("createUser: มอบบทบาทที่ถือสิทธิ์ที่ตัวเองไม่มีไม่ได้ แต่บทบาทที่เป็นสับเซตมอบได้", async () => {
    const { core, tenantId } = await setup();
    const staffActor = await seedUser(prisma, tenantId, { email: "staff-f2a@t.t", name: "Staff", passwordHash: "x", roleIds: [core.roleIds.STAFF] });
    const actor = { tenantId, actorId: staffActor, ...staff };

    await expect(createUser({ ...actor, email: "escalate-f2a@t.t", name: "Escalate", roles: at(core.roleIds.ADMIN) }))
      .rejects.toMatchObject({ code: "forbidden", message: "cannot_grant_unheld_permission" });
    expect(await prisma.user.findUnique({ where: { email: "escalate-f2a@t.t" } })).toBeNull();

    // VIEWER ถือแค่ users:read ซึ่งอยู่ในมือผู้กระทำอยู่แล้ว — ไม่ใช่การยกระดับ จึงต้องผ่านตามปกติ
    const r = await createUser({ ...actor, email: "ok-f2a@t.t", name: "Ok", roles: at(core.roleIds.VIEWER) });
    expect(r.user.email).toBe("ok-f2a@t.t");
  });

  it("updateUser: เติมบทบาทที่ถือสิทธิ์เกินตัวให้ผู้ใช้ที่มีอยู่ไม่ได้ และบทบาทเดิมต้องไม่ถูกแตะ", async () => {
    const { core, adminId, tenantId } = await setup();
    const staffActor = await seedUser(prisma, tenantId, { email: "staff-f2b@t.t", name: "Staff", passwordHash: "x", roleIds: [core.roleIds.STAFF] });
    const target = await seedUser(prisma, tenantId, { email: "target-f2b@t.t", name: "Target", passwordHash: "x", roleIds: [core.roleIds.VIEWER] });

    await expect(updateUser({ tenantId, actorId: staffActor, ...staff, userId: target, name: "Promoted", roles: at(core.roleIds.ADMIN) }))
      .rejects.toMatchObject({ code: "forbidden", message: "cannot_grant_unheld_permission" });
    const after = (await listUsers(tenantId, { page: 1, perPage: 20, search: "target-f2b@", status: "all" })).items[0];
    expect(after.roles.map((r) => r.code)).toEqual(["VIEWER"]); // ทั้ง transaction ต้อง rollback ไม่ใช่แค่ครึ่งเดียว
    expect(after.name).toBe("Target");

    // super admin ยังทำได้ตามปกติ — guard นี้ผูกกับสิทธิ์ที่ถือ ไม่ใช่ห้ามมอบ ADMIN โดยสิ้นเชิง
    await updateUser({ tenantId, actorId: adminId, isSuperAdmin: true, permissions: [], userId: target, roles: at(core.roleIds.ADMIN) });
    expect((await listUsers(tenantId, { page: 1, perPage: 20, search: "target-f2b@", status: "all" })).items[0].roles.map((r) => r.code)).toEqual(["ADMIN"]);
  });

  it("โซ่โจมตีเต็มวง: สร้างหุ่นเชิดถือ ADMIN → รับลิงก์ตั้งรหัสผ่าน → ได้สิทธิ์เกินตัว — ต้องขาดตั้งแต่ขั้นแรก", async () => {
    const { core, tenantId } = await setup();
    const staffActor = await seedUser(prisma, tenantId, { email: "staff-f2c@t.t", name: "Staff", passwordHash: "x", roleIds: [core.roleIds.STAFF] });
    const actor = { tenantId, actorId: staffActor, ...staff };

    // ขั้นที่ 1 — สร้างหุ่นเชิดพร้อมบทบาท ADMIN ทีเดียวจบ
    await expect(createUser({ ...actor, email: "puppet-f2c@t.t", name: "Puppet", roles: at(core.roleIds.ADMIN) }))
      .rejects.toMatchObject({ code: "forbidden", message: "cannot_grant_unheld_permission" });
    expect(await prisma.user.findUnique({ where: { email: "puppet-f2c@t.t" } })).toBeNull();

    // ขั้นที่ 1' — เลี่ยงเป็นสองจังหวะ: สร้างด้วยบทบาทที่มอบได้จริงก่อน แล้วค่อยเติม ADMIN ทีหลัง
    const puppet = await createUser({ ...actor, email: "puppet-f2c@t.t", name: "Puppet", roles: at(core.roleIds.VIEWER) });
    await expect(updateUser({ ...actor, userId: puppet.user.id, roles: at(core.roleIds.ADMIN) }))
      .rejects.toMatchObject({ code: "forbidden", message: "cannot_grant_unheld_permission" });

    // ขั้นที่ 2 — ลิงก์ตั้งรหัสผ่านยังออกได้ตามปกติ (ไม่ใช่จุดที่ต้องกัน) ...
    const link = await issuePasswordSetupLink({ ...actor, userId: puppet.user.id });
    expect(link.rawToken).toBeTruthy();

    // ขั้นที่ 3 — ... แต่หุ่นเชิดที่ยึดได้ถือสิทธิ์ไม่เกินมือผู้กระทำแม้แต่ตัวเดียว โซ่จึงไม่ให้อะไรเพิ่ม
    const rows = await prisma.rolePermission.findMany({
      where: { role: { userRoles: { some: { userTenant: { userId: puppet.user.id, tenantId } } } } },
      select: { permission: { select: { code: true } } },
    });
    const gained = rows.map((r) => r.permission.code).filter((c) => !staff.permissions.includes(c));
    expect(gained).toEqual([]);
  });
});
