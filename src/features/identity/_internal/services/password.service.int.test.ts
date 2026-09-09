import { describe, it, expect, vi } from "vitest";
import { prisma } from "@/shared/lib/infra/prisma";
import { hashPassword, verifyPassword } from "@/shared/lib/security/password";
import { sendMail } from "@/shared/lib/infra/mailer";
import { seedCore, seedUser } from "../../../../../prisma/lib/seed-core";
import { requestPasswordReset, resetPasswordWithToken, changeOwnPassword } from "./password.service";
import { issueToken, TOKEN_TTL } from "../tokens";
import { throttleKeys, isLoginThrottled } from "../throttle";
import { MAX_FAILURES } from "../throttle-rules";

vi.mock("@/shared/lib/infra/mailer", () => ({ sendMail: vi.fn(async () => ({ delivered: false })) }));

async function setup() {
  const core = await seedCore(prisma, { tenantCode: "T", nameTh: "ท", nameEn: "T" });
  const userId = await seedUser(prisma, core.tenantId, { email: "a@b.c", name: "A", passwordHash: await hashPassword("OldPass123!"), roleIds: [core.roleIds.VIEWER], mustChangePassword: true });
  return { core, userId };
}

describe("password.service", () => {
  it("requestPasswordReset ออกโทเคนเมื่อมีบัญชี และไม่ throw เมื่อไม่มี", async () => {
    await setup();
    await expect(requestPasswordReset("nobody@b.c")).resolves.toBeUndefined();
    expect(await prisma.authToken.count()).toBe(0);
    await requestPasswordReset("A@B.C");
    expect(await prisma.authToken.count({ where: { purpose: "PASSWORD_RESET" } })).toBe(1);
  });
  it("resetPasswordWithToken ตั้งรหัสใหม่ ล้าง mustChangePassword และตั้ง emailVerified", async () => {
    const { userId } = await setup();
    const { raw } = await issueToken({ userId, purpose: "PASSWORD_RESET", ttlMs: TOKEN_TTL.PASSWORD_SETUP });
    await resetPasswordWithToken(raw, "NewPass123!");
    const u = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(await verifyPassword("NewPass123!", u.passwordHash!)).toBe(true);
    expect(u.mustChangePassword).toBe(false);
    expect(u.emailVerified).toBe(true);
    await expect(resetPasswordWithToken(raw, "Again123!")).rejects.toMatchObject({ code: "not_found" });
  });
  it("changeOwnPassword ตรวจรหัสเดิม และล้าง mustChangePassword", async () => {
    const { userId } = await setup();
    await expect(changeOwnPassword(userId, "wrong", "NewPass123!")).rejects.toMatchObject({ code: "validation" });
    await changeOwnPassword(userId, "OldPass123!", "NewPass123!");
    const u = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(await verifyPassword("NewPass123!", u.passwordHash!)).toBe(true);
    expect(u.mustChangePassword).toBe(false);
  });
});

/**
 * A3 — `requestPasswordReset` เป็นทางเข้าที่ไม่ต้อง login เลย จึงต้องปิดสองช่องพร้อมกัน:
 * (1) oracle บอกว่ามีบัญชีหรือไม่ — เดิมเส้นทาง "มีบัญชี" `await sendMail` ทั้งรอบ ส่วนเส้นทาง
 *     "ไม่มีบัญชี" คืนทันที ต่างกันเป็นเวลาเดินทางของ SMTP ทั้งรอบเมื่อมี SMTP จริง
 * (2) ไม่มีเพดานจำนวนคำขอ — ใครก็สั่งให้ระบบส่งอีเมลและสร้างแถวโทเคนกี่ครั้งก็ได้
 * ใช้ throttle ตัวเดิม (`_internal/throttle.ts`) คนละ namespace กับ login และคีย์ **อีเมลอย่างเดียว**
 * (รีวิวรอบสุดท้าย ข้อ 5 — ดูเหตุผลใน `requestPasswordReset`: คีย์ IP ล็อกทั้งวิทยาเขตที่อยู่หลัง NAT
 * และผู้โจมตีเปลี่ยนคีย์หนีได้ฟรีเมื่อ `x-forwarded-for` ไม่ได้มาจาก proxy ที่เชื่อถือได้)
 */
describe("password.service — A3: throttle และ oracle ของ forgot-password", () => {
  it("อีเมลที่มีบัญชีกับไม่มีบัญชีคืนผลเหมือนกัน และคำขอถัดจากโควตาถูกปฏิเสธ", async () => {
    await setup();
    // นับแยกรายอีเมลแล้ว จึงต้องยิงให้ครบโควตาทั้งสองฝั่ง — ที่ต้องเหมือนกันคือ "ผลลัพธ์" ของสองอีเมล
    // ในสถานะเดียวกัน (ยังไม่เกินโควตา → undefined ทั้งคู่ · เกินแล้ว → rate_limited ทั้งคู่)
    for (let i = 0; i < MAX_FAILURES; i++) {
      await expect(requestPasswordReset("a@b.c")).resolves.toBeUndefined();
      await expect(requestPasswordReset("nobody@b.c")).resolves.toBeUndefined();
    }
    await expect(requestPasswordReset("a@b.c")).rejects.toMatchObject({ code: "rate_limited" });
    await expect(requestPasswordReset("nobody@b.c")).rejects.toMatchObject({ code: "rate_limited" });
  });

  it("ไม่ await การส่งอีเมล — เวลาตอบกลับจึงไม่ขึ้นกับว่ามีบัญชีจริงหรือไม่", async () => {
    await setup();
    // อีเมลที่ค้างไม่มีวันเสร็จ = SMTP ที่ตอบช้าที่สุดเท่าที่เป็นไปได้ ถ้ายัง await อยู่เคสนี้จะค้างจนหมดเวลา
    vi.mocked(sendMail).mockImplementationOnce(() => new Promise<{ delivered: boolean }>(() => {}));
    await expect(requestPasswordReset("a@b.c")).resolves.toBeUndefined();
    expect(await prisma.authToken.count({ where: { purpose: "PASSWORD_RESET" } })).toBe(1);
  });

  it("ไม่ใช้คีย์ throttle ร่วมกับ login — ขอลิงก์รีเซ็ตรัว ๆ ต้องไม่ล็อกการ login ของอีเมลนั้น", async () => {
    await setup();
    for (let i = 0; i < MAX_FAILURES; i++) await requestPasswordReset("a@b.c");
    expect(await isLoginThrottled(throttleKeys("a@b.c", "10.0.0.3"))).toBe(false);
  });

  it("ไม่ผูกกับ IP — คนอื่นหลัง NAT เดียวกันต้องไม่ถูกล็อกตามไปด้วย", async () => {
    await setup();
    for (let i = 0; i < MAX_FAILURES; i++) await requestPasswordReset("a@b.c");
    await expect(requestPasswordReset("a@b.c")).rejects.toMatchObject({ code: "rate_limited" });
    // อีเมลอื่นยังขอได้ตามปกติ และต้องไม่มีแถวคีย์ IP ในสโคป forgot เกิดขึ้นเลยตั้งแต่แรก
    await expect(requestPasswordReset("nobody@b.c")).resolves.toBeUndefined();
    expect(await prisma.loginThrottle.count({ where: { key: { startsWith: "forgot:ip:" } } })).toBe(0);
  });
});
