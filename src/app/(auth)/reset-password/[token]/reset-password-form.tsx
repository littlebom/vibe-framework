"use client";
import { useState } from "react";
import Link from "next/link";
import { useT } from "@/shared/lib/i18n/client";
import { resetPasswordAction } from "@/features/identity/actions";
import { BrandMarkIcon, LockIcon } from "../../_components/icons";

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useT();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [state, setState] = useState<"form" | "done" | "invalid">("form");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw !== pw2) { setError(t("reset.mismatch")); return; }
    setLoading(true);
    const r = await resetPasswordAction({ token, password: pw });
    setLoading(false);
    if (r.ok) setState("done");
    else if (r.error.code === "not_found") setState("invalid");
    else setError(r.error.fieldErrors?.password?.[0] ?? t(`error.${r.error.code}`));
  }

  return (
    <div className="auth-box">
      <div className="auth-mark"><i><BrandMarkIcon /></i><div><h1>{t("app.name")}</h1></div></div>
      <div className="auth-card">
        <div className="hd"><h2>{t("reset.title")}</h2><p>{t("reset.desc")}</p></div>
        {state === "done" && <div className="state ok on"><p>{t("reset.done")}</p><div className="acts"><Link className="btn-sm solid" href="/login">{t("auth.signIn")}</Link></div></div>}
        {state === "invalid" && <div className="state bad on" role="alert"><p>{t("reset.invalid")}</p><div className="acts"><Link className="btn-sm" href="/forgot-password">{t("forgot.title")}</Link></div></div>}
        {state === "form" && (
          <form onSubmit={onSubmit} className="fields">
            <div className="field"><label htmlFor="pw">{t("reset.newPassword")}</label><span className="wrap"><LockIcon /><input id="pw" type="password" autoComplete="new-password" value={pw} onChange={(e) => { setPw(e.target.value); setError(null); }} required minLength={8} /></span></div>
            <div className="field"><label htmlFor="pw2">{t("reset.confirmPassword")}</label><span className="wrap"><LockIcon /><input id="pw2" type="password" autoComplete="new-password" value={pw2} onChange={(e) => { setPw2(e.target.value); setError(null); }} required /></span>{error && <span className="err" role="alert">{error}</span>}</div>
            <button className="btn-wide" type="submit" disabled={loading}>{t("reset.submit")}</button>
          </form>
        )}
      </div>
    </div>
  );
}
