import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { I18nProvider } from "@/shared/lib/i18n/client";
import type { Dictionary } from "@/shared/lib/i18n/translate";
import { PalettePicker } from "./palette-picker";

// เทสต์นี้มาจาก U-LMS ซึ่ง useT() ผูกกับพจนานุกรมทั้งระบบโดยไม่ต้องมี provider — ใน UMS
// useT() อ่านจาก I18nProvider context (ค่าเริ่มต้น messages={}) จึงต้องครอบด้วย
// I18nProvider ที่มี dictionary จำลองซึ่งมี key palette.* ตรงกับที่เทสต์คาดหวัง
const messages: Dictionary = {
  "palette.blue": { th: "น้ำเงิน", en: "Blue" },
  "palette.coral": { th: "ส้ม", en: "Coral" },
  "palette.pink": { th: "ชมพู", en: "Pink" },
  "palette.green": { th: "เขียว", en: "Green" },
  "palette.purple": { th: "ม่วง", en: "Purple" },
};

function renderWithI18n(ui: React.ReactElement) {
  return render(
    <I18nProvider locale="th" messages={messages}>
      {ui}
    </I18nProvider>,
  );
}

describe("PalettePicker", () => {
  it("แสดงครบ 5 ตัวเลือก (รวม coral) เป็น radio และตัวที่เลือกถูกติ๊ก", () => {
    renderWithI18n(<PalettePicker value="green" onChange={() => {}} label="เลือกโทนสี" />);
    const radios = screen.getAllByRole("radio");
    expect(radios.map((r) => r.getAttribute("data-palette"))).toEqual(["blue", "coral", "pink", "green", "purple"]);
    expect(screen.getByRole("radio", { name: /เขียว/ }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("radiogroup", { name: "เลือกโทนสี" })).toBeTruthy();
  });
  it("คลิกแล้วส่ง id ของ palette", () => {
    const onChange = vi.fn();
    renderWithI18n(<PalettePicker value="blue" onChange={onChange} label="x" />);
    fireEvent.click(screen.getByRole("radio", { name: /ชมพู/ }));
    expect(onChange).toHaveBeenCalledWith("pink");
  });
  it("options กำหนดชุดที่แสดงได้", () => {
    renderWithI18n(<PalettePicker value="blue" onChange={() => {}} label="x" options={["blue", "coral"]} />);
    expect(screen.getAllByRole("radio")).toHaveLength(2);
  });

  it("มาร์กอัปตาม mockup: .palette.pal-pick ครอบ .sw ที่มี data-name และสี --sw", () => {
    renderWithI18n(<PalettePicker value="green" onChange={() => {}} label="เลือกโทนสี" />);
    const group = screen.getByRole("radiogroup", { name: "เลือกโทนสี" });
    expect(group.className).toContain("palette");
    expect(group.className).toContain("pal-pick");
    const green = screen.getByRole("radio", { name: /เขียว/ });
    expect(green.className).toContain("sw");
    expect(green.getAttribute("data-name")).toBe("เขียว");
    expect(green.style.getPropertyValue("--sw")).toBeTruthy();
    expect(green.getAttribute("aria-checked")).toBe("true");
  });
});
