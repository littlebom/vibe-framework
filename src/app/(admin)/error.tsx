"use client";
import { useEffect } from "react";
import Link from "next/link";
import { ShieldAlert, AlertCircle } from "lucide-react";
import { useT } from "@/shared/lib/i18n/client";
import { FORBIDDEN_DIGEST } from "@/shared/lib/errors";

/**
 * ตาข่ายรับ error ของทุกหน้าใน (admin) — `requirePermission` throw ระหว่าง render ที่
 * `/settings`, `/users`, `/users/roles` (แถบเมนูซ่อนลิงก์ให้แล้ว แต่ผู้ใช้ที่มี bookmark เดิม
 * หรือพิมพ์ URL เองยังเข้ามาถึงได้) ถ้าไม่มีไฟล์นี้ ผู้ใช้ที่ signed-in แต่สิทธิ์ไม่พอจะเจอหน้า 500
 * เปล่า ๆ ของ Next แทนที่จะเป็นข้อความ 403
 *
 * แยก 403 ออกจาก 500 ด้วย `digest` ไม่ใช่ `code`/`message`: ใน production Next แทนที่ message ของ
 * error จาก Server Component ด้วยข้อความกลาง ๆ ก่อนส่งถึง client (`code` ของ AppError ก็ไม่รอด)
 * แต่ digest ที่ต้นทางตั้งไว้เองจะถูกส่งต่อมาเสมอ — ดู requirePermission และ FORBIDDEN_DIGEST
 * ยังเช็ค `code` เผื่อไว้ด้วยเพราะใน development error เดินทางมาทั้งก้อน
 *
 * error.tsx ไม่ครอบ layout ของ segment เดียวกัน — โครง AdminShell (แถบเมนู/หัวเรื่อง) จึงยังอยู่
 * และข้อความนี้ขึ้นในพื้นที่เนื้อหาเหมือนสถานะว่าง/ผิดพลาดของตาราง
 *
 * B1.5 (รีวิวรอบสุดท้าย ข้อ 3): ที่นี่ **ไม่มี** สาขาสำหรับ `unauthorized` โดยเจตนา — เดิมเซสชันที่ถูก
 * เพิกถอนตกลงมาที่นี่แล้วได้หน้า "เกิดข้อผิดพลาดภายในระบบ" เพราะไม่เข้าเงื่อนไข forbidden · ตอนนี้
 * `requireSession` (ต้นทางเดียวของ `unauthorized` ทั้งระบบ) เด้งไป `/login` ด้วย HTTP redirect ตั้งแต่
 * ฝั่ง server ก่อนอะไรจะถูกเรนเดอร์ 401 จึงไปไม่ถึงตาข่ายนี้อีก การเพิ่มสาขา 401 ที่นี่จะเป็นโค้ดตาย
 * และต้องพ่วง digest ตัวที่สองมาโดยไม่จำเป็น — ถ้าวันใดมีต้นทาง `unauthorized` ใหม่ ให้เด้งที่ต้นทาง
 * แบบเดียวกัน อย่ามาแก้ที่นี่
 */
export default function AdminError({ error, retry }: { error: Error & { digest?: string; code?: string }; retry: () => void }) {
  const t = useT();
  const forbidden = error.digest === FORBIDDEN_DIGEST || error.code === "forbidden";

  useEffect(() => {
    // 403 เป็นผลลัพธ์ปกติของการกันสิทธิ์ ไม่ใช่ความผิดพลาดของระบบ — ไม่ต้องส่งเสียงในคอนโซล
    if (!forbidden) console.error(error);
  }, [error, forbidden]);

  // ต้องอยู่ใน .dt-wrap: `.empty-state` ของ Liyon เป็น `display:none` โดยค่าเริ่มต้น (หน้าคอร์สต้นฉบับ
  // ซ่อนไว้แล้วให้ JS ตัวกรองเปิดเมื่อผลเป็นศูนย์) มีแต่กฎ `.dt-wrap .empty-state{display:block}`
  // ที่ทำให้มันโผล่ — โครงเดียวกับสถานะว่าง/ผิดพลาดของ DataTable · จับได้จาก E2E ของ A4 ที่ล้มรอบแรก
  return (
    <div className="dt-wrap">
      <div className="empty-state bad" role="alert">
        {forbidden ? <ShieldAlert aria-hidden="true" /> : <AlertCircle aria-hidden="true" />}
        <h3>{t(forbidden ? "error.forbidden" : "error.internal")}</h3>
        <div className="acts">
          {forbidden ? (
            <Link className="btn-sm solid" href="/dashboard">{t("nav.home")}</Link>
          ) : (
            <button type="button" className="btn-sm solid" onClick={() => retry()}>{t("auth.errorRetry")}</button>
          )}
        </div>
      </div>
    </div>
  );
}
