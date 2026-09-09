import { prisma } from "@/shared/lib/infra/prisma";
import { applyFailure, isLocked } from "./throttle-rules";

/**
 * `scope` แยก namespace ของคีย์ระหว่างทางเข้าที่ใช้กลไกนี้ร่วมกัน — ค่าเริ่มต้น (ว่าง) คือคีย์ของ login
 * ห้ามให้ทางเข้าอื่นใช้คีย์ชุดเดียวกับ login: การขอลิงก์รีเซ็ตรหัสผ่านไม่ต้อง login และใครก็ยิงได้
 * ถ้าใช้คีย์ร่วมกัน ยิง forgot-password ครบโควตาจะล็อกการ login ของเหยื่อไปด้วย 15 นาที (DoS ตัวใหม่)
 */
export function throttleKeys(email: string, ip: string | null | undefined, scope = ""): string[] {
  const p = scope ? `${scope}:` : "";
  const keys = [`${p}email:${email.trim().toLowerCase()}`];
  if (ip) keys.push(`${p}ip:${ip}`);
  return keys;
}

export async function isLoginThrottled(keys: string[]): Promise<boolean> {
  const now = new Date();
  const rows = await prisma.loginThrottle.findMany({ where: { key: { in: keys } } });
  return rows.some((r) => isLocked(r, now));
}

export async function recordLoginFailure(keys: string[]): Promise<void> {
  const now = new Date();
  for (const key of keys) {
    const row = await prisma.loginThrottle.findUnique({ where: { key } });
    const next = applyFailure(row, now);
    await prisma.loginThrottle.upsert({ where: { key }, update: next, create: { key, ...next } });
  }
}

export async function resetLoginFailures(keys: string[]): Promise<void> {
  await prisma.loginThrottle.deleteMany({ where: { key: { in: keys } } });
}
