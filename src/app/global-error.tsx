"use client";
import { makeT } from "@/shared/lib/i18n/translate";
import { DEFAULT_LOCALE } from "@/shared/lib/i18n/config";
import { UI_MESSAGES } from "@/i18n";

/**
 * ตาข่ายชั้นสุดท้าย — ใช้เมื่อ root layout เองพัง (`resolvePalette`, `auth()`, การอ่านคุกกี้ภาษา,
 * ThemeProvider/SessionProvider) ซึ่ง (admin)/error.tsx รับไม่ได้เพราะมันอยู่ใต้ layout นั้นอีกที
 *
 * ไฟล์นี้ "แทนที่" root layout ทั้งอัน จึงต้องมี <html>/<body> ของตัวเอง และเข้าไม่ถึงทั้ง globals.css,
 * I18nProvider และคุกกี้ภาษาที่ layout อ่านให้ — ข้อความจึงเรียก makeT กับพจนานุกรมตรง ๆ ที่ภาษา
 * เริ่มต้นของระบบ (ยังผ่าน dictionary ทั้งสองภาษาตามกติกา ไม่ใช่ literal) และสไตล์เป็น inline ล้วน
 */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const t = makeT(UI_MESSAGES, DEFAULT_LOCALE);
  return (
    <html lang={DEFAULT_LOCALE}>
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "system-ui, sans-serif" }}>
        <main role="alert" style={{ textAlign: "center", padding: "2rem", maxWidth: "32rem" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>{t("error.internal")}</h1>
          {error.digest && <p style={{ opacity: 0.6, fontSize: "0.8rem", fontFamily: "monospace" }}>{error.digest}</p>}
          <button
            type="button"
            onClick={() => retry()}
            style={{ marginTop: "1rem", padding: "0.5rem 1.25rem", borderRadius: "0.5rem", border: "1px solid currentColor", background: "transparent", color: "inherit", cursor: "pointer" }}
          >
            {t("auth.errorRetry")}
          </button>
        </main>
      </body>
    </html>
  );
}
