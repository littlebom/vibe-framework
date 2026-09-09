import { describe, it, expect } from "vitest";
import { prisma } from "@/shared/lib/infra/prisma";
import { seedCore } from "./seed-core";
import { ALL_PERMISSIONS } from "@/permissions";

describe("seedCore", () => {
  it("สร้าง tenant, permissions ทั้งหมด และบทบาทตั้งต้น 4 ตัว", async () => {
    const r = await seedCore(prisma, { tenantCode: "TEST", nameTh: "องค์กรทดสอบ", nameEn: "Test Org" });
    expect(await prisma.permission.count()).toBe(ALL_PERMISSIONS.length);
    const roles = await prisma.role.findMany({ where: { tenantId: r.tenantId } });
    expect(roles.map((x) => x.code).sort()).toEqual(["ADMIN", "STAFF", "SUPER_ADMIN", "VIEWER"]);
    expect(roles.find((x) => x.code === "SUPER_ADMIN")!.isSystem).toBe(true);
    const admin = await prisma.role.findFirst({ where: { code: "ADMIN" }, include: { rolePermissions: true } });
    expect(admin!.rolePermissions.length).toBe(5);
    const superAdmin = await prisma.role.findFirst({ where: { code: "SUPER_ADMIN" }, include: { rolePermissions: true } });
    expect(superAdmin!.rolePermissions.length).toBe(0);
  });
  it("รันซ้ำได้โดยไม่สร้างซ้ำ", async () => {
    await seedCore(prisma, { tenantCode: "TEST", nameTh: "a", nameEn: "a" });
    await seedCore(prisma, { tenantCode: "TEST", nameTh: "a", nameEn: "a" });
    expect(await prisma.tenant.count()).toBe(1);
    expect(await prisma.role.count()).toBe(4);
    expect(await prisma.permission.count()).toBe(ALL_PERMISSIONS.length);
  });
});
