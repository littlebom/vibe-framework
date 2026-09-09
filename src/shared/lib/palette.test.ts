import { describe, it, expect } from "vitest";
import { isPalette, DEFAULT_PALETTE, PALETTE_IDS, PALETTES } from "./palette";

describe("palette", () => {
  it("ค่าเริ่มต้นคือ blue และอยู่ในรายการ", () => {
    expect(DEFAULT_PALETTE).toBe("blue");
    expect(PALETTE_IDS).toContain(DEFAULT_PALETTE);
  });
  it("isPalette รับเฉพาะ id ที่รู้จัก", () => {
    expect(isPalette("green")).toBe(true);
    expect(isPalette("teal")).toBe(false);
    expect(isPalette(null)).toBe(false);
  });
  it("ทุก palette มี swatch เป็น hex และ labelKey", () => {
    for (const id of PALETTE_IDS) {
      expect(PALETTES[id].swatch).toMatch(/^#[0-9A-F]{6}$/i);
      expect(PALETTES[id].labelKey).toBe(`palette.${id}`);
    }
  });
});
