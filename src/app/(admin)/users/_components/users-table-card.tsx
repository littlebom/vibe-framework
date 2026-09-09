"use client";
import { AlertCircle, Search, Users as UsersIcon, ChevronLeft, ChevronRight, Pencil, KeyRound, Mail, Ban, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, RowMenuItem, StatusPill, LiyonSelect, type DataTableColumn, type DataTableSelection } from "@/shared/components/liyon";
import { useT, useLocale } from "@/shared/lib/i18n/client";
import { formatDate, localizedName } from "@/shared/lib/format";
import type { UserListItem, RolePick } from "./types";

export function UsersTableCard({
  state,
  users,
  total,
  page,
  totalPages,
  searchInput,
  onSearchInputChange,
  status,
  onStatusChange,
  roleId,
  roles,
  onRoleChange,
  onPrev,
  onNext,
  canManage,
  selfId,
  selected,
  onSelectedChange,
  onEdit,
  onIssueLink,
  onChangeEmail,
  onSuspend,
  onActivate,
  onRetry,
}: {
  state: "loading" | "data" | "empty" | "error";
  users: UserListItem[];
  total: number;
  page: number;
  totalPages: number;
  searchInput: string;
  onSearchInputChange: (v: string) => void;
  status: "all" | "active" | "inactive";
  onStatusChange: (s: "all" | "active" | "inactive") => void;
  roleId: string;
  roles: RolePick[];
  onRoleChange: (roleId: string) => void;
  onPrev: () => void;
  onNext: () => void;
  canManage: boolean;
  selfId: string;
  selected: Set<string>;
  onSelectedChange: (s: Set<string>) => void;
  onEdit: (u: UserListItem) => void;
  onIssueLink: (u: UserListItem) => void;
  onChangeEmail: (u: UserListItem) => void;
  onSuspend: (list: UserListItem[]) => void;
  onActivate: (u: UserListItem) => void;
  onRetry: () => void;
}) {
  const t = useT();
  const locale = useLocale();
  const hasFilters = searchInput.trim() !== "" || status !== "all" || roleId !== "";

  const columns: DataTableColumn<UserListItem>[] = [
    {
      key: "name",
      header: t("users.colName"),
      render: (u) => (
        <div>
          <div>{u.name}</div>
          <div className="muted">{u.email}</div>
        </div>
      ),
    },
    { key: "roles", header: t("users.colRoles"), render: (u) => u.roles.map((r) => localizedName(r, locale)).join(", ") },
    { key: "status", header: t("common.colStatus"), render: (u) => <StatusPill tone={u.isActive ? "ok" : "bad"}>{t(u.isActive ? "status.active" : "status.inactive")}</StatusPill> },
    { key: "lastLogin", header: t("users.colLastLogin"), render: (u) => formatDate(u.lastLoginAt, locale, { time: true }) },
  ];

  // B5: "เลือกทั้งหมด" ต้องไม่รวมแถวของตัวเอง — การกระทำหมู่เดียวที่มีคือ "ระงับที่เลือก" ซึ่ง service
  // ปฏิเสธด้วย cannot_edit_self เสมอ (เมนูสามจุดของแถวตัวเองก็ซ่อนรายการนี้ไว้แล้ว) ถ้ารวมเข้ามาด้วย
  // ผู้ใช้จะกดแล้วได้ error ทุกครั้งโดยไม่มีทางสำเร็จ
  //
  // รีวิวรอบสุดท้าย ข้อ 6: แค่ตัดออกจาก select-all ไม่พอ — แถวตัวเองยังมี checkbox ให้ติ๊กเองอยู่ ซึ่ง
  // พาไปสู่ผลเดียวกับที่ตั้งใจกัน และทำให้ allSelected นับเพี้ยน (selected.size โตเกิน selectableIds
  // จนติ๊กครบก็ไม่เท่ากันสักที) จึงส่ง isRowSelectable ด้วยเงื่อนไขเดียวกันไปให้ DataTable ซ่อน
  // checkbox ของแถวตัวเองทิ้ง สอดคล้องกับเมนูสามจุดที่ตัดรายการของตัวเองไปแล้ว
  const isRowSelectable = (u: UserListItem) => u.id !== selfId;
  const selectableIds = users.filter(isRowSelectable).map((u) => u.id);

  const selection: DataTableSelection<UserListItem> | undefined = canManage
    ? {
        selectedIds: selected,
        onToggleRow: (u) => {
          const next = new Set(selected);
          if (next.has(u.id)) next.delete(u.id); else next.add(u.id);
          onSelectedChange(next);
        },
        onToggleAll: () => onSelectedChange(selected.size === selectableIds.length ? new Set() : new Set(selectableIds)),
        allSelected: selectableIds.length > 0 && selected.size === selectableIds.length,
        ariaLabelAll: t("users.selectAll"),
        ariaLabelRow: (u) => t("users.selectRow", { name: u.name }),
        isRowSelectable,
        bulkBar: {
          countLabel: (n) => t("users.selected", { n }),
          actions: (
            <Button type="button" size="sm" variant="destructive" onClick={() => onSuspend(users.filter((u) => selected.has(u.id)))}>
              {t("users.bulkSuspend")}
            </Button>
          ),
          onClear: () => onSelectedChange(new Set()),
          clearLabel: t("users.clearSelection"),
        },
      }
    : undefined;

  return (
    <DataTable
      state={state}
      columns={columns}
      rows={users}
      getRowId={(u) => u.id}
      selection={selection}
      renderRowMenu={
        canManage
          ? (u) => (
              <>
                <RowMenuItem icon={<Pencil aria-hidden="true" />} onSelect={() => onEdit(u)}>{t("users.menuEdit")}</RowMenuItem>
                <RowMenuItem icon={<KeyRound aria-hidden="true" />} onSelect={() => onIssueLink(u)}>{t("users.menuLink")}</RowMenuItem>
                <RowMenuItem icon={<Mail aria-hidden="true" />} onSelect={() => onChangeEmail(u)}>{t("users.menuEmail")}</RowMenuItem>
                {u.id !== selfId &&
                  (u.isActive ? (
                    <RowMenuItem danger icon={<Ban aria-hidden="true" />} onSelect={() => onSuspend([u])}>{t("users.menuSuspend")}</RowMenuItem>
                  ) : (
                    <RowMenuItem icon={<CircleCheck aria-hidden="true" />} onSelect={() => onActivate(u)}>{t("users.menuActivate")}</RowMenuItem>
                  ))}
              </>
            )
          : undefined
      }
      rowMenuLabel={(u) => t("users.rowMenu", { name: u.name })}
      empty={{ icon: <UsersIcon aria-hidden="true" />, title: t(hasFilters ? "users.noResults" : "users.empty") }}
      error={{ icon: <AlertCircle aria-hidden="true" />, title: t("users.loadFail"), actions: <Button type="button" size="sm" onClick={onRetry}>{t("auth.errorRetry")}</Button> }}
      toolbar={
        <>
          <span className="tsearch">
            <Search aria-hidden="true" />
            <input type="search" value={searchInput} onChange={(e) => onSearchInputChange(e.target.value)} placeholder={t("users.searchPh")} aria-label={t("common.search")} />
          </span>
          <LiyonSelect aria-label={t("users.filterStatus")} value={status} onChange={(e) => onStatusChange(e.target.value as "all" | "active" | "inactive")}>
            <option value="all">{t("common.all")}</option>
            <option value="active">{t("status.active")}</option>
            <option value="inactive">{t("status.inactive")}</option>
          </LiyonSelect>
          <LiyonSelect aria-label={t("users.filterRole")} value={roleId} onChange={(e) => onRoleChange(e.target.value)}>
            <option value="">{t("common.all")}</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{localizedName(r, locale)}</option>
            ))}
          </LiyonSelect>
        </>
      }
      headHeading={t("users.listTitle")}
      headMeta={t("users.total", { n: total })}
      footer={
        <>
          <span className="at">{t("common.page", { page, totalPages, total })}</span>
          <span className="pager">
            <button type="button" className="pg" onClick={onPrev} disabled={page <= 1} aria-label={t("common.prev")}>
              <ChevronLeft aria-hidden="true" />
            </button>
            <button type="button" className="pg" onClick={onNext} disabled={page >= totalPages} aria-label={t("common.next")}>
              <ChevronRight aria-hidden="true" />
            </button>
          </span>
        </>
      }
    />
  );
}
