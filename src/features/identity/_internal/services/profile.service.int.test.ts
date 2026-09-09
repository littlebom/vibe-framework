import { describe, it, expect } from "vitest";
import { prisma } from "@/shared/lib/infra/prisma";
import { seedCore, seedUser } from "../../../../../prisma/lib/seed-core";
import { updateProfile } from "./profile.service";

async function setup() {
  const core = await seedCore(prisma, { tenantCode: "T", nameTh: "ท", nameEn: "T" });
  const userId = await seedUser(prisma, core.tenantId, { email: "u@t.t", name: "เดิม", passwordHash: "x", roleIds: [core.roleIds.VIEWER] });
  return { core, userId };
}

describe("profile.service", () => {
  it("เปลี่ยนชื่อ → บันทึก audit หนึ่งแถว", async () => {
    const { userId } = await setup();
    await updateProfile(userId, { name: "ใหม่", locale: "th" });
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(user.name).toBe("ใหม่");
    expect(await prisma.auditLog.count({ where: { entityId: userId, action: { contains: "profile" } } })).toBe(1);
  });

  it("เปลี่ยนแค่ locale → ไม่บันทึก audit", async () => {
    const { userId } = await setup();
    await updateProfile(userId, { name: "เดิม", locale: "en" });
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(user.locale).toBe("en");
    expect(await prisma.auditLog.count({ where: { entityId: userId } })).toBe(0);
  });
});
