import { describe, it, expect } from "vitest";
import { z } from "zod";
import { zodErrorMap } from "./zod-locale";

describe("zodErrorMap", () => {
  const schema = z.object({ email: z.email(), pw: z.string().min(8) });
  it("ข้อความไทย", () => {
    const r = schema.safeParse({ email: "x", pw: "123" }, { error: zodErrorMap("th") });
    expect(r.success).toBe(false);
    const msgs = r.error!.issues.map((i) => i.message);
    expect(msgs[0]).toBe("รูปแบบอีเมลไม่ถูกต้อง");
    expect(msgs[1]).toBe("ต้องมีอย่างน้อย 8 ตัวอักษร");
  });
  it("ข้อความอังกฤษ", () => {
    const r = schema.safeParse({ email: "x", pw: "123" }, { error: zodErrorMap("en") });
    const msgs = r.error!.issues.map((i) => i.message);
    expect(msgs[0]).toBe("Invalid email address");
    expect(msgs[1]).toBe("Must be at least 8 characters");
  });
});
