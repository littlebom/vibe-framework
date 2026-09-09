import type { Metadata } from "next";
import { Inter, Sarabun } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { I18nProvider } from "@/shared/lib/i18n/client";
import { getT } from "@/i18n/server";
import { UI_MESSAGES } from "@/i18n";
import { getLocaleCookie } from "@/shared/lib/i18n/server";
import { DEFAULT_LOCALE } from "@/shared/lib/i18n/config";
import { auth, resolvePalette } from "@/features/identity/server";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"] });
const sarabun = Sarabun({ variable: "--font-sarabun", subsets: ["thai", "latin"], weight: ["300", "400", "500", "600", "700", "800"], display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("app.name"), description: t("app.tagline") };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [cookieLocale, palette, session] = await Promise.all([getLocaleCookie(), resolvePalette(), auth().catch(() => null)]);
  const locale = cookieLocale ?? session?.locale ?? DEFAULT_LOCALE; // spec B7: login จากเครื่องใหม่ได้ภาษาที่ผู้ใช้เคยเลือก
  return (
    <html lang={locale} data-palette={palette} suppressHydrationWarning>
      <body className={`${inter.variable} ${sarabun.variable} font-sans antialiased`} suppressHydrationWarning>
        <div className="bg" aria-hidden="true" />
        <I18nProvider locale={locale} messages={UI_MESSAGES}>
          <SessionProvider>
            <ThemeProvider attribute={["class", "data-theme"]} defaultTheme="light" enableSystem={false}>
              {children}
              <Toaster />
            </ThemeProvider>
          </SessionProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
