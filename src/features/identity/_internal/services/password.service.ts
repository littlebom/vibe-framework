import { prisma } from "@/shared/lib/infra/prisma";
import { env } from "@/shared/lib/infra/env";
import { sendMail } from "@/shared/lib/infra/mailer";
import { errors } from "@/shared/lib/errors";
import { hashPassword, verifyPassword } from "@/shared/lib/security/password";
import { asLocale } from "@/shared/lib/i18n/config";
import { logger } from "@/shared/lib/infra/logger";
import { issueToken, consumeToken, TOKEN_TTL } from "../tokens";
import { passwordResetEmail } from "../email-templates";
import { writeAudit } from "../audit";
import { throttleKeys, isLoginThrottled, recordLoginFailure } from "../throttle";

export function resetLink(raw: string): string {
  return `${env().APP_URL}/reset-password/${raw}`;
}

/** namespace ของ throttle สำหรับ forgot-password — แยกจากคีย์ของ login โดยเจตนา (ดู throttle.ts) */
const FORGOT_SCOPE = "forgot";

/**
 * ตอบเหมือนกันไม่ว่ามีบัญชีหรือไม่ — ผู้เรียกห้ามเปิดเผยผล
 *
 * A3: ทางเข้านี้ไม่ต้อง login จึงต้องกันสองเรื่อง
 * 1. **เพดานคำขอ** — ใช้ throttle ตัวเดียวกับ login แต่คนละ namespace และ **คีย์อีเมลอย่างเดียว**
 *    กันการยิงรัว ๆ ให้ระบบส่งอีเมลและสร้างแถวโทเคนไม่จำกัด · เกินโควตาแล้ว throw `rate_limited`
 *    เหมือนกันทุกอีเมล (ทั้งที่มีบัญชีและไม่มี) จึงไม่กลายเป็น oracle ตัวใหม่เสียเอง
 *
 *    ไม่มีคีย์ IP โดยเจตนา (รีวิวรอบสุดท้าย ข้อ 5): ปลายทางใช้งานจริงคือองค์กรที่อยู่หลัง NAT
 *    ขององค์กร คีย์ IP จึงแปลว่า "รีเซ็ตรหัสผ่านได้ห้าครั้งต่อสิบห้านาทีทั้งออฟฟิศ" — ล็อกคนที่ไม่ได้
 *    ทำอะไรผิด · และเมื่อไม่มี proxy ที่เชื่อถือได้เขียน `x-forwarded-for` ให้ ค่านั้นก็มาจากผู้โจมตีเอง
 *    เปลี่ยนคีย์หนีได้ฟรี ๆ ทุกคำขอ · สิ่งที่บีบ mail-bombing ได้จริงคือคีย์อีเมล ซึ่งยังอยู่ครบ
 *    (throttle ของ login ไม่เกี่ยวและไม่ถูกแตะ — ที่นั่น IP ยังเป็นคีย์ตามเดิม)
 * 2. **เวลาตอบกลับต้องไม่ผูกกับการมีอยู่ของบัญชี** — ห้าม `await sendMail` เพราะเส้นทาง "มีบัญชี" จะ
 *    ช้ากว่าเส้นทาง "ไม่มีบัญชี" เท่ากับเวลาเดินทางของ SMTP ทั้งรอบ (oracle ที่หยาบกว่าช่องว่าง bcrypt
 *    ที่ commit 0752df2 อุดไปมาก) — ยิงแล้วปล่อย จับ rejection เขียน log ไม่ throw ต่อ
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const keys = throttleKeys(email, null, FORGOT_SCOPE);
  if (await isLoginThrottled(keys)) {
    logger.warn("forgot-password throttled", { email });
    throw errors.rate_limited();
  }
  await recordLoginFailure(keys); // ที่นี่นับ "จำนวนคำขอ" ไม่ใช่ "จำนวนที่ผิดพลาด" — ทุกคำขอนับเสมอ
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user || !user.isActive) return;
  const { raw } = await issueToken({ userId: user.id, purpose: "PASSWORD_RESET", ttlMs: TOKEN_TTL.PASSWORD_RESET });
  const mail = passwordResetEmail(asLocale(user.locale), { name: user.name, link: resetLink(raw), hours: 1 });
  void sendMail({ to: user.email, ...mail }).catch((err: unknown) => {
    logger.error("password reset mail failed", { err: err instanceof Error ? err.message : String(err) });
  });
}

/** ใช้ทั้งลิงก์ตั้งรหัสครั้งแรก (แอดมินออก) และลืมรหัส — การเปิดลิงก์จากอีเมลพิสูจน์ความเป็นเจ้าของอีเมล */
export async function resetPasswordWithToken(raw: string, password: string): Promise<{ userId: string }> {
  const consumed = await consumeToken(raw, "PASSWORD_RESET");
  if (!consumed) throw errors.not_found("token_invalid");
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.update({ where: { id: consumed.userId }, data: { passwordHash, mustChangePassword: false, emailVerified: true } });
  const ut = await prisma.userTenant.findFirst({ where: { userId: user.id }, select: { tenantId: true } });
  if (ut) await writeAudit({ tenantId: ut.tenantId, actorId: user.id, action: "user.password_reset", entity: "user", entityId: user.id });
  else logger.warn("resetPasswordWithToken: no tenant membership found, password reset without an audit row", { userId: user.id });
  return { userId: user.id };
}

export async function changeOwnPassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.passwordHash) throw errors.not_found();
  if (!(await verifyPassword(currentPassword, user.passwordHash))) throw errors.validation("wrong_current", { currentPassword: ["wrong_current"] });
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(newPassword), mustChangePassword: false } });
  const ut = await prisma.userTenant.findFirst({ where: { userId }, select: { tenantId: true } });
  if (ut) await writeAudit({ tenantId: ut.tenantId, actorId: userId, action: "user.password_change", entity: "user", entityId: userId });
  // audit_logs.tenant_id เป็น NOT NULL — ไม่มี membership เลยแปลว่าเขียน audit ไม่ได้จริง ๆ แต่การเปลี่ยน
  // รหัสผ่านที่ไม่มีร่องรอยต้องส่งเสียง ไม่ใช่เงียบ (รูปแบบเดียวกับ confirmEmailChange ใน user.service.ts)
  else logger.warn("changeOwnPassword: no tenant membership found, password changed without an audit row", { userId });
}
