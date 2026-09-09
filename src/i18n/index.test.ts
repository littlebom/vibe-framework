import { describe, it, expect } from "vitest";
import { UI_MESSAGES } from "./index";
import { MESSAGES as core } from "./messages/core";
import { MESSAGES as identity } from "@/features/identity/messages";
import { ALL_PERMISSIONS } from "@/permissions";
import { LOCALES } from "@/shared/lib/i18n/config";
import type { Dictionary } from "@/shared/lib/i18n/translate";

/**
 * feature ใหม่เพิ่มพจนานุกรมของตัวเองที่นี่บรรทัดเดียว — เทสต์ทุกตัวด้านล่างวนจากรายการนี้
 * (เดิมเทียบสองพจนานุกรมแบบตายตัว ต้องเพิ่มเทสต์ใหม่ทุกครั้งที่มี feature เพิ่ม)
 */
const DICTIONARIES: { name: string; messages: Dictionary }[] = [
  { name: "core", messages: core },
  { name: "identity", messages: identity },
];

describe("UI_MESSAGES", () => {
  it("key ไม่ซ้ำข้ามพจนานุกรม", () => {
    const seen = new Map<string, string>();
    const dup: string[] = [];
    for (const d of DICTIONARIES) {
      for (const k of Object.keys(d.messages)) {
        if (seen.has(k)) dup.push(`${k} (${seen.get(k)} ↔ ${d.name})`);
        else seen.set(k, d.name);
      }
    }
    expect(dup).toEqual([]);
  });

  it("ทุก key มีทั้ง th และ en", () => {
    for (const [k, v] of Object.entries(UI_MESSAGES)) {
      for (const locale of LOCALES) expect(v[locale], `${k}.${locale}`).toBeTruthy();
    }
  });

  /**
   * `role-dialog.tsx` เรนเดอร์ผ่าน template t(`perm.${p.code}`) และ t(`roles.module.${module}`)
   * ซึ่งการกวาดหา key แบบ static มองไม่เห็น — เมื่อมีการเพิ่มสิทธิ์ใหม่ลง permission registry
   * หน้าจอจะโชว์ key ดิบเงียบ ๆ จนกว่าจะมีคนสังเกต เทสต์นี้ทำให้ลืมไม่ได้
   */
  it("ทุกสิทธิ์ใน ALL_PERMISSIONS มี perm.<code> และ roles.module.<module> ครบทั้งสองภาษา", () => {
    const missing: string[] = [];
    const keys = new Set([...ALL_PERMISSIONS.map((p) => `perm.${p.code}`), ...ALL_PERMISSIONS.map((p) => `roles.module.${p.module}`)]);
    for (const key of keys) {
      const entry = UI_MESSAGES[key];
      if (!entry) { missing.push(key); continue; }
      for (const locale of LOCALES) if (!entry[locale]) missing.push(`${key}.${locale}`);
    }
    expect(missing).toEqual([]);
  });
});
