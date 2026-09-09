import { describe, it, expect, vi } from "vitest";
import { prisma } from "@/shared/lib/infra/prisma";
import { seedCore, seedUser } from "../../../../prisma/lib/seed-core";
import { applyAuthorizationSnapshot, loadAuthorizationSnapshot, needsRevalidation, REVALIDATE_MS, type RevalidatableToken, type SnapshotLoader } from "./revalidate";

async function setup() {
  const core = await seedCore(prisma, { tenantCode: "T", nameTh: "ท", nameEn: "T" });
  const userId = await seedUser(prisma, core.tenantId, { email: "a@b.c", name: "A", passwordHash: "x", roleIds: [core.roleIds.ADMIN, core.roleIds.VIEWER] });
  return { core, userId };
}

describe("needsRevalidation", () => {
  it("เกิน 5 นาทีหรือไม่เคยตรวจ → ต้องตรวจ", () => {
    const now = 1_000_000_000;
    expect(needsRevalidation(undefined, now)).toBe(true);
    expect(needsRevalidation(now - REVALIDATE_MS - 1, now)).toBe(true);
    expect(needsRevalidation(now - 1000, now)).toBe(false);
  });
});

describe("loadAuthorizationSnapshot", () => {
  it("คืน grants รวมจากหลายบทบาท", async () => {
    const { core, userId } = await setup();
    const s = await loadAuthorizationSnapshot(userId, core.tenantId);
    expect(s && !s.invalid && s.permissions.sort()).toEqual(["audit:read", "roles:manage", "settings:manage", "users:manage", "users:read"]);
    expect(s && !s.invalid && s.roles.map((r) => r.code).sort()).toEqual(["ADMIN", "VIEWER"]);
  });
  it("ผู้ใช้ถูกระงับ / สมาชิกภาพปิด / ไม่มีสมาชิกภาพ → invalid", async () => {
    const { core, userId } = await setup();
    await prisma.user.update({ where: { id: userId }, data: { isActive: false } });
    expect(await loadAuthorizationSnapshot(userId, core.tenantId)).toEqual({ invalid: true });
    await prisma.user.update({ where: { id: userId }, data: { isActive: true } });
    await prisma.userTenant.updateMany({ where: { userId }, data: { isActive: false } });
    expect(await loadAuthorizationSnapshot(userId, core.tenantId)).toEqual({ invalid: true });
    expect(await loadAuthorizationSnapshot(userId, "00000000-0000-0000-0000-000000000000")).toEqual({ invalid: true });
  });
  it("สะท้อน mustChangePassword และ locale ล่าสุด", async () => {
    const { core, userId } = await setup();
    await prisma.user.update({ where: { id: userId }, data: { mustChangePassword: true, locale: "en" } });
    const s = await loadAuthorizationSnapshot(userId, core.tenantId);
    expect(s && !s.invalid && s.mustChangePassword).toBe(true);
    expect(s && !s.invalid && s.locale).toBe("en");
  });
});

/**
 * A5 — วงจร revalidate ทุก 5 นาที (เป้าหมาย B1.5) เดิมมีอยู่ที่เดียวคือเงื่อนไขในบรรทัดของ `jwt`
 * callback ใน `_internal/auth.ts` และไม่มีเทสต์ไหนแตะเลย: ลบเงื่อนไข `needsRevalidation(token.checkedAt)`
 * ทิ้ง เทสต์ทั้ง 173 ตัวก็ยังเขียว (e2e/users.spec.ts ที่ชื่อ "(revalidate)" ยอมรับเองในคอมเมนต์ว่ามัน
 * ทดสอบการโหลด snapshot ตอน login ใหม่ ซึ่งเดินคนละกิ่ง) ขั้นแก้ token จึงถูกแยกออกมาเป็น
 * `applyAuthorizationSnapshot` (บริสุทธิ์: รับ token + ตัวโหลด คืน token ใหม่) เพื่อทดสอบตรง ๆ ที่นี่
 */
describe("applyAuthorizationSnapshot", () => {
  const countingLoader = (): { load: SnapshotLoader; calls: () => number } => {
    const fn = vi.fn(loadAuthorizationSnapshot);
    return { load: fn, calls: () => fn.mock.calls.length };
  };

  it("checkedAt เก่าเกิน 5 นาที → โหลด snapshot ใหม่และประทับเวลาใหม่", async () => {
    const { core, userId } = await setup();
    const now = Date.now();
    const loader = countingLoader();
    const token: RevalidatableToken = { userId, tenantId: core.tenantId, checkedAt: now - REVALIDATE_MS - 1, permissions: ["stale:only"], isSuperAdmin: true };
    const next = await applyAuthorizationSnapshot(token, loader.load, now);
    expect(loader.calls()).toBe(1);
    expect(next.permissions!.sort()).toEqual(["audit:read", "roles:manage", "settings:manage", "users:manage", "users:read"]);
    expect(next.isSuperAdmin).toBe(false);
    expect(next.invalid).toBe(false);
    expect(next.checkedAt).toBe(now);
  });

  it("checkedAt ยังสด → ไม่ query ฐานข้อมูลซ้ำและไม่แตะ token เลย", async () => {
    const { core, userId } = await setup();
    const now = Date.now();
    const loader = countingLoader();
    const token: RevalidatableToken = { userId, tenantId: core.tenantId, checkedAt: now - 1000, permissions: ["users:read"], isSuperAdmin: false };
    const next = await applyAuthorizationSnapshot(token, loader.load, now);
    expect(loader.calls()).toBe(0);
    expect(next.permissions).toEqual(["users:read"]);
    expect(next.checkedAt).toBe(now - 1000);
  });

  it("สมาชิกภาพถูกปิดระหว่างทาง → token invalid (นี่คือกลไกที่เตะผู้ถูกระงับออกภายใน 5 นาที)", async () => {
    const { core, userId } = await setup();
    await prisma.user.update({ where: { id: userId }, data: { isActive: false } });
    const now = Date.now();
    const next = await applyAuthorizationSnapshot({ userId, tenantId: core.tenantId, checkedAt: 0 } as RevalidatableToken, loadAuthorizationSnapshot, now);
    expect(next.invalid).toBe(true);
    expect(next.checkedAt).toBe(now);
  });

  it("ตัวโหลดคืน null (ฐานข้อมูลล้ม) → คงสิทธิ์เดิมไว้ ไม่เตะผู้ใช้ที่ถูกต้องออก (fail open)", async () => {
    const now = Date.now();
    const token = { userId: "u", tenantId: "t", checkedAt: 0, permissions: ["users:read"], invalid: false };
    const next = await applyAuthorizationSnapshot(token, async () => null, now);
    expect(next.permissions).toEqual(["users:read"]);
    expect(next.invalid).toBe(false);
    expect(next.checkedAt).toBe(now);
  });

  it("ยังไม่มี userId/tenantId (ยังไม่ login) → ไม่ทำอะไรเลย", async () => {
    const loader = countingLoader();
    const next = await applyAuthorizationSnapshot({ checkedAt: 0 }, loader.load, Date.now());
    expect(loader.calls()).toBe(0);
    expect(next.checkedAt).toBe(0);
  });
});
