import { describe, it, expect } from "vitest";
import { passwordHashFor, DUMMY_PASSWORD_HASH } from "./password-select";
import { BCRYPT_COST } from "@/shared/lib/security/password";

const DUMMY = "$2b$12$dummydummydummydummydummydummydummydummydummydummyd";

describe("passwordHashFor", () => {
  it("ไม่มีผู้ใช้ (อีเมลไม่มีในระบบ) → คืน dummy hash", () => {
    expect(passwordHashFor(null, DUMMY)).toBe(DUMMY);
  });
  it("ผู้ใช้ถูกระงับแต่มี passwordHash → คืน dummy hash", () => {
    expect(passwordHashFor({ passwordHash: "$2b$12$realhash", isActive: false }, DUMMY)).toBe(DUMMY);
  });
  it("ผู้ใช้ active แต่ไม่มี passwordHash (สมัครผ่าน OAuth เท่านั้น) → คืน dummy hash", () => {
    expect(passwordHashFor({ passwordHash: null, isActive: true }, DUMMY)).toBe(DUMMY);
  });
  it("ผู้ใช้ active และมี passwordHash → คืน hash จริงของผู้ใช้", () => {
    expect(passwordHashFor({ passwordHash: "$2b$12$realhash", isActive: true }, DUMMY)).toBe("$2b$12$realhash");
  });
  // กัน timing gap เงียบ: ถ้า BCRYPT_COST ถูกปรับขึ้นแต่ dummy hash cost ยังคงเดิม
  // การเทียบ dummy จะเร็วกว่าการเทียบ hash จริงของผู้ใช้ใหม่ เปิดช่องให้เดาบัญชีจาก timing ได้อีก
  it("cost ของ DUMMY_PASSWORD_HASH ต้องตรงกับ BCRYPT_COST เสมอ", () => {
    expect(Number(DUMMY_PASSWORD_HASH.split("$")[2])).toBe(BCRYPT_COST);
  });
});
