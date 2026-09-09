import { describe, it, expect } from "vitest";
import { isLocked, applyFailure, MAX_FAILURES, LOCK_MS, WINDOW_MS } from "./throttle-rules";

const now = new Date("2026-09-07T10:00:00Z");
const ago = (ms: number) => new Date(now.getTime() - ms);

describe("throttle-rules", () => {
  it("ไม่มีแถว = ไม่ล็อก", () => expect(isLocked(null, now)).toBe(false));
  it("ล็อกเมื่อ lockedUntil ยังไม่ถึง", () => {
    expect(isLocked({ failCount: 5, lockedUntil: new Date(now.getTime() + 1000), updatedAt: now }, now)).toBe(true);
    expect(isLocked({ failCount: 5, lockedUntil: ago(1), updatedAt: now }, now)).toBe(false);
  });
  it("พลาดครั้งที่ 5 ภายในหน้าต่างเวลา → ล็อก 15 นาที", () => {
    const r = applyFailure({ failCount: MAX_FAILURES - 1, lockedUntil: null, updatedAt: ago(1000) }, now);
    expect(r.failCount).toBe(MAX_FAILURES);
    expect(r.lockedUntil?.getTime()).toBe(now.getTime() + LOCK_MS);
  });
  it("พลาดหลังหน้าต่างเวลาหมด → เริ่มนับใหม่ที่ 1", () => {
    const r = applyFailure({ failCount: 4, lockedUntil: null, updatedAt: ago(WINDOW_MS + 1) }, now);
    expect(r).toEqual({ failCount: 1, lockedUntil: null });
  });
  it("พลาดขณะล็อกหมดอายุแล้ว → เริ่มนับใหม่", () => {
    const r = applyFailure({ failCount: 5, lockedUntil: ago(1), updatedAt: ago(LOCK_MS + 1) }, now);
    expect(r).toEqual({ failCount: 1, lockedUntil: null });
  });
});
