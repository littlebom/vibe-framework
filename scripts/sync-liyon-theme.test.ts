import { describe, it, expect } from "vitest";
import { stripImports, stripPrefersDark, rewriteFontLiterals, collectClassNames, findCollisions, LIYON_FILES } from "./sync-liyon-theme";

describe("sync-liyon-theme", () => {
  it("ตัด @import url() ทิ้ง", () => {
    expect(stripImports('@import url("liyon-shell.css");\n.a{color:red}')).toBe(".a{color:red}");
  });
  it("ตัดบล็อก prefers-color-scheme ทั้งก้อน รวมบล็อกซ้อน", () => {
    const css = ".a{x:1}\n@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--x:1} .b{y:2}}\n.c{z:3}";
    expect(stripPrefersDark(css)).toBe(".a{x:1}\n.c{z:3}");
  });
  it("แปลงชื่อฟอนต์เป็นตัวแปร next/font", () => {
    expect(rewriteFontLiterals('font-family:"Sarabun","Inter"')).toBe('font-family:var(--font-sarabun,"Sarabun"),var(--font-inter,"Inter")');
  });
  it("เก็บชื่อคลาสจาก selector เท่านั้น ไม่เก็บจาก declaration", () => {
    const names = collectClassNames('/* .no */ .a .b:hover{background:url("x.png")} .c{}');
    expect([...names].sort()).toEqual(["a", "b", "c"]);
  });
  it("รายงานชื่อที่ชนกับ utility ของ Tailwind ยกเว้น dark", () => {
    expect(findCollisions(["grid", "dark", "ly-grid", "flex"])).toEqual(["flex", "grid"]);
  });
  it("รายการไฟล์ไม่มีไฟล์หน้า LMS", () => {
    expect(LIYON_FILES).not.toContain("liyon-course.css");
    expect(LIYON_FILES[0]).toBe("liyon-palettes.css");
  });
});
