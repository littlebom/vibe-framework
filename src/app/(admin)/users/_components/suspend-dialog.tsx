"use client";
import { LiyonDialog, LiyonDialogHeader, LiyonDialogFooter, LiyonDialogCloseButton } from "@/shared/components/liyon";
import { Button } from "@/components/ui/button";
import { useT } from "@/shared/lib/i18n/client";
import type { UserListItem } from "./types";

export function SuspendDialog({
  open,
  onOpenChange,
  users,
  isSubmitting,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  users: UserListItem[];
  isSubmitting: boolean;
  onConfirm: () => void;
}) {
  const t = useT();
  const name = users.length > 1 ? `${users[0]?.name ?? ""} +${users.length - 1}` : (users[0]?.name ?? "");
  return (
    <LiyonDialog open={open} onOpenChange={onOpenChange} danger>
      <LiyonDialogCloseButton label={t("common.close")} />
      <LiyonDialogHeader title={t("users.suspendTitle")} description={t("users.suspendDesc", { name })} />
      <LiyonDialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
        <Button type="button" variant="destructive" disabled={isSubmitting} onClick={onConfirm}>{t("common.confirm")}</Button>
      </LiyonDialogFooter>
    </LiyonDialog>
  );
}
