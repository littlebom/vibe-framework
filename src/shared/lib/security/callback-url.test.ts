import { describe, it, expect } from "vitest";
import { safeCallbackUrl, DEFAULT_CALLBACK_URL } from "./callback-url";

describe("safeCallbackUrl", () => {
  it("ยอมรับเฉพาะเส้นทางภายในเว็บเดียวกัน", () => {
    expect(safeCallbackUrl("/users")).toBe("/users");
    expect(safeCallbackUrl("/settings?tab=x")).toBe("/settings?tab=x");
    expect(safeCallbackUrl("/users/roles?q=1#top")).toBe("/users/roles?q=1#top");
  });

  it("ปฏิเสธปลายทางนอกเว็บ (CWE-601 open redirect)", () => {
    // "//evil.com" ขึ้นต้นด้วย "/" จริง แต่เป็น protocol-relative URL — เบราว์เซอร์พาออกนอกเว็บทันที
    expect(safeCallbackUrl("//evil.com")).toBe(DEFAULT_CALLBACK_URL);
    // เบราว์เซอร์แปลง backslash เป็น slash ตามสเปก URL — "/\evil.com" จึงเท่ากับ "//evil.com"
    expect(safeCallbackUrl("/\\evil.com")).toBe(DEFAULT_CALLBACK_URL);
    expect(safeCallbackUrl("https://evil.com")).toBe(DEFAULT_CALLBACK_URL);
    expect(safeCallbackUrl("http://evil.com/users")).toBe(DEFAULT_CALLBACK_URL);
    expect(safeCallbackUrl("javascript:alert(1)")).toBe(DEFAULT_CALLBACK_URL);
    // อักขระควบคุมถูก URL parser ตัดทิ้งก่อนแปลผล — "/\t/evil.com" กลายเป็น "//evil.com"
    expect(safeCallbackUrl("/\t/evil.com")).toBe(DEFAULT_CALLBACK_URL);
    expect(safeCallbackUrl("/\n/evil.com")).toBe(DEFAULT_CALLBACK_URL);
  });

  /**
   * ด่านเดิมตรวจ "ขาเข้า" อย่างเดียว แล้วคืนสตริงที่ประกอบใหม่จาก `url.pathname` — แต่การตัด dot-segment
   * (`.` / `..` / `%2e`) เกิดข้างใน URL parser ทีหลัง ค่าที่ resolve แล้วอยู่ origin เดิมจริงจึงยังกลาย
   * เป็น pathname ที่ขึ้นต้นด้วยสองสแลชได้ ทุกอินพุตข้างล่างนี้เคยคืน `//evil.com` ออกไปให้ `router.push`
   * ซึ่ง Next 16 ถือว่าเป็น URL นอกเว็บและพาผู้ใช้ออกไปจริง — ฟังก์ชันที่เขียนมาปิด CWE-601 กลับผลิต
   * payload ที่เทสต์ของตัวเองบอกว่าต้องปฏิเสธเสียเอง
   *
   * จึงต้องตรวจ "ขาออก" ด้วย: ประกอบสตริงสุดท้ายแล้ว resolve ซ้ำเทียบ origin เดิมอีกรอบ (fixpoint)
   * ไม่ใช่ไล่แปะเงื่อนไข `startsWith("//")` ทีละรูปแบบ ซึ่งปิดได้แค่แปดบรรทัดนี้ ไม่ใช่บรรทัดที่เก้า
   */
  it("ปฏิเสธเส้นทางที่ parser พับกลับเป็น protocol-relative หลังตัด dot-segment", () => {
    expect(safeCallbackUrl("/.//evil.com")).toBe(DEFAULT_CALLBACK_URL);
    expect(safeCallbackUrl("/..//evil.com")).toBe(DEFAULT_CALLBACK_URL);
    expect(safeCallbackUrl("/%2e//evil.com")).toBe(DEFAULT_CALLBACK_URL);
    expect(safeCallbackUrl("/%2E//evil.com")).toBe(DEFAULT_CALLBACK_URL);
    expect(safeCallbackUrl("/./\\evil.com")).toBe(DEFAULT_CALLBACK_URL);
    expect(safeCallbackUrl("/x/../..//evil.com")).toBe(DEFAULT_CALLBACK_URL);
    expect(safeCallbackUrl("/a/%2e%2e//evil.com")).toBe(DEFAULT_CALLBACK_URL);
    expect(safeCallbackUrl("/.//attacker.example/path")).toBe(DEFAULT_CALLBACK_URL);
  });

  it("ไม่มีค่า/ค่าว่าง/เส้นทางสัมพัทธ์ → ค่าเริ่มต้น", () => {
    expect(safeCallbackUrl(null)).toBe(DEFAULT_CALLBACK_URL);
    expect(safeCallbackUrl("")).toBe(DEFAULT_CALLBACK_URL);
    expect(safeCallbackUrl("users")).toBe(DEFAULT_CALLBACK_URL);
    expect(safeCallbackUrl("../users")).toBe(DEFAULT_CALLBACK_URL);
  });
});
