"use client";
import { useState } from "react";
import Link from "next/link";
import { useT } from "@/shared/lib/i18n/client";
import { confirmEmailChangeAction } from "@/features/identity/actions";

/**
 * A9 (ruling R60, เบี่ยงจาก spec B6 โดยตั้งใจ) — โทเคน EMAIL_VERIFY เป็นแบบใช้ครั้งเดียว จึงห้าม
 * ถูกกินจากการ GET หน้านี้: ตัวสแกนลิงก์ของเมลองค์กร (Outlook Safe Links, Proofpoint, Mimecast)
 * เปิดทุก URL ในอีเมลขาเข้าก่อนผู้ใช้เสมอ ปลายทางจริงเป็นองค์กรที่ใช้เมลองค์กร ผู้ใช้จะกดลิงก์
 * แล้วเจอ "ใช้ไม่ได้" ทุกครั้งและต้องขอให้แอดมินออกลิงก์ใหม่ · การกินโทเคนจึงย้ายมาอยู่หลังการกดปุ่ม
 * (POST ผ่าน Server Action) ไม่ใช่ตอน render — สามสถานะผลลัพธ์ตาม B6 ยังอยู่ครบ แค่เกิดหลังกดยืนยัน
 */
export function VerifyEmailForm({ token }: { token: string }) {
  const t = useT();
  const [state, setState] = useState<"idle" | "checking" | "ok" | "bad">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("checking");
    const r = await confirmEmailChangeAction(token);
    setState(r.ok && r.data ? "ok" : "bad");
  }

  return (
    <div className="auth-box">
      <div className="auth-card">
        <div className="hd"><h2>{t("vemail.title")}</h2></div>
        {state === "ok" && (
          <div className="state ok on" role="status">
            <p>{t("vemail.ok")}</p>
            <div className="acts"><Link className="btn-sm solid" href="/login">{t("auth.signIn")}</Link></div>
          </div>
        )}
        {state === "bad" && (
          <div className="state bad on" role="alert">
            <p>{t("vemail.bad")}</p>
            <div className="acts"><Link className="btn-sm solid" href="/login">{t("auth.signIn")}</Link></div>
          </div>
        )}
        {(state === "idle" || state === "checking") && (
          <form onSubmit={onSubmit} className="fields">
            <p>{t("vemail.confirmDesc")}</p>
            <button className="btn-wide" type="submit" disabled={state === "checking"}>
              {state === "checking" ? t("vemail.checking") : t("common.confirm")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
