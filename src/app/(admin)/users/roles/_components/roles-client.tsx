"use client";
import { useCallback, useEffect, useState, useTransition } from "react";
import { ShieldPlus, Pencil, Trash2, AlertCircle, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable, RowMenuItem, StatusPill, type DataTableColumn } from "@/shared/components/liyon";
import { useT, useLocale } from "@/shared/lib/i18n/client";
import { localizedName } from "@/shared/lib/format";
import { listRolesAction, listPermissionsAction, createRoleAction, updateRoleAction, deleteRoleAction } from "@/features/identity/actions";
import type { RoleItem } from "@/features/identity";
import { RoleDialog, emptyRoleForm, type RoleForm, type PermissionPick } from "./role-dialog";
import { DeleteRoleDialog } from "./delete-role-dialog";

export function RolesClient() {
  const t = useT();
  const locale = useLocale();
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionPick[]>([]);
  const [state, setState] = useState<"loading" | "data" | "empty" | "error">("loading");
  const [pending, start] = useTransition();

  const [dialog, setDialog] = useState<null | { kind: "create" } | { kind: "edit"; role: RoleItem } | { kind: "delete"; role: RoleItem }>(null);
  const [form, setForm] = useState<RoleForm>(emptyRoleForm());
  const [codeError, setCodeError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState("loading");
    const [r, p] = await Promise.all([listRolesAction(), listPermissionsAction()]);
    if (!r.ok || !p.ok) { setState("error"); return; }
    setRoles(r.data); setPermissions(p.data); setState(r.data.length ? "data" : "empty");
  }, []);

  // load() แค่ refetch ตอน mount (ไม่ใช่ setState ระหว่าง render) — เอฟเฟกต์ data-fetching มาตรฐาน
  // แต่ eslint-plugin-react-hooks จับ setState ทุกจุดในเอฟเฟกต์แรกของ mount ไม่แยกแยะ (เหมือน users-client.tsx)
  useEffect(() => { void load(); }, [load]); // eslint-disable-line react-hooks/set-state-in-effect

  // แยกตาม message ก่อน code เสมอ — "forbidden" มีได้สองความหมายที่นี่ (บทบาทระบบ / มอบสิทธิ์ที่ตัวเอง
  // ไม่มี) และต้องขึ้นข้อความที่ตรงกับสาเหตุจริง ไม่ใช่ข้อความ fallback เดียวเสมอ (รูปแบบเดียวกับ users-client)
  const forbiddenMessage = (error: { message: string }) =>
    error.message === "cannot_grant_unheld_permission" ? t("roles.cannotGrantUnheld") : t("roles.systemLocked");

  function submitCreate() {
    setCodeError(null);
    start(async () => {
      const r = await createRoleAction({ code: form.code, nameTh: form.nameTh, nameEn: form.nameEn, description: form.description, permissionCodes: form.permissionCodes });
      if (!r.ok) {
        if (r.error.code === "conflict") { toast.error(t("roles.codeTaken")); return; }
        if (r.error.code === "forbidden") { toast.error(forbiddenMessage(r.error)); return; }
        if (r.error.fieldErrors?.code) { setCodeError(r.error.fieldErrors.code[0] === "code_format" ? t("roles.codeFormat") : r.error.fieldErrors.code[0]); return; }
        toast.error(t("common.error"));
        return;
      }
      toast.success(t("roles.saveOk")); setDialog(null); void load();
    });
  }
  function submitEdit(role: RoleItem) {
    setCodeError(null);
    start(async () => {
      const r = await updateRoleAction({ roleId: role.id, nameTh: form.nameTh, nameEn: form.nameEn, description: form.description, permissionCodes: form.permissionCodes });
      if (!r.ok) { toast.error(r.error.code === "forbidden" ? forbiddenMessage(r.error) : t("common.error")); return; }
      toast.success(t("roles.saveOk")); setDialog(null); void load();
    });
  }
  function submitDelete(role: RoleItem) {
    start(async () => {
      const r = await deleteRoleAction({ roleId: role.id });
      if (!r.ok) {
        if (r.error.code === "conflict" && r.error.message.startsWith("in_use:")) {
          toast.error(t("roles.inUse", { n: r.error.message.split(":")[1] }));
          return;
        }
        toast.error(t("common.error"));
        return;
      }
      toast.success(t("roles.deleteOk")); setDialog(null); void load();
    });
  }

  const columns: DataTableColumn<RoleItem>[] = [
    { key: "code", header: t("roles.colCode"), render: (r) => <code>{r.code}</code> },
    {
      key: "name",
      header: t("roles.colName"),
      render: (r) => (
        <div className="flex items-center gap-2">
          <span>{localizedName(r, locale)}</span>
          {r.isSystem && <StatusPill tone="off">{t("roles.system")}</StatusPill>}
        </div>
      ),
    },
    { key: "members", header: t("roles.colMembers"), render: (r) => r.memberCount },
    {
      key: "perms",
      header: t("roles.colPerms"),
      render: (r) => <StatusPill tone="info">{r.code === "SUPER_ADMIN" ? t("roles.allPerms") : r.permissionCodes.length}</StatusPill>,
    },
  ];

  return (
    <>
      <header className="ph hr">
        <h1 className="sr-only">{t("roles.title")}</h1>
        <div className="acts ml-auto">
          <Button
            type="button"
            onClick={() => { setForm(emptyRoleForm()); setCodeError(null); setDialog({ kind: "create" }); }}
          >
            <ShieldPlus aria-hidden="true" />
            {t("roles.addBtn")}
          </Button>
        </div>
      </header>
      <DataTable
        state={state}
        columns={columns}
        rows={roles}
        getRowId={(r) => r.id}
        renderRowMenu={(r) => (
          <>
            <RowMenuItem
              icon={<Pencil aria-hidden="true" />}
              disabled={r.isSystem}
              onSelect={() => { setForm({ code: r.code, nameTh: r.nameTh, nameEn: r.nameEn, description: r.description ?? "", permissionCodes: r.permissionCodes }); setCodeError(null); setDialog({ kind: "edit", role: r }); }}
            >
              {t("roles.editTitle")}
            </RowMenuItem>
            <RowMenuItem
              danger
              icon={<Trash2 aria-hidden="true" />}
              disabled={r.isSystem || r.memberCount > 0}
              onSelect={() => setDialog({ kind: "delete", role: r })}
            >
              {t("roles.delete")}
            </RowMenuItem>
          </>
        )}
        rowMenuLabel={(r) => t("users.rowMenu", { name: r.code })}
        empty={{ icon: <KeyRound aria-hidden="true" />, title: t("roles.empty") }}
        error={{ icon: <AlertCircle aria-hidden="true" />, title: t("common.error"), actions: <Button type="button" size="sm" onClick={load}>{t("auth.errorRetry")}</Button> }}
        headHeading={t("roles.listTitle")}
      />
      <RoleDialog
        open={dialog?.kind === "create" || dialog?.kind === "edit"}
        mode={dialog?.kind === "edit" ? "edit" : "create"}
        onOpenChange={(o) => !o && setDialog(null)}
        form={form}
        setForm={setForm}
        permissions={permissions}
        isSubmitting={pending}
        codeError={codeError}
        onSubmit={() => (dialog?.kind === "edit" ? submitEdit(dialog.role) : submitCreate())}
      />
      {dialog?.kind === "delete" && (
        <DeleteRoleDialog open onOpenChange={() => setDialog(null)} role={dialog.role} isSubmitting={pending} onConfirm={() => submitDelete(dialog.role)} />
      )}
    </>
  );
}
