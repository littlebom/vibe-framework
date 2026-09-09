import { describe, it, expect } from "vitest";
import { prisma } from "@/shared/lib/infra/prisma";
import { issueToken, consumeToken, TOKEN_TTL } from "./tokens";

async function user() {
  return prisma.user.create({ data: { email: `t${Date.now()}@x.y`, name: "t" } });
}

describe("tokens", () => {
  it("ออกแล้วใช้ได้ครั้งเดียว", async () => {
    const u = await user();
    const { raw } = await issueToken({ userId: u.id, purpose: "PASSWORD_RESET", ttlMs: TOKEN_TTL.PASSWORD_RESET });
    expect(await consumeToken(raw, "PASSWORD_RESET")).toEqual({ userId: u.id, payload: null });
    expect(await consumeToken(raw, "PASSWORD_RESET")).toBeNull();
  });
  it("ผิด purpose / หมดอายุ / ปลอม → null", async () => {
    const u = await user();
    const { raw } = await issueToken({ userId: u.id, purpose: "EMAIL_VERIFY", ttlMs: -1, payload: { newEmail: "n@x.y" } });
    expect(await consumeToken(raw, "EMAIL_VERIFY")).toBeNull();
    const ok = await issueToken({ userId: u.id, purpose: "EMAIL_VERIFY", ttlMs: 60_000, payload: { newEmail: "n@x.y" } });
    expect(await consumeToken(ok.raw, "PASSWORD_RESET")).toBeNull();
    expect(await consumeToken("not-a-token", "EMAIL_VERIFY")).toBeNull();
    expect(await consumeToken(ok.raw, "EMAIL_VERIFY")).toEqual({ userId: u.id, payload: { newEmail: "n@x.y" } });
  });
  it("ใช้ PASSWORD_RESET แล้ว โทเคน PASSWORD_RESET อื่นของคนเดียวกันถูกยกเลิก", async () => {
    const u = await user();
    const a = await issueToken({ userId: u.id, purpose: "PASSWORD_RESET", ttlMs: 60_000 });
    const b = await issueToken({ userId: u.id, purpose: "PASSWORD_RESET", ttlMs: 60_000 });
    expect(await consumeToken(b.raw, "PASSWORD_RESET")).not.toBeNull();
    expect(await consumeToken(a.raw, "PASSWORD_RESET")).toBeNull();
  });
  it("ใช้โทเคน PASSWORD_RESET สองใบของคนเดียวกันพร้อมกัน (concurrent) — สำเร็จได้ใบเดียว", async () => {
    // อุ่น connection pool ให้มี 2 การเชื่อมต่อพร้อมใช้งานก่อน — คู่แรกทิ้งไป (คู่เย็นมักไม่ชนกันเพราะการเปิด
    // connection ใหม่ของฝั่งที่สองช้ากว่าอีกฝั่งที่ได้ connection ว่างไปก่อน ทำให้ทั้งคู่ดูเหมือนไม่แข่งกันเลย)
    const warm = await user();
    const wa = await issueToken({ userId: warm.id, purpose: "PASSWORD_RESET", ttlMs: 60_000 });
    const wb = await issueToken({ userId: warm.id, purpose: "PASSWORD_RESET", ttlMs: 60_000 });
    await Promise.all([consumeToken(wa.raw, "PASSWORD_RESET"), consumeToken(wb.raw, "PASSWORD_RESET")]);

    const u = await user();
    const a = await issueToken({ userId: u.id, purpose: "PASSWORD_RESET", ttlMs: 60_000 });
    const b = await issueToken({ userId: u.id, purpose: "PASSWORD_RESET", ttlMs: 60_000 });
    const [ra, rb] = await Promise.all([consumeToken(a.raw, "PASSWORD_RESET"), consumeToken(b.raw, "PASSWORD_RESET")]);
    const succeeded = [ra, rb].filter((r) => r !== null);
    expect(succeeded).toHaveLength(1);
  });

  it("เก็บเฉพาะ hash ไม่เก็บโทเคนดิบ", async () => {
    const u = await user();
    const { raw } = await issueToken({ userId: u.id, purpose: "PASSWORD_RESET", ttlMs: 60_000 });
    const rows = await prisma.authToken.findMany();
    expect(rows[0].tokenHash).not.toBe(raw);
    expect(rows[0].tokenHash).toHaveLength(64);
  });
});
