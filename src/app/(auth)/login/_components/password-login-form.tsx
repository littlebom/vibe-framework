"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, getCsrfToken } from "next-auth/react";
import { toast } from "sonner";
import { useT } from "@/shared/lib/i18n/client";
import { safeCallbackUrl } from "@/shared/lib/security/callback-url";
import { MailIcon, LockIcon, EyeOnIcon, EyeOffIcon, LogInIcon } from "../../_components/icons";

export function PasswordLoginForm() {
  const router = useRouter();
  const callbackUrl = useSearchParams().get("callbackUrl");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const t = useT();

  // อุ่น csrf cookie ตั้งแต่หน้าโหลด — คุกกี้ authjs.csrf-token ตั้งได้เฉพาะตอนตอบ Route Handler
  // (ตั้งตอน render หน้า /login ซึ่งเป็น Server Component ไม่ได้) การกด submit ครั้งแรกโดยไม่มี
  // คุกกี้นี้เลยจะได้ MissingCSRF จาก next-auth แม้รหัสผ่านจะถูกต้องก็ตาม (สังเกตเห็นตอนรัน E2E
  // แบบยิงติดกันเร็ว ๆ) — เรียก getCsrfToken() ทิ้งไว้ตอน mount กันปัญหานี้ทั้งกับผู้ใช้จริงและเทสต์
  useEffect(() => {
    void getCsrfToken();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await signIn("credentials", { email, password, redirect: false });
      if (r?.error) toast.error(t("auth.invalidCredentials"));
      else {
        router.push(safeCallbackUrl(callbackUrl));
        router.refresh();
      }
    } catch {
      toast.error(t("auth.errorRetry"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="pane-password">
      <div className="fields">
        <div className="field">
          <label htmlFor="email">{t("auth.email")}</label>
          <span className="wrap"><MailIcon /><input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></span>
        </div>
        <div className="field">
          <label htmlFor="password">{t("auth.password")}</label>
          <span className="wrap">
            <LockIcon />
            <input id="password" type={show ? "text" : "password"} className="pw" autoComplete="current-password" placeholder={t("auth.passwordPlaceholder")} value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="button" className="peek" aria-pressed={show} aria-label={show ? t("auth.hidePassword") : t("auth.showPassword")} onClick={() => setShow((v) => !v)}><EyeOnIcon /><EyeOffIcon /></button>
          </span>
        </div>
        <button className="btn-wide" type="submit" disabled={loading}><LogInIcon />{loading ? t("auth.signingIn") : t("auth.signIn")}</button>
      </div>
    </form>
  );
}
