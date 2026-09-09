"use client";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { DEFAULT_LOCALE, type Locale } from "./config";
import { makeT, type Dictionary, type TFunction } from "./translate";

const Ctx = createContext<{ locale: Locale; messages: Dictionary }>({ locale: DEFAULT_LOCALE, messages: {} });

/** root layout อ่าน cookie แล้วส่ง locale + พจนานุกรมลงมาครั้งเดียว · สลับภาษา = setLocale + router.refresh() */
export function I18nProvider({ locale, messages, children }: { locale: Locale; messages: Dictionary; children: ReactNode }) {
  const value = useMemo(() => ({ locale, messages }), [locale, messages]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLocale(): Locale {
  return useContext(Ctx).locale;
}

export function useT(): TFunction {
  const { locale, messages } = useContext(Ctx);
  return useMemo(() => makeT(messages, locale), [messages, locale]);
}
