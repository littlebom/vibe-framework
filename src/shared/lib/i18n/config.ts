export const LOCALES = ["th", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "th";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function asLocale(value: string | undefined | null): Locale {
  return value === "en" ? "en" : "th";
}
