import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LiyonField, LiyonSelect, LiyonSwitch, LiyonSwitchRow } from "./form-controls";

describe("LiyonField", () => {
  it("แสดงป้ายกำกับที่ผูกกับ htmlFor และ hint", () => {
    render(
      <LiyonField label="ชื่อ" htmlFor="name" hint="ไม่บังคับ">
        <input id="name" />
      </LiyonField>,
    );
    expect(screen.getByText("ชื่อ").getAttribute("for")).toBe("name");
    expect(screen.getByText("ไม่บังคับ")).toBeTruthy();
  });

  it("แสดง error แทน hint เมื่อมีทั้งคู่", () => {
    render(
      <LiyonField label="อีเมล" hint="เช่น you@example.com" error="รูปแบบไม่ถูกต้อง">
        <input />
      </LiyonField>,
    );
    expect(screen.getByText("รูปแบบไม่ถูกต้อง")).toBeTruthy();
    expect(screen.queryByText("เช่น you@example.com")).toBeNull();
  });

  it("ห่อ icon + input ด้วย .wrap เมื่อมี icon", () => {
    const { container } = render(
      <LiyonField icon={<svg data-testid="ic" />}>
        <input />
      </LiyonField>,
    );
    expect(container.querySelector(".wrap")).toBeTruthy();
    expect(screen.getByTestId("ic")).toBeTruthy();
  });
});

describe("LiyonSelect", () => {
  it("ห่อ select ด้วย .selw และส่งต่อ props", () => {
    const onChange = vi.fn();
    render(
      <LiyonSelect aria-label="เลือกบทบาท" onChange={onChange}>
        <option value="a">A</option>
      </LiyonSelect>,
    );
    const select = screen.getByRole("combobox", { name: "เลือกบทบาท" });
    fireEvent.change(select, { target: { value: "a" } });
    expect(onChange).toHaveBeenCalled();
    expect(select.closest(".selw")).toBeTruthy();
  });
});

describe("LiyonSwitch", () => {
  it("เป็น checkbox role=switch และเรียก onCheckedChange", () => {
    const onCheckedChange = vi.fn();
    render(<LiyonSwitch checked={false} onCheckedChange={onCheckedChange} aria-label="เปิดใช้" />);
    const el = screen.getByRole("switch", { name: "เปิดใช้" });
    fireEvent.click(el);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });
});

describe("LiyonSwitchRow", () => {
  it("แสดง label/description และคลิกที่สวิตช์ได้", () => {
    const onCheckedChange = vi.fn();
    render(
      <LiyonSwitchRow
        id="forum"
        checked={true}
        onCheckedChange={onCheckedChange}
        label="เปิดใช้กระดานสนทนา"
        description="รายละเอียด"
      />,
    );
    expect(screen.getByText("เปิดใช้กระดานสนทนา")).toBeTruthy();
    const el = screen.getByRole("switch");
    fireEvent.click(el);
    expect(onCheckedChange).toHaveBeenCalledWith(false);
  });
});
