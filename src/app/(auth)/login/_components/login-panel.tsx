"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useT } from "@/shared/lib/i18n/client";
import { BrandMarkIcon } from "../../_components/icons";
import { PasswordLoginForm } from "./password-login-form";
import { OAuthButtons } from "./oauth-buttons";

export function LoginPanel({ providers }: { providers: ("google" | "microsoft")[] }) {
  const t = useT();
  const error = useSearchParams().get("error");
  return (
    <div className="auth-box">
      <div className="auth-mark"><i><BrandMarkIcon /></i><div><h1>{t("app.name")}</h1></div></div>
      <div className="auth-head"><h2>{t("auth.welcome")}</h2><p>{t("auth.login.subtitle")}</p></div>
      {error === "NoAccount" && <p className="err" role="alert">{t("auth.oauthNoAccount")}</p>}
      <PasswordLoginForm />
      <div className="auth-foot"><p><Link href="/forgot-password">{t("auth.forgot")}</Link></p></div>
      {providers.length > 0 && (
        <>
          <div className="or"><span>{t("auth.orContinueWith")}</span></div>
          <OAuthButtons providers={providers} />
        </>
      )}
    </div>
  );
}
