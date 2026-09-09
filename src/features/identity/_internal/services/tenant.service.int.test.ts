import { describe, it, expect, vi, afterEach } from "vitest";
import { prisma } from "@/shared/lib/infra/prisma";
import { DEFAULT_PALETTE } from "@/shared/lib/palette";
import { seedCore, seedUser } from "../../../../../prisma/lib/seed-core";
import { getTenantSettings, updateTenantSettings, getTenantPalette, resolvePalette } from "./tenant.service";

describe("tenant.service", () => {
  it("อ่านและแก้ตั้งค่า palette เปลี่ยนตาม และบันทึก audit", async () => {
    const core = await seedCore(prisma, { tenantCode: "T", nameTh: "ท", nameEn: "T" });
    const adminId = await seedUser(prisma, core.tenantId, { email: "a@t.t", name: "A", passwordHash: "x", roleIds: [core.roleIds.SUPER_ADMIN] });
    expect(await getTenantPalette(core.tenantId)).toBe("blue");
    await updateTenantSettings({ tenantId: core.tenantId, actorId: adminId, nameTh: "ม.ใหม่", nameEn: "New U", logoUrl: "", palette: "green" });
    const s = await getTenantSettings(core.tenantId);
    expect(s).toMatchObject({ code: "T", nameTh: "ม.ใหม่", nameEn: "New U", logoUrl: null, palette: "green" });
    expect(await getTenantPalette(core.tenantId)).toBe("green");
    expect(await prisma.auditLog.count({ where: { action: "tenant.settings_update" } })).toBe(1);
  });

  it("updateTenantSettings ต้อง merge เข้า settings JSON ไม่ทับคีย์อื่นที่ฟีเจอร์ในอนาคตเก็บไว้", async () => {
    const core = await seedCore(prisma, { tenantCode: "T2", nameTh: "ท2", nameEn: "T2" });
    const adminId = await seedUser(prisma, core.tenantId, { email: "a2@t.t", name: "A2", passwordHash: "x", roleIds: [core.roleIds.SUPER_ADMIN] });
    await prisma.tenant.update({ where: { id: core.tenantId }, data: { settings: { palette: "blue", futureFeature: { foo: "bar" } } } });

    await updateTenantSettings({ tenantId: core.tenantId, actorId: adminId, nameTh: "ม.2", nameEn: "U2", logoUrl: "", palette: "green" });

    const t = await prisma.tenant.findUniqueOrThrow({ where: { id: core.tenantId } });
    expect(t.settings).toMatchObject({ palette: "green", futureFeature: { foo: "bar" } });
  });
});

/**
 * B15 — `resolvePalette` ทำงานทุก request จาก root layout, หา tenant ได้สามทาง และกลืน error
 * ทุกชนิดเป็น DEFAULT_PALETTE ใน catch — การค้นหาที่พังจึงเสื่อมลงอย่างเงียบ ๆ และถาวรโดยไม่มีใครรู้
 * เทสต์นี้ปักทั้งสามเส้นทางไว้ (เทสต์รันนอก request ของ Next จึงไม่มี session — เส้นทาง fallback
 * ไป tenant แรกคือเส้นทางที่หน้า /login ใช้จริง)
 */
describe("resolvePalette", () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it("ไม่มี session → ใช้ tenant แรกตามวันที่สร้าง (เส้นทางของหน้า login)", async () => {
    const core = await seedCore(prisma, { tenantCode: "T3", nameTh: "ท3", nameEn: "T3" });
    await prisma.tenant.update({ where: { id: core.tenantId }, data: { settings: { palette: "purple" } } });
    expect(await resolvePalette()).toBe("purple");
  });

  it("ยังไม่มี tenant สักตัว (ก่อน bootstrap) → ค่าเริ่มต้น", async () => {
    expect(await prisma.tenant.count()).toBe(0);
    expect(await resolvePalette()).toBe(DEFAULT_PALETTE);
  });

  it("การค้นหา tenant ล้ม → ค่าเริ่มต้น ไม่ throw ออกไปพัง root layout", async () => {
    await seedCore(prisma, { tenantCode: "T4", nameTh: "ท4", nameEn: "T4" });
    vi.spyOn(prisma.tenant, "findFirst").mockRejectedValue(new Error("db down"));
    expect(await resolvePalette()).toBe(DEFAULT_PALETTE);
  });
});
