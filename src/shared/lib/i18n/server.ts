import "server-only";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, asLocale, type Locale } from "./config";

export async function getLocale(): Promise<Locale> {
  return asLocale((await cookies()).get(LOCALE_COOKIE)?.value);
}

/** null เมื่อยังไม่มี cookie — ให้ผู้เรียกเลือก fallback (เช่น users.locale) */
export async function getLocaleCookie(): Promise<Locale | null> {
  const v = (await cookies()).get(LOCALE_COOKIE)?.value;
  return v === "th" || v === "en" ? v : null;
}
