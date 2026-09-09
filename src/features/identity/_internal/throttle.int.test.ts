import { describe, it, expect } from "vitest";
import { throttleKeys, isLoginThrottled, recordLoginFailure, resetLoginFailures } from "./throttle";
import { MAX_FAILURES } from "./throttle-rules";

describe("throttle (db)", () => {
  it("key ประกอบจากอีเมลตัวเล็กและ ip", () => {
    expect(throttleKeys("A@B.com", "1.2.3.4")).toEqual(["email:a@b.com", "ip:1.2.3.4"]);
    expect(throttleKeys("a@b.com", null)).toEqual(["email:a@b.com"]);
  });
  it("พลาด 5 ครั้งแล้วล็อก reset แล้วปลด", async () => {
    const keys = throttleKeys("x@y.z", "9.9.9.9");
    for (let i = 0; i < MAX_FAILURES - 1; i++) await recordLoginFailure(keys);
    expect(await isLoginThrottled(keys)).toBe(false);
    await recordLoginFailure(keys);
    expect(await isLoginThrottled(keys)).toBe(true);
    await resetLoginFailures(keys);
    expect(await isLoginThrottled(keys)).toBe(false);
  });
  it("ล็อกที่ ip อย่างเดียวก็กันอีเมลอื่นที่มาจาก ip นั้น", async () => {
    for (let i = 0; i < MAX_FAILURES; i++) await recordLoginFailure(throttleKeys(`u${i}@y.z`, "5.5.5.5"));
    expect(await isLoginThrottled(throttleKeys("fresh@y.z", "5.5.5.5"))).toBe(true);
  });
});
