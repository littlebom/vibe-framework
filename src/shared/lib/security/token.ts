import { createHash, randomBytes } from "node:crypto";

/** 32 ไบต์สุ่ม → base64url 43 ตัวอักษร ใส่ใน URL ได้ */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
