import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  LiyonDialog,
  LiyonDialogHeader,
  LiyonDialogBody,
  LiyonDialogFooter,
  LiyonDialogCloseButton,
} from "./liyon-dialog";

function Example({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <LiyonDialog open={open} onOpenChange={onOpenChange}>
      <LiyonDialogCloseButton label="ปิด" />
      <LiyonDialogHeader title="เพิ่มผู้ใช้ใหม่" description="กรอกข้อมูลเพื่อสร้างบัญชี" />
      <LiyonDialogBody>
        <p>เนื้อหา</p>
      </LiyonDialogBody>
      <LiyonDialogFooter>
        <button type="button" onClick={() => onOpenChange(false)}>
          ยกเลิก
        </button>
      </LiyonDialogFooter>
    </LiyonDialog>
  );
}

describe("LiyonDialog", () => {
  it("ไม่เรนเดอร์เนื้อหาเมื่อ open=false", () => {
    render(<Example open={false} onOpenChange={vi.fn()} />);
    expect(screen.queryByText("เพิ่มผู้ใช้ใหม่")).toBeNull();
  });

  it("เรนเดอร์หัวเรื่อง/คำอธิบาย/เนื้อหาเมื่อ open=true", () => {
    render(<Example open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "เพิ่มผู้ใช้ใหม่" })).toBeTruthy();
    expect(screen.getByText("กรอกข้อมูลเพื่อสร้างบัญชี")).toBeTruthy();
  });

  it("ใส่คลาส .dlg และ .box ให้กล่อง", () => {
    const { baseElement } = render(<Example open={true} onOpenChange={vi.fn()} />);
    expect(baseElement.querySelector(".dlg")).toBeTruthy();
    expect(baseElement.querySelector(".dlg > .box")).toBeTruthy();
  });

  it("ปุ่มปิดมุมขวาบนเรียก onOpenChange(false)", () => {
    const onOpenChange = vi.fn();
    render(<Example open={true} onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByRole("button", { name: "ปิด" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("aria-labelledby ของกล่องชี้ไปที่ id จริงของหัวเรื่อง (กันบั๊ก id={undefined} ทับ id ที่ Radix สร้างให้)", () => {
    const { baseElement } = render(<Example open={true} onOpenChange={vi.fn()} />);
    const dialogEl = baseElement.querySelector('[role="dialog"]');
    const labelledbyId = dialogEl?.getAttribute("aria-labelledby");
    expect(labelledbyId).toBeTruthy();
    const titleEl = baseElement.querySelector(`#${labelledbyId}`);
    expect(titleEl?.textContent).toBe("เพิ่มผู้ใช้ใหม่");
  });

  it("ใส่คลาส danger เมื่อ danger=true", () => {
    const { baseElement } = render(
      <LiyonDialog open={true} onOpenChange={vi.fn()} danger>
        <LiyonDialogHeader title="ยืนยันการลบ" description="แน่ใจหรือไม่" />
      </LiyonDialog>,
    );
    expect(baseElement.querySelector(".dlg.danger")).toBeTruthy();
  });
});
