"use client";

import type { CSSProperties } from "react";
import { PALETTES, PALETTE_IDS, type PaletteId } from "@/shared/lib/palette";
import { useT } from "@/shared/lib/i18n/client";

export interface PalettePickerProps {
  value: PaletteId;
  onChange: (id: PaletteId) => void;
  /** ชุดที่ให้เลือก — ค่าตั้งต้นไม่มี coral จนกว่าจะผ่านการตรวจ AA (spec §4.3) */
  options?: readonly PaletteId[];
  label: string;
}

/**
 * ตัวเลือกโทนสี Liyon — primitive ตัวแรกของ shared/components/liyon
 * มาร์กอัป `.palette.pal-pick > .sw` ตาม Liyon-Admin-Settings.html — คงป้าย
 * `role="radiogroup"`/`role="radio"`/`aria-checked` เดิมไว้เพราะเป็นความหมายที่
 * ถูกต้องของกลุ่มตัวเลือกเดี่ยว (mockup ใช้ปุ่มธรรมดา + aria-pressed ซึ่งไม่ใช่ ARIA
 * ที่ถูกต้องสำหรับ role="radio" — jsx-a11y/role-supports-aria-props ห้าม) จึงแก้ที่
 * ต้นทาง Liyon-Theme/css/liyon-admin.css ให้ `.pal-pick .sw[aria-pressed="true"]`
 * จับคู่กับ `[aria-checked="true"]` ด้วย แล้ว sync ใหม่ แทนที่จะใส่ aria-pressed ที่นี่
 * — ชื่อที่อ่านออกเสียง (aria-label) และ options/props คงเดิมทั้งหมดจากเวอร์ชัน
 * Tailwind (เฟส 0)
 */
export function PalettePicker({ value, onChange, options = PALETTE_IDS, label }: PalettePickerProps) {
  const t = useT();
  return (
    <div role="radiogroup" aria-label={label} className="palette pal-pick">
      {options.map((id) => {
        const selected = id === value;
        const name = t(PALETTES[id].labelKey);
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={name}
            data-palette={id}
            data-name={name}
            onClick={() => onChange(id)}
            className="sw"
            style={{ "--sw": PALETTES[id].swatch } as CSSProperties}
          />
        );
      })}
    </div>
  );
}
