"use client";
import { LiyonDialog, LiyonDialogHeader, LiyonDialogFooter, LiyonDialogCloseButton } from "@/shared/components/liyon";
import { Button } from "@/components/ui/button";
import { useT, useLocale } from "@/shared/lib/i18n/client";
import { localizedName } from "@/shared/lib/format";
import type { RoleItem } from "@/features/identity";

export function DeleteRoleDialog({
  open,
  onOpenChange,
  role,
  isSubmitting,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  role: RoleItem;
  isSubmitting: boolean;
  onConfirm: () => void;
}) {
  const t = useT();
  const locale = useLocale();
  return (
    <LiyonDialog open={open} onOpenChange={onOpenChange} danger>
      <LiyonDialogCloseButton label={t("common.close")} />
      <LiyonDialogHeader title={t("roles.delete")} description={t("roles.deleteDesc", { name: localizedName(role, locale) })} />
      <LiyonDialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
        <Button type="button" variant="destructive" disabled={isSubmitting} onClick={onConfirm}>{t("common.confirm")}</Button>
      </LiyonDialogFooter>
    </LiyonDialog>
  );
}
