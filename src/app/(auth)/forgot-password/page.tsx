"use client";
import { useState } from "react";
import Link from "next/link";
import { useT } from "@/shared/lib/i18n/client";
import { forgotPasswordAction } from "@/features/identity/actions";
import { BrandMarkIcon, MailIcon } from "../_components/icons";

export default function ForgotPasswordPage() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const r = await forgotPasswordAction({ email });
    setLoading(false);
    if (!r.ok && r.error.code === "validation") { setFieldError(r.error.fieldErrors?.email?.[0] ?? t("error.validation")); return; }
    setSent(true); // ok หรือ error อื่น — ข้อความเดียวกันเสมอ ไม่บอกใบ้ว่ามีบัญชีหรือไม่
  }

  return (
    <div className="auth-box">
      <div className="auth-mark"><i><BrandMarkIcon /></i><div><h1>{t("app.name")}</h1></div></div>
      <div className="auth-card">
        <div className="hd"><h2>{t("forgot.title")}</h2><p>{t("forgot.desc")}</p></div>
        {sent ? (
          <div className="state ok on"><p>{t("forgot.sent")}</p><div className="acts"><Link className="btn-sm solid" href="/login">{t("auth.backToLogin")}</Link></div></div>
        ) : (
          <form onSubmit={onSubmit} className="fields">
            <div className="field">
              <label htmlFor="email">{t("auth.email")}</label>
              <span className="wrap"><MailIcon /><input id="email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setFieldError(null); }} required /></span>
              {fieldError && <span className="err">{fieldError}</span>}
            </div>
            <button className="btn-wide" type="submit" disabled={loading}>{t("forgot.submit")}</button>
            <p className="auth-foot"><Link href="/login">{t("auth.backToLogin")}</Link></p>
          </form>
        )}
      </div>
    </div>
  );
}
