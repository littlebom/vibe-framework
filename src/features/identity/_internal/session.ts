import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Locale } from "@/shared/lib/i18n/config";
import { safeCallbackUrl, CURRENT_PATH_HEADER } from "@/shared/lib/security/callback-url";
import type { RoleGrant } from "./grants";
import { auth } from "./auth";

export interface SessionContext {
  userId: string;
  userName: string;
  email: string;
  tenantId: string;
  locale: Locale | null;
  roles: RoleGrant[];
  /**
   * ⚠️ SCOPE-BLIND UNION — อ่านชื่อนี้ผิดได้ง่ายมาก
   *
   * นี่คือ union ของสิทธิ์จากทุก grant ของผู้ใช้ **โดยไม่สนขอบเขต** (`grants.ts` `buildGrants`)
   * ผู้ที่ได้บทบาทมาแบบ `scopeType: "CAMPUS"` จะปรากฏใน `permissions` เหมือนกับได้แบบ `ALL` ทุกประการ
   * ตัวที่ยังเก็บขอบเขตไว้จริงคือ `roles` เท่านั้น — ใครต้องการบังคับตามขอบเขตต้องเรียก
   * `hasPermission(ctx, code, scope)` พร้อม `scope` หรือ `permissionScopes(ctx, code)` เสมอ
   *
   * sub-project 1 ทั้งโปรเจกต์เรียกแบบไม่ระบุ scope (ตาม spec B5) — การบังคับตามขอบเขตจริงเป็นภาระของ
   * sub-project 2 พร้อมรายชื่อจุดที่ต้องกลับมาแก้ใน spec B14 หัวข้อ "กลไก scope ยังไม่ทำงาน"
   */
  permissions: string[];
  isSuperAdmin: boolean;
  mustChangePassword: boolean;
}

export async function getSessionContext(): Promise<SessionContext | null> {
  const session = await auth();
  if (!session?.user?.id || !session.tenantId) return null;
  return {
    userId: session.user.id,
    userName: session.user.name ?? "",
    email: session.user.email ?? "",
    tenantId: session.tenantId,
    locale: session.locale,
    roles: session.roles,
    permissions: session.permissions,
    isSuperAdmin: session.isSuperAdmin,
    mustChangePassword: session.mustChangePassword,
  };
}

const LOGIN_PATH = "/login";

/**
 * B1.5 — ไม่มีเซสชันแล้ว = พาไปหน้า login ไม่ใช่ throw `unauthorized`
 *
 * ด่าน edge (`proxy.ts`) อ่านคุกกี้ JWT โดยไม่แตะ DB จึงมองไม่เห็นว่าเซสชันถูกเพิกถอน (ระงับบัญชี ถอด
 * สมาชิกภาพ ลบผู้ใช้) คำขอ **แรก** หลังถูกเพิกถอนจึงผ่านด่านมาถึงเพจเสมอ แล้ว jwt callback ฝั่ง node
 * ค่อยเขียน `invalid` ลงคุกกี้ระหว่างทาง — เดิมที่นี่ throw `unauthorized` ซึ่งตกลงตาข่าย
 * `(admin)/error.tsx` ที่รู้จักแค่ `forbidden` กับ `internal` ผู้ใช้ทุกคนที่ถูกเพิกถอนสิทธิ์จึงเห็นหน้า
 * "เกิดข้อผิดพลาดภายในระบบ" เป็นหน้าจอแรก แล้วค่อยถูกเด้งถูกต้องในคำขอที่สอง
 *
 * เลือก redirect ที่นี่แทนที่จะไปแก้ที่ error boundary เพราะ boundary เป็น client component — กว่าจะถึง
 * มันคือหลังจากเรนเดอร์ล้มไปแล้วหนึ่งรอบ ต้องส่งสัญญาณ 401 ข้ามฝั่ง (digest) และการเด้งจะเป็น
 * client-side navigation ที่ผู้ใช้เห็นหน้าผิดแวบหนึ่งก่อน · จุดนี้เป็นต้นทางเดียวของ `unauthorized`
 * ทั้งระบบและอยู่ฝั่ง server จึงจบได้ด้วย HTTP redirect ตรง ๆ ก่อนมีอะไรถูกเรนเดอร์
 *
 * ไม่กระทบการแยก 401/403: `requirePermission` ที่ผู้ใช้ล็อกอินอยู่แต่สิทธิ์ไม่พอยังคง throw `forbidden`
 * (พร้อม FORBIDDEN_DIGEST) และได้หน้า 403 เหมือนเดิมทุกประการ — ที่นี่จับเฉพาะ "ไม่มีเซสชันเลย"
 *
 * ไม่วนลูป: หน้า `/login` อยู่ใน GUEST_ONLY ของ proxy และไม่มีหน้าไหนในกลุ่มนั้นเรียก requireSession
 * ถึงอย่างนั้นก็ยังกัน `callbackUrl` ที่ชี้กลับมาที่ `/login` ทิ้งไว้อีกชั้นหนึ่ง
 */
export async function requireSession(): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (ctx) return ctx;
  // ค่าจาก header ไม่ไว้ใจตรง ๆ — ผ่าน safeCallbackUrl ตัวเดียวกับที่ฟอร์ม login ใช้ตอนเด้งกลับ (CWE-601)
  const current = (await headers()).get(CURRENT_PATH_HEADER);
  const back = current ? safeCallbackUrl(current) : null;
  redirect(back && back !== LOGIN_PATH && !back.startsWith(`${LOGIN_PATH}?`) ? `${LOGIN_PATH}?callbackUrl=${encodeURIComponent(back)}` : LOGIN_PATH);
}
