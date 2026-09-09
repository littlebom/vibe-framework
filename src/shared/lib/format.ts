import type { Locale } from "./i18n/config";

export interface FormatDateOptions { time?: boolean }

/** DB เก็บ ค.ศ. เสมอ — การแสดง พ.ศ. เกิดที่นี่ที่เดียว (Intl ใช้ปฏิทินพุทธเมื่อ locale th-TH-u-ca-buddhist) */
export function formatDate(value: Date | string | null | undefined, locale: Locale, opts: FormatDateOptions = {}): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  const tag = locale === "th" ? "th-TH-u-ca-buddhist" : "en-GB";
  return new Intl.DateTimeFormat(tag, {
    year: "numeric", month: "short", day: "numeric",
    ...(opts.time ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Asia/Bangkok",
  }).format(date);
}

export interface Bilingual { nameTh: string; nameEn?: string | null }

export function localizedName(entity: Bilingual, locale: Locale): string {
  if (locale === "en" && entity.nameEn && entity.nameEn.trim() !== "") return entity.nameEn;
  return entity.nameTh;
}

/** ปีการศึกษาเก็บเป็นตัวเลข พ.ศ. (เป็นชื่อ ไม่ใช่วันที่) */
export function academicYearLabel(yearBE: number, locale: Locale): string {
  return locale === "th" ? `ปีการศึกษา ${yearBE}` : `AY ${yearBE - 543}`;
}
