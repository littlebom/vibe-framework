export type ErrorCode = "validation" | "unauthorized" | "forbidden" | "not_found" | "conflict" | "rate_limited" | "internal";

const STATUS: Record<ErrorCode, number> = {
  validation: 422, unauthorized: 401, forbidden: 403, not_found: 404, conflict: 409, rate_limited: 429, internal: 500,
};

/**
 * ป้ายบอก error boundary ว่านี่คือ 403 ไม่ใช่ 500
 *
 * Next แทนที่ `message` ของ error ที่ throw จาก Server Component ด้วยข้อความกลาง ๆ ก่อนส่งถึง client
 * ใน production (กันข้อมูลรั่ว) — `code`/`message` ของ AppError จึงไปไม่ถึง `error.tsx` แต่ Next
 * "เคารพ digest เดิมถ้า error มีอยู่แล้ว" (`next/dist/server/app-render/create-error-handler.js`)
 * ค่าคงที่นี้จึงเป็นช่องทางเดียวที่ข้ามฝั่งไปได้แน่นอนทั้ง dev และ production
 */
export const FORBIDDEN_DIGEST = "UMS_FORBIDDEN";

export class AppError extends Error {
  /** ตั้งเองได้เมื่อ error นี้จะถูก throw ระหว่าง render (ดู FORBIDDEN_DIGEST) — Next จะไม่ทับค่าที่ตั้งไว้ */
  public digest?: string;

  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly status: number = STATUS[code],
    public readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

type Factory = (message?: string, fieldErrors?: Record<string, string[]>) => AppError;

function make(code: ErrorCode): Factory {
  // message ค่าเริ่มต้น = code เพื่อให้ UI แปลผ่าน t(`error.${code}`)
  return (message = code, fieldErrors) => new AppError(code, message, STATUS[code], fieldErrors);
}

export const errors: Record<ErrorCode, Factory> = {
  validation: make("validation"),
  unauthorized: make("unauthorized"),
  forbidden: make("forbidden"),
  not_found: make("not_found"),
  conflict: make("conflict"),
  rate_limited: make("rate_limited"),
  internal: make("internal"),
};

export function isAppError(e: unknown): e is AppError {
  return e instanceof AppError;
}
