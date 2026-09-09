import type { z } from "zod";
import type { Locale } from "./config";

/**
 * ชนิดของ issue ที่ error map ของ zod 4 ได้รับตอน parse (`{ error }`) หรือระดับ config
 * (`z.config({ customError })`) คือ `$ZodRawIssue` (ดีฟอลต์ตรง `$ZodIssue` รวมทุกโค้ด)
 * อ้างจาก node_modules/zod/v4/core/errors.d.cts:
 *   - `ParseContext<T>.error?: $ZodErrorMap<T>`      (schemas.d.cts:13)
 *   - `$ZodErrorMap<T>` มี call signature `(issue: $ZodRawIssue<T>) => {message}|string|undefined|null` (errors.d.cts:131)
 *   - `safeParse` ผูก `T` เป็น `errors.$ZodIssue` เสมอ (parse.d.cts) จึงเท่ากับ `$ZodRawIssue` (ดีฟอลต์)
 * `z.core` คือ `export * as core from "../core/index.cjs"` ซึ่ง re-export ทั้งไฟล์ errors.cjs
 * จึงเข้าถึงชนิดนี้ได้ตรง ๆ ผ่าน `z.core.$ZodRawIssue` โดยไม่ต้อง cast หรือ `any`
 */
type Issue = z.core.$ZodRawIssue;

const M = {
  invalid_email: { th: "รูปแบบอีเมลไม่ถูกต้อง", en: "Invalid email address" },
  required: { th: "กรุณากรอกข้อมูล", en: "Required" },
  too_small: { th: "ต้องมีอย่างน้อย {n} ตัวอักษร", en: "Must be at least {n} characters" },
  too_big: { th: "ต้องไม่เกิน {n} ตัวอักษร", en: "Must be at most {n} characters" },
  invalid: { th: "ข้อมูลไม่ถูกต้อง", en: "Invalid value" },
} as const;

const pick = (locale: Locale, k: keyof typeof M, n?: number) => M[k][locale].replace("{n}", String(n ?? ""));

/** ใช้เป็น `{ error: zodErrorMap(locale) }` ตอน parse หรือ `z.config({ customError })` ระดับ request */
export function zodErrorMap(locale: Locale) {
  return (issue: Issue): string => {
    switch (issue.code) {
      case "invalid_format":
        return issue.format === "email" ? pick(locale, "invalid_email") : pick(locale, "invalid");
      case "invalid_type":
        return issue.input === undefined ? pick(locale, "required") : pick(locale, "invalid");
      case "too_small":
        return issue.minimum === 1 ? pick(locale, "required") : pick(locale, "too_small", Number(issue.minimum));
      case "too_big":
        return pick(locale, "too_big", Number(issue.maximum));
      default:
        return pick(locale, "invalid");
    }
  };
}
