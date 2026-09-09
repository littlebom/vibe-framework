"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LiyonCard, LiyonField, LiyonSelect } from "@/shared/components/liyon";
import { useT } from "@/shared/lib/i18n/client";
import type { Locale } from "@/shared/lib/i18n/config";
import { updateProfileAction } from "@/features/identity/actions";

export function ProfileForm({ initial }: { initial: { name: string; locale: Locale; email: string } }) {
  const t = useT();
  const router = useRouter();
  const { update } = useSession();
  const [form, setForm] = useState({ name: initial.name, locale: initial.locale });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pending, start] = useTransition();

  function save() {
    start(async () => {
      const r = await updateProfileAction(form);
      if (!r.ok) { setErrors(r.error.fieldErrors ?? {}); if (!r.error.fieldErrors) toast.error(t(`error.${r.error.code}`)); return; }
      setErrors({});
      await update({ name: form.name });
      router.refresh();
      toast.success(t("me.saveOk"));
    });
  }

  return (
    <>
      <header className="ph"><h1>{t("me.title")}</h1></header>
      <div className="set-cards">
        <LiyonCard>
          <div className="fields">
            <LiyonField label={t("auth.email")} htmlFor="me-email"><input id="me-email" value={initial.email} readOnly disabled /></LiyonField>
            <LiyonField label={t("me.name")} htmlFor="me-name" error={errors.name?.[0]}><input id="me-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></LiyonField>
            <LiyonField label={t("me.language")} htmlFor="me-locale" error={errors.locale?.[0]}>
              <LiyonSelect id="me-locale" value={form.locale} onChange={(e) => setForm({ ...form, locale: e.target.value as Locale })}>
                <option value="th">{t("me.localeTh")}</option>
                <option value="en">{t("me.localeEn")}</option>
              </LiyonSelect>
            </LiyonField>
          </div>
          <p><Link href="/change-password">{t("me.passwordTitle")}</Link></p>
        </LiyonCard>
        <div className="savebar"><Button type="button" onClick={save} disabled={pending}>{t("common.save")}</Button></div>
      </div>
    </>
  );
}
