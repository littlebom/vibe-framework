"use client";
import { LiyonDialog, LiyonDialogHeader, LiyonDialogBody, LiyonDialogFooter, LiyonDialogCloseButton, LiyonField } from "@/shared/components/liyon";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useT } from "@/shared/lib/i18n/client";

export interface RoleForm {
  code: string;
  nameTh: string;
  nameEn: string;
  description: string;
  permissionCodes: string[];
}

export const emptyRoleForm = (): RoleForm => ({ code: "", nameTh: "", nameEn: "", description: "", permissionCodes: [] });

export interface PermissionPick { code: string; module: string; action: string }

export function RoleDialog({
  open,
  mode,
  onOpenChange,
  form,
  setForm,
  permissions,
  isSubmitting,
  codeError,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  onOpenChange: (o: boolean) => void;
  form: RoleForm;
  setForm: (updater: (f: RoleForm) => RoleForm) => void;
  permissions: PermissionPick[];
  isSubmitting: boolean;
  codeError: string | null;
  onSubmit: () => void;
}) {
  const t = useT();
  const canSubmit = form.code.trim() !== "" && form.nameTh.trim() !== "" && form.nameEn.trim() !== "" && !isSubmitting;

  const modules = [...new Set(permissions.map((p) => p.module))];

  function togglePermission(code: string, checked: boolean) {
    setForm((f) => ({ ...f, permissionCodes: checked ? [...f.permissionCodes, code] : f.permissionCodes.filter((c) => c !== code) }));
  }

  return (
    <LiyonDialog open={open} onOpenChange={onOpenChange} wide>
      <LiyonDialogCloseButton label={t("common.close")} />
      <LiyonDialogHeader title={t(mode === "create" ? "roles.createTitle" : "roles.editTitle")} />
      <LiyonDialogBody>
        <div className="fields">
          <LiyonField label={t("roles.code")} htmlFor="role-code" error={codeError ?? undefined}>
            <input
              id="role-code"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              disabled={mode === "edit"}
              required
            />
          </LiyonField>
          <LiyonField label={t("roles.nameTh")} htmlFor="role-name-th">
            <input id="role-name-th" value={form.nameTh} onChange={(e) => setForm((f) => ({ ...f, nameTh: e.target.value }))} required />
          </LiyonField>
          <LiyonField label={t("roles.nameEn")} htmlFor="role-name-en">
            <input id="role-name-en" value={form.nameEn} onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))} required />
          </LiyonField>
          <LiyonField label={t("roles.description")} htmlFor="role-desc">
            <textarea id="role-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </LiyonField>
          <LiyonField label={t("roles.perms")}>
            <div className="flex flex-col gap-3">
              {modules.map((module) => (
                <fieldset key={module} className="flex flex-col gap-2">
                  <legend>{t(`roles.module.${module}`)}</legend>
                  {permissions
                    .filter((p) => p.module === module)
                    .map((p) => (
                      <label key={p.code} htmlFor={`perm-${p.code}`} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          id={`perm-${p.code}`}
                          checked={form.permissionCodes.includes(p.code)}
                          onCheckedChange={(c) => togglePermission(p.code, c === true)}
                        />
                        {t(`perm.${p.code}`)}
                      </label>
                    ))}
                </fieldset>
              ))}
            </div>
          </LiyonField>
        </div>
      </LiyonDialogBody>
      <LiyonDialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
        <Button type="button" disabled={!canSubmit} onClick={onSubmit}>{t("common.save")}</Button>
      </LiyonDialogFooter>
    </LiyonDialog>
  );
}
