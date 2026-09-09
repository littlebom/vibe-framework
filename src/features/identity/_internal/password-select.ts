/** bcrypt hash คงที่ cost 12 (ต้องตรงกับ BCRYPT_COST ใน password.ts) ของสตริงสุ่มที่ไม่มีผู้ใช้จริงคนไหนใช้
 *  ใช้เป็นตัวเทียบแทนเมื่อไม่มี user/hash จริง เพื่อให้ bcrypt.compare ทำงานเวลาเท่ากันทุก path
 *  (กัน timing attack ที่เดาได้ว่าอีเมลมีบัญชีอยู่จริงหรือไม่) — ไม่ใช่ hash ของรหัสผ่านใคร
 *  อยู่ในโมดูลนี้ (ไม่ใช่ auth.ts) เพื่อให้ unit test import ได้โดยไม่ต้อง bootstrap NextAuth/env() */
export const DUMMY_PASSWORD_HASH = "$2b$12$wq2EPqeklWFo.Zzkosjvie5zztNhU0GxERvUDq780B9zdbdZqu.oq";

/** เลือก hash รหัสผ่านที่จะเทียบใน authorize() — คืน dummy เมื่อไม่มี hash จริงให้เทียบ
 *  เพื่อให้ bcrypt.compare ถูกเรียกทุกครั้งไม่ว่าอีเมลจะมีในระบบหรือไม่ (กัน timing oracle
 *  ที่บอกใบ้ว่าบัญชีมีอยู่จริงจากเวลาตอบสนองที่ต่างกัน) */
export function passwordHashFor(
  user: { passwordHash: string | null; isActive: boolean } | null,
  dummy: string,
): string {
  if (user && user.isActive && user.passwordHash) return user.passwordHash;
  return dummy;
}
