"use client";
import { signIn } from "next-auth/react";
import { useT } from "@/shared/lib/i18n/client";

const PROVIDER_ID = { google: "google", microsoft: "microsoft-entra-id" } as const;

export function OAuthButtons({ providers }: { providers: ("google" | "microsoft")[] }) {
  const t = useT();
  return (
    <div className="oauth">
      {providers.map((p) => (
        <button key={p} type="button" className="btn-oauth" onClick={() => signIn(PROVIDER_ID[p], { callbackUrl: "/dashboard" })}>
          {t(`auth.provider.${p}`)}
        </button>
      ))}
    </div>
  );
}
