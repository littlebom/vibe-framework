"use client";
import { useState } from "react";
import { LiyonDialog, LiyonDialogHeader, LiyonDialogBody, LiyonDialogFooter, LiyonDialogCloseButton, LiyonField } from "@/shared/components/liyon";
import { Button } from "@/components/ui/button";
import { useT } from "@/shared/lib/i18n/client";
import type { UserListItem } from "./types";

export function ChangeEmailDialog({
  open,
  onOpenChange,
  user,
  isSubmitting,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  user: UserListItem;
  isSubmitting: boolean;
  onSubmit: (newEmail: string) => void;
}) {
  const t = useT();
  const [newEmail, setNewEmail] = useState("");
  return (
    <LiyonDialog open={open} onOpenChange={onOpenChange}>
      <LiyonDialogCloseButton label={t("common.close")} />
      <LiyonDialogHeader title={t("users.emailTitle")} description={t("users.emailDesc")} />
      <LiyonDialogBody>
        <div className="fields">
          <LiyonField label={t("users.email")} htmlFor="current-email">
            <input id="current-email" value={user.email} readOnly disabled />
          </LiyonField>
          <LiyonField label={t("users.newEmail")} htmlFor="new-email">
            <input id="new-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required autoComplete="off" />
          </LiyonField>
        </div>
      </LiyonDialogBody>
      <LiyonDialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
        <Button type="button" disabled={isSubmitting || !newEmail.trim()} onClick={() => onSubmit(newEmail.trim())}>{t("common.confirm")}</Button>
      </LiyonDialogFooter>
    </LiyonDialog>
  );
}
