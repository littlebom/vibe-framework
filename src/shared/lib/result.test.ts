import { describe, it, expect } from "vitest";
import { z } from "zod";
import { runAction } from "./result";
import { errors } from "./errors";

describe("runAction", () => {
  it("คืน ok เมื่อสำเร็จ", async () => {
    expect(await runAction(async () => 42)).toEqual({ ok: true, data: 42 });
  });
  it("แปลง AppError เป็น error ที่มี code", async () => {
    const r = await runAction(async () => { throw errors.forbidden("no"); });
    expect(r).toEqual({ ok: false, error: { code: "forbidden", message: "no", fieldErrors: undefined } });
  });
  it("แปลง ZodError เป็น validation พร้อม fieldErrors", async () => {
    const r = await runAction(async () => z.object({ email: z.email() }).parse({ email: "x" }));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe("validation");
      expect(r.error.fieldErrors?.email?.length).toBe(1);
    }
  });
  it("ข้อผิดพลาดอื่นกลายเป็น internal ไม่เปิดเผยข้อความ", async () => {
    const r = await runAction(async () => { throw new Error("secret db detail"); });
    expect(r).toEqual({ ok: false, error: { code: "internal", message: "internal", fieldErrors: undefined } });
  });
});
