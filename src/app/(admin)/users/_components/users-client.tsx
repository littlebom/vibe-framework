"use client";
import { useCallback, useEffect, useState, useTransition } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useT } from "@/shared/lib/i18n/client";
import { listUsersAction, listRolesForPickerAction, createUserAction, updateUserAction, setUserActiveAction, issuePasswordLinkAction, requestEmailChangeAction } from "@/features/identity/actions";
import { UsersTableCard } from "./users-table-card";
import { UserDialog } from "./user-dialog";
import { LinkDialog } from "./link-dialog";
import { ChangeEmailDialog } from "./change-email-dialog";
import { SuspendDialog } from "./suspend-dialog";
import { emptyForm, type UserForm, type UserListItem, type RolePick } from "./types";

const PER_PAGE = 20;

export function UsersClient({ canManage, selfId }: { canManage: boolean; selfId: string }) {
  const t = useT();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [roles, setRoles] = useState<RolePick[]>([]);
  const [state, setState] = useState<"loading" | "data" | "empty" | "error">("loading");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [roleId, setRoleId] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();

  const [dialog, setDialog] = useState<null | { kind: "create" } | { kind: "edit"; user: UserListItem } | { kind: "link"; link: string; hours: number; title: string; desc: string; mailDelivered: boolean } | { kind: "email"; user: UserListItem } | { kind: "suspend"; users: UserListItem[] }>(null);
  const [form, setForm] = useState<UserForm>(emptyForm());

  useEffect(() => { const h = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300); return () => clearTimeout(h); }, [searchInput]);

  const load = useCallback(async () => {
    setState("loading");
    const r = await listUsersAction({ page, perPage: PER_PAGE, search, status, roleId: roleId || undefined });
    if (!r.ok) { setState("error"); return; }
    setUsers(r.data.items); setTotal(r.data.total); setState(r.data.items.length ? "data" : "empty"); setSelected(new Set());
  }, [page, search, status, roleId]);

  // load() แค่ refetch เมื่อ page/search/status/roleId เปลี่ยน (ไม่ใช่ setState ระหว่าง render) — เอฟเฟกต์ data-fetching
  // มาตรฐาน แต่ eslint-plugin-react-hooks จับ setState ทุกจุดในเอฟเฟกต์แรกของ mount ไม่แยกแยะ จึงต้องปิดกฎนี้เฉพาะบรรทัด
  useEffect(() => { void load(); }, [load]); // eslint-disable-line react-hooks/set-state-in-effect
  useEffect(() => { listRolesForPickerAction().then((r) => { if (r.ok) setRoles(r.data); }); }, []);

  // แยกตาม message ก่อน code เสมอ — "forbidden" มีได้หลายความหมาย (แก้ตัวเองไม่ได้ / เหลือ super admin
  // คนเดียว / แตะ super admin ไม่ได้) และต้องขึ้นข้อความที่ตรงกับสาเหตุจริง ไม่ใช่ข้อความ fallback เดียวเสมอ
  const fail = (error: { code: string; message: string }, fallback: string) => {
    toast.error(
      error.code === "conflict"
        ? t("users.emailTaken")
        : error.message === "last_super_admin"
          ? t("users.lastSuperAdmin")
          : error.message === "super_admin_protected"
            ? t("users.superAdminProtected")
            : error.code === "forbidden"
              ? t("users.cannotEditSelf")
              : fallback,
    );
  };

  function submitCreate() {
    start(async () => {
      const r = await createUserAction({ email: form.email, name: form.name, roles: form.roleIds.map((id) => ({ roleId: id, scopeType: "ALL", scopeId: null })) });
      if (!r.ok) return fail(r.error, r.error.fieldErrors ? Object.values(r.error.fieldErrors).flat()[0] : t("users.createFail"));
      toast.success(t("users.createOk"));
      setDialog({ kind: "link", link: r.data.link, hours: r.data.hours, title: t("users.linkTitle"), desc: t("users.linkDesc", { hours: r.data.hours }), mailDelivered: r.data.mailDelivered });
      void load();
    });
  }
  function submitEdit(user: UserListItem) {
    start(async () => {
      const r = await updateUserAction({ userId: user.id, name: form.name, roles: form.roleIds.map((id) => ({ roleId: id, scopeType: "ALL", scopeId: null })), mustChangePassword: form.mustChangePassword });
      if (!r.ok) return fail(r.error, t("users.editFail"));
      toast.success(t("users.editOk")); setDialog(null); void load();
    });
  }
  // B5: เดิม `return` ทันทีเมื่อรายการใดล้ม โดยไม่ปิด dialog และไม่ load() ใหม่ — ผลคือรายการก่อนหน้า
  // ถูกเปลี่ยนไปแล้วจริงในฐานข้อมูล แต่ตารางบนจอยังเป็นข้อมูลเก่า และไม่มีใครรู้ว่าสำเร็จไปกี่คน
  // ตอนนี้ทำต่อจนครบทุกคน แล้วรายงานจำนวนที่สำเร็จเสมอ พร้อมรีเฟรชตารางไม่ว่าผลจะเป็นอย่างไร
  function toggleActive(list: UserListItem[], isActive: boolean) {
    start(async () => {
      let done = 0;
      let firstError: { code: string; message: string } | null = null;
      for (const u of list) {
        const r = await setUserActiveAction({ userId: u.id, isActive });
        if (r.ok) done += 1;
        else firstError ??= r.error;
      }
      setDialog(null);
      void load();
      if (firstError && done === 0) { fail(firstError, t("common.error")); return; }
      if (firstError) { toast.warning(t("users.bulkPartial", { done, total: list.length })); return; }
      toast.success(isActive ? t("users.activateOk") : t("users.suspendOk"));
    });
  }
  function issueLink(user: UserListItem) {
    start(async () => {
      const r = await issuePasswordLinkAction({ userId: user.id });
      if (!r.ok) return fail(r.error, t("common.error"));
      setDialog({ kind: "link", link: r.data.link, hours: r.data.hours, title: t("users.linkTitle"), desc: t("users.linkDesc", { hours: r.data.hours }), mailDelivered: r.data.mailDelivered });
    });
  }
  function submitEmail(user: UserListItem, newEmail: string) {
    start(async () => {
      const r = await requestEmailChangeAction({ userId: user.id, newEmail });
      if (!r.ok) return fail(r.error, t("common.error"));
      setDialog({ kind: "link", link: r.data.link, hours: r.data.hours, title: t("users.emailLinkTitle"), desc: t("users.emailLinkDesc", { hours: r.data.hours }), mailDelivered: r.data.mailDelivered });
    });
  }

  return (
    <>
      <header className="ph hr">
        <h1 className="sr-only">{t("users.title")}</h1>
        {canManage && <div className="acts ml-auto"><Button type="button" onClick={() => { setForm(emptyForm()); setDialog({ kind: "create" }); }}><UserPlus aria-hidden="true" />{t("users.addBtn")}</Button></div>}
      </header>
      {/* canManage ของตารางปิดชั่วคราวขณะมี dialog เปิดอยู่ — คอลัมน์เลือกแถว/เมนูสามจุดของพื้นหลังหายไปด้วย
          (นอกจาก UX ที่ถูกต้องอยู่แล้ว คือพื้นหลังไม่ควรโต้ตอบได้ขณะมี dialog บัง — Radix aria-hides พื้นหลังให้
          แต่ getByLabel ของ Playwright ไม่มองข้าม aria-hidden เลย ถ้าไม่ปิดคอลัมน์เหล่านี้ ปุ่ม/checkbox ของแถว
          ผู้ใช้ที่ชื่อพ้องกับชื่อบทบาท (ผู้ดู, ผู้ดูแลสูงสุด — ตั้งใจให้พ้องกันใน seed) จะชนกับ getByLabel ในฟอร์ม) */}
      <UsersTableCard
        state={state} users={users} total={total} page={page} totalPages={Math.max(1, Math.ceil(total / PER_PAGE))}
        searchInput={searchInput} onSearchInputChange={setSearchInput} status={status} onStatusChange={(s) => { setStatus(s); setPage(1); }}
        roleId={roleId} roles={roles} onRoleChange={(r) => { setRoleId(r); setPage(1); }}
        onPrev={() => setPage((p) => Math.max(1, p - 1))} onNext={() => setPage((p) => p + 1)}
        canManage={canManage && dialog === null} selfId={selfId} selected={selected} onSelectedChange={setSelected}
        onEdit={(u) => { setForm({ name: u.name, email: u.email, roleIds: u.roles.map((r) => r.id), mustChangePassword: u.mustChangePassword }); setDialog({ kind: "edit", user: u }); }}
        onIssueLink={issueLink} onChangeEmail={(u) => setDialog({ kind: "email", user: u })}
        onSuspend={(list) => setDialog({ kind: "suspend", users: list })} onActivate={(u) => toggleActive([u], true)}
        onRetry={load}
      />
      <UserDialog open={dialog?.kind === "create" || dialog?.kind === "edit"} mode={dialog?.kind === "edit" ? "edit" : "create"} onOpenChange={(o) => !o && setDialog(null)}
        form={form} setForm={setForm} roles={roles} isSubmitting={pending} isSelf={dialog?.kind === "edit" && dialog.user.id === selfId}
        onSubmit={() => (dialog?.kind === "edit" ? submitEdit(dialog.user) : submitCreate())} />
      {dialog?.kind === "link" && <LinkDialog open onOpenChange={() => setDialog(null)} title={dialog.title} description={dialog.desc} link={dialog.link} mailDelivered={dialog.mailDelivered} />}
      {dialog?.kind === "email" && <ChangeEmailDialog open onOpenChange={() => setDialog(null)} user={dialog.user} isSubmitting={pending} onSubmit={(e) => submitEmail(dialog.user, e)} />}
      {dialog?.kind === "suspend" && <SuspendDialog open onOpenChange={() => setDialog(null)} users={dialog.users} isSubmitting={pending} onConfirm={() => toggleActive(dialog.users, false)} />}
    </>
  );
}
