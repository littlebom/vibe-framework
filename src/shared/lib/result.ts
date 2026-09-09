import { unstable_rethrow } from "next/navigation";
import { ZodError } from "zod";
import { type ErrorCode, isAppError } from "./errors";
import { logger } from "./infra/logger";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ErrorCode; message: string; fieldErrors?: Record<string, string[]> } };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail<T = never>(code: ErrorCode, message: string = code, fieldErrors?: Record<string, string[]>): ActionResult<T> {
  return { ok: false, error: { code, message, fieldErrors } };
}

/** ห่อ Server Action: AppError → code · ZodError → validation · อื่น ๆ → internal (log ฝั่ง server เท่านั้น) */
export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return ok(await fn());
  } catch (e) {
    // Next สื่อสาร redirect()/notFound() ด้วยการ throw error ภายในของตัวเอง — ถ้ากลืนไว้ที่นี่
    // `requireSession` ที่เด้งไป /login (ดู session.ts) จะกลายเป็น envelope internal แทนการเด้งจริง
    unstable_rethrow(e);
    if (e instanceof ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of e.issues) {
        const key = issue.path.join(".") || "_";
        (fieldErrors[key] ??= []).push(issue.message);
      }
      return fail("validation", "validation", fieldErrors);
    }
    if (isAppError(e)) return fail(e.code, e.message, e.fieldErrors);
    logger.error("unhandled action error", { err: e instanceof Error ? e.message : String(e), stack: e instanceof Error ? e.stack : undefined });
    return fail("internal", "internal");
  }
}
