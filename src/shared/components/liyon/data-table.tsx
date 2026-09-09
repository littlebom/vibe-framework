"use client";

import * as React from "react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { ArrowUp, MoreVertical, X } from "lucide-react";
import { cn } from "@/shared/lib/utils";

/**
 * ตารางข้อมูล `.dt` ของ Liyon (liyon-shell.css "ตารางข้อมูล" — ต้นฉบับเดียวสำหรับ
 * ~22 หน้าฝั่ง admin) — primitive ตัวที่แปดของ shared/components/liyon
 *
 * รวม: เรียงคอลัมน์ (sort) · เลือกแถว + แถบทำงานหมู่ (bulk bar) · เมนูสามจุดรายแถว
 * (Radix DropdownMenu — portal ออกนอก DOM ของตาราง จึงไม่ถูกชั้นเลื่อน .scroll
 * หรือกรอบ .dt-wrap ตัดทิ้ง เหมือนที่ mockup ใช้ position:fixed ทำเอง) · โครงกระดูก
 * ตอนโหลด · สถานะว่าง/ผิดพลาด · ท้ายตาราง (จำนวน+แบ่งหน้า)
 *
 * ทุกอย่างเป็น props — คอมโพเนนต์นี้ไม่ผูกกับ endpoint หรือ state จริงของหน้าไหน
 * หน้าที่ยังไม่มี query/mutation รองรับ sort หรือเลือกแถว ให้ไม่ส่ง prop นั้นมา
 * (ห้ามใส่ปุ่ม/แถบที่กดแล้วไม่ทำอะไรจริง)
 */

export interface DataTableColumn<T> {
  key: string;
  header: string;
  /** เพิ่มคลาสให้ทั้ง th และ td เช่น "nowrap" "muted" "num" */
  className?: string;
  sortable?: boolean;
  render: (row: T) => React.ReactNode;
  /** เซลล์โครงกระดูกของคอลัมน์นี้ตอนโหลด — ค่าเริ่มต้น <span class="sk w70"> */
  renderSkeleton?: () => React.ReactNode;
}

export interface DataTableSort {
  key: string;
  direction: "asc" | "desc";
}

export interface DataTableSelection<T> {
  selectedIds: ReadonlySet<string>;
  onToggleRow: (row: T) => void;
  onToggleAll: () => void;
  allSelected: boolean;
  ariaLabelAll: string;
  ariaLabelRow: (row: T) => string;
  /**
   * แถวไหนติ๊กเลือกได้บ้าง — แถวที่คืน `false` จะไม่มี checkbox เลย (ไม่ใช่แค่ disabled)
   *
   * ผู้เรียกที่ตัดบางแถวออกจาก "เลือกทั้งหมด" ต้องส่งเงื่อนไขเดียวกันมาที่นี่ด้วย ไม่งั้นผู้ใช้ยังติ๊ก
   * แถวนั้นเองได้ ได้ผลเดียวกับที่การตัดออกจาก select-all ตั้งใจจะกัน และ `allSelected` ก็จะนับเพี้ยน
   * (เลือกครบทุกแถวที่เลือกได้ + แถวที่ไม่ควรเลือก → จำนวนไม่มีวันตรงกับ `selectableIds.length`)
   * ไม่ส่งมา = ทุกแถวเลือกได้ตามเดิม
   */
  isRowSelectable?: (row: T) => boolean;
  /** แถบทำงานหมู่ — โผล่แทนแถบเครื่องมือ (`toolbar`) เมื่อมีแถวถูกเลือก */
  bulkBar: {
    countLabel: (count: number) => string;
    actions: React.ReactNode;
    onClear: () => void;
    clearLabel: string;
  };
}

export interface DataTableStateInfo {
  icon: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export interface DataTableProps<T> {
  state: "data" | "loading" | "empty" | "error";
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  sort?: DataTableSort | null;
  onSortChange?: (key: string) => void;
  selection?: DataTableSelection<T>;
  renderRowMenu?: (row: T) => React.ReactNode;
  rowMenuLabel?: (row: T) => string;
  skeletonRowCount?: number;
  empty: DataTableStateInfo;
  error: DataTableStateInfo;
  /** เนื้อหาแถบเครื่องมือ (`.dt-tools`) — ค้นหา/ตัวกรอง/ปุ่มทำงาน */
  toolbar?: React.ReactNode;
  /** เนื้อหาชิปตัวกรองที่ใช้อยู่ (`.chips`) */
  filterChips?: React.ReactNode;
  headHeading: React.ReactNode;
  headMeta?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function DataTable<T>({
  state,
  columns,
  rows,
  getRowId,
  sort,
  onSortChange,
  selection,
  renderRowMenu,
  rowMenuLabel,
  skeletonRowCount = 8,
  empty,
  error,
  toolbar,
  filterChips,
  headHeading,
  headMeta,
  footer,
  className,
}: DataTableProps<T>) {
  const selectedCount = selection?.selectedIds.size ?? 0;
  const showBulkBar = !!selection && selectedCount > 0;
  const hasActsColumn = !!renderRowMenu;

  return (
    <div className={cn(className)}>
      {selection && (
        <div className={cn("bulkbar", showBulkBar && "on")} role="region" aria-label={selection.bulkBar.clearLabel}>
          <span className="n">
            {selection.bulkBar.countLabel(selectedCount)}
          </span>
          <span className="sp" />
          {selection.bulkBar.actions}
          <button type="button" className="icon-btn" onClick={selection.bulkBar.onClear} aria-label={selection.bulkBar.clearLabel}>
            <X aria-hidden="true" />
          </button>
        </div>
      )}
      {!showBulkBar && toolbar && <div className="dt-tools">{toolbar}</div>}
      {filterChips}

      <div className="dt-wrap">
        <div className="dt-head">
          <div>
            <h2>{headHeading}</h2>
            {headMeta && <p>{headMeta}</p>}
          </div>
        </div>

        {state === "data" && (
          <>
            <div className="scroll">
              <table className="dt">
                <thead>
                  <tr>
                    {selection && (
                      <th className="sel">
                        <input
                          className="chk"
                          type="checkbox"
                          checked={selection.allSelected}
                          onChange={selection.onToggleAll}
                          aria-label={selection.ariaLabelAll}
                        />
                      </th>
                    )}
                    {columns.map((col) => {
                      const isSorted = sort?.key === col.key;
                      if (!col.sortable || !onSortChange) {
                        return (
                          <th key={col.key} className={col.className}>
                            {col.header}
                          </th>
                        );
                      }
                      return (
                        <th
                          key={col.key}
                          className={col.className}
                          aria-sort={isSorted ? (sort!.direction === "asc" ? "ascending" : "descending") : undefined}
                        >
                          <button type="button" className="sort" onClick={() => onSortChange(col.key)}>
                            {col.header}
                            <ArrowUp aria-hidden="true" />
                          </button>
                        </th>
                      );
                    })}
                    {hasActsColumn && <th className="acts" />}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const id = getRowId(row);
                    const selected = selection?.selectedIds.has(id) ?? false;
                    return (
                      <tr key={id} aria-selected={selection ? selected : undefined}>
                        {selection && (
                          <td className="sel">
                            {(selection.isRowSelectable?.(row) ?? true) && (
                              <input
                                className="chk"
                                type="checkbox"
                                checked={selected}
                                onChange={() => selection.onToggleRow(row)}
                                aria-label={selection.ariaLabelRow(row)}
                              />
                            )}
                          </td>
                        )}
                        {columns.map((col) => (
                          <td key={col.key} className={col.className}>
                            {col.render(row)}
                          </td>
                        ))}
                        {hasActsColumn && (
                          <td className="acts">
                            <RowMenu label={rowMenuLabel ? rowMenuLabel(row) : ""}>{renderRowMenu!(row)}</RowMenu>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {footer && <div className="dt-foot">{footer}</div>}
          </>
        )}

        {state === "loading" && (
          <div className="scroll" aria-busy="true" aria-label={empty.title}>
            <table className="dt">
              <thead>
                <tr>
                  {selection && <th className="sel" />}
                  {columns.map((col) => (
                    <th key={col.key} className={col.className}>
                      {col.header}
                    </th>
                  ))}
                  {hasActsColumn && <th className="acts" />}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: skeletonRowCount }).map((_, i) => (
                  <tr key={i} className="skel" aria-hidden="true">
                    {selection && <td className="sel" />}
                    {columns.map((col) => (
                      <td key={col.key} className={col.className}>
                        {col.renderSkeleton ? col.renderSkeleton() : <span className="sk w70" />}
                      </td>
                    ))}
                    {hasActsColumn && (
                      <td className="acts">
                        <span className="sk w28" />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {state === "empty" && <StateBlock info={empty} />}
        {state === "error" && <StateBlock info={error} danger />}
      </div>
    </div>
  );
}

function StateBlock({ info, danger }: { info: DataTableStateInfo; danger?: boolean }) {
  return (
    <div className={cn("empty-state", danger && "bad")} role={danger ? "alert" : undefined}>
      {info.icon}
      <h3>{info.title}</h3>
      {info.description && <p>{info.description}</p>}
      {info.actions && <div className="acts">{info.actions}</div>}
    </div>
  );
}

function RowMenu({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        <button type="button" className="icon-btn sm" aria-label={label}>
          <MoreVertical aria-hidden="true" />
        </button>
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        {/* .menu-list (liyon-shell.css) เขียน position:fixed ไว้สำหรับ JS ของ mockup เอง — ที่นี่
            Radix Popper (data-radix-popper-content-wrapper) เป็นตัวจัดตำแหน่ง fixed ให้รอบนอกอยู่แล้ว
            ถ้าปล่อยให้ Content เอง position:fixed ด้วย wrapper จะวัดขนาดลูกไม่ได้ (ลูกหลุด flow ไป
            อ้างอิง viewport เอง กลายเป็นกล่อง 0×0) ทำให้ Radix คำนวณตำแหน่ง align="end" ผิดพลาด
            (เมนูเบี้ยวหลุดจอ) จึง override เป็น static ที่นี่ — ดูรายละเอียดเดียวกันใน admin-shell.tsx */}
        <DropdownMenuPrimitive.Content className="menu-list" align="end" sideOffset={4} style={{ position: "static" }}>
          {children}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}

export function RowMenuItem({
  onSelect,
  danger,
  disabled,
  icon,
  children,
}: {
  onSelect: () => void;
  danger?: boolean;
  /** ปิดรายการนี้ — เช่น แก้ไข/ลบของแถวที่ไม่ให้ทำ (บทบาทระบบ, มีผู้ถืออยู่) — ยังคงแสดงในเมนู แค่กดไม่ได้ */
  disabled?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenuPrimitive.Item asChild disabled={disabled} onSelect={onSelect}>
      <button type="button" className={cn(danger && "danger")} disabled={disabled}>
        {icon}
        {children}
      </button>
    </DropdownMenuPrimitive.Item>
  );
}

export function RowMenuSeparator() {
  return <DropdownMenuPrimitive.Separator asChild><hr /></DropdownMenuPrimitive.Separator>;
}
