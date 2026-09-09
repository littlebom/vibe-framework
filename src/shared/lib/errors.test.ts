import { describe, it, expect } from "vitest";
import { AppError, errors, isAppError } from "./errors";

describe("errors", () => {
  it("แต่ละ factory ให้ code และ status ตรงตามชนิด", () => {
    expect(errors.unauthorized()).toMatchObject({ code: "unauthorized", status: 401 });
    expect(errors.forbidden()).toMatchObject({ code: "forbidden", status: 403 });
    expect(errors.not_found()).toMatchObject({ code: "not_found", status: 404 });
    expect(errors.conflict()).toMatchObject({ code: "conflict", status: 409 });
    expect(errors.validation("x", { email: ["bad"] })).toMatchObject({ code: "validation", status: 422, fieldErrors: { email: ["bad"] } });
    expect(errors.rate_limited()).toMatchObject({ code: "rate_limited", status: 429 });
    expect(errors.internal()).toMatchObject({ code: "internal", status: 500 });
  });
  it("isAppError แยก AppError ออกจาก Error ทั่วไป", () => {
    expect(isAppError(new AppError("conflict", "x", 409))).toBe(true);
    expect(isAppError(new Error("x"))).toBe(false);
  });
});
