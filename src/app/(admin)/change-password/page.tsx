"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useT } from "@/shared/lib/i18n/client";
import { changePasswordAction } from "@/features/identity/actions";
import { LiyonCard } from "@/shared/components/liyon";
import { Button } from "@/components/ui/button";

export default function ChangePasswordPage() {
  const t = useT();
  const router = useRouter();
  const { data: session, update } = useSession();
  const [cur, setCur] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw !== pw2) { setErrors({ pw2: t("reset.mismatch") }); return; }
    setLoading(true);
    const r = await changePasswordAction({ currentPassword: cur, newPassword: pw });
    setLoading(false);
    if (!r.ok) {
      const fe = r.error.fieldErrors ?? {};
      setErrors({
        cur: fe.currentPassword?.[0] === "wrong_current" ? t("change.wrongCurrent") : fe.currentPassword?.[0] ?? "",
        pw: fe.newPassword?.[0] === "same_as_old" ? t("change.sameAsOld") : fe.newPassword?.[0] ?? "",
      });
      if (!fe.currentPassword && !fe.newPassword) toast.error(t(`error.${r.error.code}`));
      return;
    }
    toast.success(t("change.done"));
    await update({}); // บังคับ jwt callback โหลด snapshot ใหม่ → mustChangePassword หาย
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <LiyonCard className="mx-auto max-w-lg">
      <h1>{t("change.title")}</h1>
      {session?.mustChangePassword && <p className="warn" role="status">{t("change.forced")}</p>}
      <form onSubmit={onSubmit} className="fields">
        <div className="field"><label htmlFor="cur">{t("change.current")}</label><input id="cur" type="password" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} required />{errors.cur && <span className="err">{errors.cur}</span>}</div>
        <div className="field"><label htmlFor="pw">{t("reset.newPassword")}</label><input id="pw" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={8} />{errors.pw && <span className="err">{errors.pw}</span>}</div>
        <div className="field"><label htmlFor="pw2">{t("reset.confirmPassword")}</label><input id="pw2" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} required />{errors.pw2 && <span className="err">{errors.pw2}</span>}</div>
        <Button type="submit" disabled={loading}>{t("common.save")}</Button>
      </form>
    </LiyonCard>
  );
}
