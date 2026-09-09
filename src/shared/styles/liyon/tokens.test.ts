import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * ตาข่ายของระบบ token — README ของ Liyon เคยตรวจด้วย JS ว่า token ครบ 60 ตัว × 10 โหมด
 * ที่นี่ pin ไว้เป็นเทสต์: (1) ทุก palette ประกาศชุดชื่อเดียวกัน (2) โหมดมืดทับเฉพาะชื่อที่มี
 * (3) ทุก var() ที่ compat และ @theme ของ globals อ้าง ต้องมีที่มาจริง ไม่งั้นสีจะว่างทั้งหน้า
 * ไฟล์ที่อ่านไม่มีบล็อกซ้อน (sync ตัด @media ทิ้งแล้ว) จึง parse ด้วย regex ระดับเดียวได้
 */
const here = __dirname;
const read = (rel: string) => readFileSync(join(here, rel), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

function rules(css: string): Array<{ selector: string; body: string }> {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    selector: m[1].trim(),
    body: m[2],
  }));
}
function declared(body: string): Set<string> {
  return new Set([...body.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
}
function referenced(css: string): Set<string> {
  return new Set([...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]));
}
const union = (...sets: Set<string>[]) => new Set(sets.flatMap((s) => [...s]));

const PALETTES = ["blue", "coral", "pink", "green", "purple"];
const palettes = rules(read("liyon-palettes.css"));
const base = rules(read("liyon-base.css"));
const compatCss = read("liyon-compat.css");
const compat = rules(compatCss);

const light = (p: string) => palettes.find((r) => r.selector === `[data-palette="${p}"]`);
const dark = (p: string) => palettes.find((r) => r.selector.includes(`[data-palette="${p}"].dark`));
const baseRoot = union(...base.filter((r) => r.selector === ":root").map((r) => declared(r.body)));
const baseDark = union(...base.filter((r) => r.selector.includes(".dark")).map((r) => declared(r.body)));
const compatRoot = union(...compat.filter((r) => r.selector === ":root").map((r) => declared(r.body)));

describe("liyon-palettes.css", () => {
  it.each(PALETTES)("palette %s มีบล็อกสว่างและมืด", (p) => {
    expect(light(p), `ไม่พบ [data-palette="${p}"]`).toBeTruthy();
    expect(dark(p), `ไม่พบ [data-palette="${p}"].dark`).toBeTruthy();
  });
  it("ทุก palette ประกาศชุด token เดียวกับ blue ในโหมดสว่าง", () => {
    const ref = [...declared(light("blue")!.body)].sort();
    expect(ref.length).toBeGreaterThan(30);
    for (const p of PALETTES) expect([...declared(light(p)!.body)].sort(), p).toEqual(ref);
  });
  it.each(PALETTES)("โหมดมืดของ %s ทับเฉพาะชื่อที่โหมดสว่างประกาศ", (p) => {
    const l = declared(light(p)!.body);
    const d = declared(dark(p)!.body);
    expect(d.size, `บล็อกมืดของ ${p} ไม่ได้ประกาศ token ใดเลย — เทสต์นี้จะผ่านลอย ๆ`).toBeGreaterThan(0);
    for (const n of d) expect(l.has(n), n).toBe(true);
  });
});

describe("liyon-base.css", () => {
  it("โหมดมืดทับเฉพาะชื่อที่ :root ประกาศ", () => {
    expect(baseDark.size, "ไม่พบ token ที่ .dark ประกาศเลย — เทสต์นี้จะผ่านลอย ๆ").toBeGreaterThan(0);
    for (const n of baseDark) expect(baseRoot.has(n), n).toBe(true);
  });
});

describe("liyon-compat.css", () => {
  it.each(PALETTES)("ทุก var() ที่ compat อ้าง มีที่มาใน palette %s หรือ base หรือ compat เอง", (p) => {
    const available = union(declared(light(p)!.body), baseRoot, compatRoot);
    const refs = referenced(compatCss);
    expect(refs.size, "compat ไม่ได้อ้าง var() เลย — เทสต์นี้จะผ่านลอย ๆ").toBeGreaterThan(0);
    for (const n of refs) {
      if (n.startsWith("--font-")) continue; // มาจาก next/font บน <body>
      expect(available.has(n), `${n} ไม่ถูกประกาศที่ใด`).toBe(true);
    }
  });
});

describe("src/app/globals.css", () => {
  const globalsRaw = readFileSync(join(here, "../../../app/globals.css"), "utf8");
  const globals = globalsRaw.replace(/\/\*[\s\S]*?\*\//g, "");

  it("ทุก var() ใน @theme inline มีที่มาจาก compat / base / palette", () => {
    const theme = globals.match(/@theme inline\s*\{([^}]*)\}/);
    expect(theme, "ไม่พบ @theme inline").toBeTruthy();
    const available = union(declared(light("blue")!.body), baseRoot, compatRoot);
    for (const n of referenced(theme![1])) {
      if (n.startsWith("--font-")) continue;
      expect(available.has(n), `${n} ใน @theme ไม่มีที่มา`).toBe(true);
    }
  });

  it("ประกาศ @layer theme, base, liyon, components, utilities ก่อน @import \"tailwindcss\" เสมอ", () => {
    // การประกาศ @layer ครั้งแรกกำหนดลำดับ — ถ้า @import "tailwindcss" มาก่อน
    // Tailwind จะยึดลำดับ base/utilities ของมันเอง แล้ว liyon จะไม่ชนะ preflight อีก
    const layerMatch = globals.match(/@layer\s+([^;]+);/);
    expect(layerMatch, "ไม่พบ @layer statement").toBeTruthy();
    const layerNames = layerMatch![1].split(",").map((s) => s.trim());
    expect(layerNames).toEqual(["theme", "base", "liyon", "components", "utilities"]);

    const layerIndex = globals.indexOf(layerMatch![0]);
    const importIndex = globals.indexOf('@import "tailwindcss"');
    expect(importIndex, 'ไม่พบ @import "tailwindcss"').toBeGreaterThan(-1);
    expect(layerIndex).toBeLessThan(importIndex);
  });
});
