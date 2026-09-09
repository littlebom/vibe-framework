import { prisma, type Db } from "@/shared/lib/infra/prisma";
import { generateToken, hashToken } from "@/shared/lib/security/token";
import type { Prisma, TokenPurpose } from "@/generated/prisma";

/** อายุใช้งานของโทเคน ไม่ใช่ purpose ใหม่ — ลิงก์ตั้งรหัสผ่านที่แอดมินออกให้ก็ใช้ purpose: "PASSWORD_RESET" เหมือนลืมรหัสผ่าน เพียงแต่มีอายุ 72 ชม. แทน 1 ชม. */
export const TOKEN_TTL = {
  PASSWORD_SETUP: 72 * 60 * 60 * 1000,
  PASSWORD_RESET: 60 * 60 * 1000,
  EMAIL_VERIFY: 24 * 60 * 60 * 1000,
} as const;

export interface IssueTokenInput { userId: string; purpose: TokenPurpose; ttlMs: number; payload?: Prisma.InputJsonValue }

export async function issueToken(input: IssueTokenInput, db: Db = prisma): Promise<{ raw: string; expiresAt: Date }> {
  const raw = generateToken();
  const expiresAt = new Date(Date.now() + input.ttlMs);
  await db.authToken.create({
    data: { userId: input.userId, purpose: input.purpose, tokenHash: hashToken(raw), payload: input.payload ?? undefined, expiresAt },
  });
  return { raw, expiresAt };
}

type ConsumeTokenResult = { userId: string; payload: Record<string, unknown> | null } | null;

/**
 * ทำเครื่องหมายใช้แล้วแบบ atomic (updateMany ที่มีเงื่อนไข) — โทเคน PASSWORD_RESET อื่นของผู้ใช้เดียวกันถูกยกเลิกพร้อมกัน
 *
 * โทเคนพี่น้อง (sibling) สองใบของผู้ใช้คนเดียวกันอยู่คนละแถว: updateMany เงื่อนไขของแต่ละใบจึงไม่ชนกันเอง
 * การห่อ $transaction เฉยๆ ไม่ช่วยแก้ race นี้ — ที่ READ COMMITTED (ค่าเริ่มต้นของ PostgreSQL) สอง transaction
 * ที่แก้คนละแถวกันคอมมิตได้อิสระ ไม่ชนกัน ต้องล็อกแถว users ของผู้ใช้ก่อน (SELECT ... FOR UPDATE) เพื่อ
 * serialize ผู้บริโภคโทเคนพี่น้องสองใบพร้อมกันจริงๆ — ใบที่ล็อกได้ก่อนจะ claim ใบของตัวเองแล้วกวาดล้างใบพี่น้อง
 * เสร็จก่อนใบที่สองจะได้ล็อก ทำให้ใบที่สองเห็น usedAt ที่ถูกกวาดไปแล้วและ claim ไม่ติด
 */
export async function consumeToken(raw: string, purpose: TokenPurpose, db: Db = prisma): Promise<ConsumeTokenResult> {
  if ("$transaction" in db) {
    return db.$transaction((tx) => consumeTokenLocked(raw, purpose, tx));
  }
  // ผู้เรียกส่ง transaction ของตัวเองมาแล้ว รันตรงในนั้นเลย — ผู้เรียกเป็นผู้รับผิดชอบ isolation/lock เอง
  return consumeTokenLocked(raw, purpose, db);
}

async function consumeTokenLocked(raw: string, purpose: TokenPurpose, db: Prisma.TransactionClient): Promise<ConsumeTokenResult> {
  const tokenHash = hashToken(raw);
  const existing = await db.authToken.findUnique({ where: { tokenHash } });
  if (!existing) return null;

  // ล็อกแถวผู้ใช้ก่อน claim — ผู้เรียกสองรายที่ถือโทเคนพี่น้องคนละใบของผู้ใช้เดียวกันจะถูก serialize ที่นี่
  await db.$queryRaw`SELECT 1 FROM users WHERE id = ${existing.userId} FOR UPDATE`;

  const now = new Date();
  const updated = await db.authToken.updateMany({
    where: { tokenHash, purpose, usedAt: null, expiresAt: { gt: now } },
    data: { usedAt: now },
  });
  if (updated.count !== 1) return null;
  const row = await db.authToken.findUnique({ where: { tokenHash } });
  if (!row) return null;
  if (purpose === "PASSWORD_RESET") {
    await db.authToken.updateMany({ where: { userId: row.userId, purpose, usedAt: null }, data: { usedAt: now } });
  }
  return { userId: row.userId, payload: (row.payload as Record<string, unknown> | null) ?? null };
}
