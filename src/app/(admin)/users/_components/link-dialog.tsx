"use client";
import { useState } from "react";
import { LiyonDialog, LiyonDialogHeader, LiyonDialogBody, LiyonDialogFooter, LiyonDialogCloseButton } from "@/shared/components/liyon";
import { Button } from "@/components/ui/button";
import { useT } from "@/shared/lib/i18n/client";

export function LinkDialog({ open, onOpenChange, title, description, link, mailDelivered }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description: string; link: string; mailDelivered: boolean }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  return (
    <LiyonDialog open={open} onOpenChange={onOpenChange}>
      <LiyonDialogCloseButton label={t("common.close")} />
      <LiyonDialogHeader title={title} description={description} />
      <LiyonDialogBody>
        <input readOnly value={link} aria-label={title} data-testid="issued-link" onFocus={(e) => e.currentTarget.select()} className="w-full" />
        {/* B17: mailer ไม่เคย throw — SMTP ที่ตั้งค่าผิดจะล้มเงียบ ๆ ถ้าไม่บอกตรงนี้ แอดมินเห็นแค่
            "สร้างผู้ใช้แล้ว" แล้วไม่มีใครรู้ว่าต้องส่งลิงก์เอง (ลิงก์อยู่ตรงหน้าอยู่แล้ว แค่ไม่รู้ว่าต้องใช้) */}
        {!mailDelivered && <p className="state bad on" role="status">{t("users.mailNotSent")}</p>}
      </LiyonDialogBody>
      <LiyonDialogFooter>
        <Button type="button" onClick={async () => { await navigator.clipboard.writeText(link).catch(() => {}); setCopied(true); }}>{copied ? t("common.copied") : t("common.copy")}</Button>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.close")}</Button>
      </LiyonDialogFooter>
    </LiyonDialog>
  );
}
