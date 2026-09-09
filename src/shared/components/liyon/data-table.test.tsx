import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { DataTable, RowMenuItem, RowMenuSeparator, type DataTableColumn } from "./data-table";

interface Row {
  id: string;
  name: string;
  status: string;
}

const rows: Row[] = [
  { id: "1", name: "สมชาย ใจดี", status: "ใช้งาน" },
  { id: "2", name: "กนกวรรณ ศรีสุข", status: "ปิดใช้งาน" },
];

const columns: DataTableColumn<Row>[] = [
  { key: "name", header: "ชื่อ", sortable: true, render: (r) => r.name },
  { key: "status", header: "สถานะ", render: (r) => r.status },
];

const empty = { icon: <svg />, title: "ไม่พบผู้ใช้", description: "ลองอีกครั้ง" };
const error = { icon: <svg />, title: "โหลดไม่สำเร็จ", description: "เซิร์ฟเวอร์ผิดพลาด" };

describe("DataTable — สถานะ data", () => {
  it("เรนเดอร์หัวคอลัมน์และแถวข้อมูล", () => {
    render(
      <DataTable
        state="data"
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        empty={empty}
        error={error}
        headHeading="รายชื่อผู้ใช้"
      />,
    );
    expect(screen.getByRole("columnheader", { name: /ชื่อ/ })).toBeTruthy();
    expect(screen.getByText("สมชาย ใจดี")).toBeTruthy();
    expect(screen.getByText("กนกวรรณ ศรีสุข")).toBeTruthy();
  });

  it("คอลัมน์ sortable เรียก onSortChange เมื่อคลิก และตั้ง aria-sort", () => {
    const onSortChange = vi.fn();
    render(
      <DataTable
        state="data"
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        sort={{ key: "name", direction: "asc" }}
        onSortChange={onSortChange}
        empty={empty}
        error={error}
        headHeading="รายชื่อผู้ใช้"
      />,
    );
    const th = screen.getByRole("columnheader", { name: /ชื่อ/ });
    expect(th.getAttribute("aria-sort")).toBe("ascending");
    fireEvent.click(within(th).getByRole("button"));
    expect(onSortChange).toHaveBeenCalledWith("name");
  });

  it("คอลัมน์ที่ไม่ sortable ไม่มีปุ่มเรียง", () => {
    render(
      <DataTable state="data" columns={columns} rows={rows} getRowId={(r) => r.id} empty={empty} error={error} headHeading="x" />,
    );
    const th = screen.getByRole("columnheader", { name: "สถานะ" });
    expect(within(th).queryByRole("button")).toBeNull();
  });

  it("selection: checkbox ทั้งหมด/รายแถว เรียก callback ที่ถูกต้อง", () => {
    const onToggleAll = vi.fn();
    const onToggleRow = vi.fn();
    const onClear = vi.fn();
    render(
      <DataTable
        state="data"
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        empty={empty}
        error={error}
        headHeading="x"
        selection={{
          selectedIds: new Set(["1"]),
          onToggleRow,
          onToggleAll,
          allSelected: false,
          ariaLabelAll: "เลือกทั้งหมด",
          ariaLabelRow: (r) => `เลือก ${r.name}`,
          bulkBar: {
            countLabel: (n) => `เลือกแล้ว ${n} รายการ`,
            actions: <button type="button">ลบ</button>,
            onClear,
            clearLabel: "ยกเลิกการเลือก",
          },
        }}
      />,
    );
    // bulk bar shows because selectedIds has one entry
    expect(screen.getByText("เลือกแล้ว 1 รายการ")).toBeTruthy();
    fireEvent.click(screen.getByRole("checkbox", { name: "เลือกทั้งหมด" }));
    expect(onToggleAll).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("checkbox", { name: "เลือก กนกวรรณ ศรีสุข" }));
    expect(onToggleRow).toHaveBeenCalledWith(rows[1]);
    fireEvent.click(screen.getByRole("button", { name: "ยกเลิกการเลือก" }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  // แถวที่ผู้เรียกตัดออกจาก "เลือกทั้งหมด" ต้องไม่มี checkbox ให้ติ๊กเองด้วย ไม่งั้นได้ผลเดียวกับที่ตั้งใจกัน
  it("selection: แถวที่ isRowSelectable คืน false ไม่มี checkbox", () => {
    render(
      <DataTable
        state="data"
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        empty={empty}
        error={error}
        headHeading="x"
        selection={{
          selectedIds: new Set<string>(),
          onToggleRow: vi.fn(),
          onToggleAll: vi.fn(),
          allSelected: false,
          ariaLabelAll: "เลือกทั้งหมด",
          ariaLabelRow: (r) => `เลือก ${r.name}`,
          isRowSelectable: (r) => r.id !== "1",
          bulkBar: { countLabel: (n) => `เลือกแล้ว ${n} รายการ`, actions: null, onClear: vi.fn(), clearLabel: "ยกเลิกการเลือก" },
        }}
      />,
    );
    expect(screen.queryByRole("checkbox", { name: `เลือก ${rows[0].name}` })).toBeNull();
    expect(screen.getByRole("checkbox", { name: `เลือก ${rows[1].name}` })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "เลือกทั้งหมด" })).toBeTruthy(); // หัวตารางไม่หาย
  });

  it("row menu: เปิดเมนูสามจุดแล้วคลิกรายการเรียก onSelect", async () => {
    const onEdit = vi.fn();
    render(
      <DataTable
        state="data"
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        empty={empty}
        error={error}
        headHeading="x"
        renderRowMenu={() => (
          <>
            <RowMenuItem onSelect={onEdit}>แก้ไข</RowMenuItem>
            <RowMenuSeparator />
            <RowMenuItem onSelect={vi.fn()} danger>
              ลบ
            </RowMenuItem>
          </>
        )}
        rowMenuLabel={(r) => `จัดการ ${r.name}`}
      />,
    );
    const trigger = screen.getAllByRole("button", { name: /จัดการ/ })[0];
    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
    const item = await screen.findByText("แก้ไข");
    fireEvent.click(item);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("row menu: disabled ปิดปุ่มจริง และคลิกไม่เรียก onSelect", async () => {
    const onDelete = vi.fn();
    render(
      <DataTable
        state="data"
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        empty={empty}
        error={error}
        headHeading="x"
        renderRowMenu={() => (
          <RowMenuItem onSelect={onDelete} disabled>
            ลบ
          </RowMenuItem>
        )}
        rowMenuLabel={(r) => `จัดการ ${r.name}`}
      />,
    );
    const trigger = screen.getAllByRole("button", { name: /จัดการ/ })[0];
    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
    const item = await screen.findByRole("menuitem", { name: "ลบ" });
    expect((item as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(item);
    expect(onDelete).not.toHaveBeenCalled();
  });
});

describe("DataTable — สถานะโหลด/ว่าง/ผิดพลาด", () => {
  it("loading: เรนเดอร์แถวโครงกระดูกตามจำนวนที่กำหนด", () => {
    const { container } = render(
      <DataTable
        state="loading"
        columns={columns}
        rows={[]}
        getRowId={(r: Row) => r.id}
        empty={empty}
        error={error}
        headHeading="x"
        skeletonRowCount={3}
      />,
    );
    expect(container.querySelectorAll("tr.skel")).toHaveLength(3);
  });

  it("empty: เรนเดอร์ข้อความและไอคอนของสถานะว่าง", () => {
    render(
      <DataTable state="empty" columns={columns} rows={[]} getRowId={(r: Row) => r.id} empty={empty} error={error} headHeading="x" />,
    );
    expect(screen.getByText("ไม่พบผู้ใช้")).toBeTruthy();
  });

  it("error: เรนเดอร์ role=alert และข้อความผิดพลาด", () => {
    render(
      <DataTable state="error" columns={columns} rows={[]} getRowId={(r: Row) => r.id} empty={empty} error={error} headHeading="x" />,
    );
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText("โหลดไม่สำเร็จ")).toBeTruthy();
  });
});
