import { describe, it, expect } from "vitest";
import { generateToken, hashToken } from "./token";

describe("token", () => {
  it("โทเคนสุ่ม 43 ตัวอักษร base64url ไม่ซ้ำ", () => {
    const a = generateToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(generateToken()).not.toBe(a);
  });
  it("hash เป็น sha256 hex คงที่", () => {
    expect(hashToken("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});
