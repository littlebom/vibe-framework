import { prisma } from "@/shared/lib/infra/prisma";
import { asLocale, type Locale } from "@/shared/lib/i18n/config";
import { buildGrants, type Grants, type RoleGrant } from "./grants";

export const REVALIDATE_MS = 5 * 60 * 1000;

export type AuthorizationSnapshot =
  | { invalid: true }
  | ({ invalid: false; name: string; imageUrl: string | null; locale: Locale | null; mustChangePassword: boolean } & Grants);

export function needsRevalidation(checkedAt: number | undefined, now = Date.now()): boolean {
  return now - (checkedAt ?? 0) > REVALIDATE_MS;
}

/** null = ฐานข้อมูลล้ม ผู้เรียกคงโทเคนเดิม (fail open) — การเตะคนที่ถูกต้องออกเพราะ DB สะดุดแย่กว่าสิทธิ์ค้างอีก 5 นาที */
export async function loadAuthorizationSnapshot(userId: string, tenantId: string): Promise<AuthorizationSnapshot | null> {
  try {
    const m = await prisma.userTenant.findUnique({
      where: { userId_tenantId: { userId, tenantId } },
      select: {
        isActive: true,
        user: { select: { isActive: true, name: true, imageUrl: true, locale: true, mustChangePassword: true } },
        userRoles: {
          select: {
            scopeType: true, scopeId: true,
            role: { select: { code: true, nameTh: true, nameEn: true, isSystem: true, rolePermissions: { select: { permission: { select: { code: true } } } } } },
          },
        },
      },
    });
    if (!m || !m.isActive || !m.user.isActive) return { invalid: true };
    const grants = buildGrants(m.userRoles.map((ur) => ({
      scopeType: ur.scopeType, scopeId: ur.scopeId,
      role: { code: ur.role.code, nameTh: ur.role.nameTh, nameEn: ur.role.nameEn, isSystem: ur.role.isSystem, permissions: ur.role.rolePermissions.map((rp) => rp.permission.code) },
    })));
    return { invalid: false, name: m.user.name, imageUrl: m.user.imageUrl, locale: m.user.locale ? asLocale(m.user.locale) : null, mustChangePassword: m.user.mustChangePassword, ...grants };
  } catch {
    return null;
  }
}

export type SnapshotLoader = (userId: string, tenantId: string) => Promise<AuthorizationSnapshot | null>;

/** ส่วนของ JWT ที่วงจร revalidate เขียน — ตรงกับ module augmentation ใน `features/identity/types.ts` */
export interface RevalidatableToken {
  userId?: string;
  tenantId?: string;
  checkedAt?: number;
  invalid?: boolean;
  roles?: RoleGrant[];
  permissions?: string[];
  isSuperAdmin?: boolean;
  mustChangePassword?: boolean;
  locale?: Locale | null;
  name?: string | null;
  picture?: string | null;
}

/**
 * ขั้น "แก้ token" ของ `jwt` callback — แยกออกมาเป็นฟังก์ชันบริสุทธิ์ (รับ token + ตัวโหลด + เวลา
 * คืน token ที่แก้แล้ว) เพราะเดิมตรรกะนี้อยู่ในบรรทัดเดียวกลาง `_internal/auth.ts` ซึ่งไม่มีเทสต์ไหน
 * เรียกถึงได้เลย — ลบเงื่อนไข `needsRevalidation` ทิ้งแล้วเทสต์ทั้งชุดยังเขียว
 *
 * กฎที่ฟังก์ชันนี้ถือไว้ (ทั้งหมดมีเทสต์ใน `revalidate.int.test.ts`):
 * - ยังไม่มี userId/tenantId (ยังไม่ login) หรือ `checkedAt` ยังสด → ไม่แตะฐานข้อมูลและไม่แตะ token
 * - snapshot บอก invalid → ตั้ง `invalid` อย่างเดียว ไม่เขียนสิทธิ์ทับ
 * - ตัวโหลดคืน null (ฐานข้อมูลล้ม) → คง token เดิมไว้ทั้งก้อน (fail open — ดู loadAuthorizationSnapshot)
 * - ทุกครั้งที่ได้ตรวจจริง ประทับ `checkedAt` ใหม่เสมอ ไม่ว่าผลจะเป็นอย่างไร
 */
export async function applyAuthorizationSnapshot<T extends RevalidatableToken>(token: T, load: SnapshotLoader, now = Date.now()): Promise<T> {
  if (!token.userId || !token.tenantId || !needsRevalidation(token.checkedAt, now)) return token;
  const snap = await load(token.userId, token.tenantId);
  if (snap) {
    token.invalid = snap.invalid;
    if (!snap.invalid) {
      token.roles = snap.roles;
      token.permissions = snap.permissions;
      token.isSuperAdmin = snap.isSuperAdmin;
      token.mustChangePassword = snap.mustChangePassword;
      token.locale = snap.locale;
      token.name = snap.name;
      token.picture = snap.imageUrl ?? undefined;
    }
  }
  token.checkedAt = now;
  return token;
}
