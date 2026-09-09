import type { Locale } from "./config";

export type Message = Record<Locale, string>;
export type Dictionary = Record<string, Message>;
export type TParams = Record<string, string | number>;
export type TFunction = (key: string, params?: TParams) => string;

export function hasMessage(dict: Dictionary, key: string): boolean {
  return key in dict;
}

/** ไม่มีแปลของภาษานั้น → ถอยไปไทย → ถอยไป key (เห็นชัดแต่ไม่ล้ม) */
export function translate(dict: Dictionary, locale: Locale, key: string, params?: TParams): string {
  const entry = dict[key];
  let out = entry ? (entry[locale] || entry.th || key) : key;
  if (params) for (const [k, v] of Object.entries(params)) out = out.replaceAll(`{${k}}`, String(v));
  return out;
}

export function makeT(dict: Dictionary, locale: Locale): TFunction {
  return (key, params) => translate(dict, locale, key, params);
}
