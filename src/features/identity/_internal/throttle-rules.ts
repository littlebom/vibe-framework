export const MAX_FAILURES = 5;
export const LOCK_MS = 15 * 60 * 1000;
export const WINDOW_MS = 15 * 60 * 1000;

export interface ThrottleRow { failCount: number; lockedUntil: Date | null; updatedAt: Date }

export function isLocked(row: ThrottleRow | null, now: Date): boolean {
  return !!row?.lockedUntil && row.lockedUntil.getTime() > now.getTime();
}

/** สถานะใหม่หลังพลาดหนึ่งครั้ง — หน้าต่างเวลานับจากครั้งล่าสุด ถ้าเลยหรือล็อกหมดอายุแล้วให้เริ่มใหม่ */
export function applyFailure(row: ThrottleRow | null, now: Date): { failCount: number; lockedUntil: Date | null } {
  const stale = !row || now.getTime() - row.updatedAt.getTime() > WINDOW_MS || (row.lockedUntil !== null && !isLocked(row, now));
  const failCount = stale ? 1 : row.failCount + 1;
  const lockedUntil = failCount >= MAX_FAILURES ? new Date(now.getTime() + LOCK_MS) : null;
  return { failCount, lockedUntil };
}
