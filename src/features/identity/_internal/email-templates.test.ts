import { describe, it, expect } from "vitest";
import { passwordSetupEmail, passwordResetEmail, emailChangeEmail } from "./email-templates";

const p = { name: "สมชาย", link: "https://app.test/reset-password/abc", hours: 72 };

describe("email templates", () => {
  it("ไทย/อังกฤษมี subject, มีลิงก์ใน text และ html, มีชั่วโมงหมดอายุ", () => {
    for (const fn of [passwordSetupEmail, passwordResetEmail, emailChangeEmail]) {
      for (const locale of ["th", "en"] as const) {
        const m = fn(locale, p);
        expect(m.subject.length).toBeGreaterThan(3);
        expect(m.text).toContain(p.link);
        expect(m.html).toContain(p.link);
        expect(m.text).toContain("72");
      }
    }
  });
  it("ไทยและอังกฤษไม่เหมือนกัน", () => {
    expect(passwordSetupEmail("th", p).subject).not.toBe(passwordSetupEmail("en", p).subject);
  });
});
