"use server";
import { cookies } from "next/headers";
import { runAction, type ActionResult } from "@/shared/lib/result";
import { LOCALE_COOKIE, asLocale, type Locale } from "@/shared/lib/i18n/config";
import { getLocale } from "@/shared/lib/i18n/server";
import { zodErrorMap } from "@/shared/lib/i18n/zod-locale";
import { prisma } from "@/shared/lib/infra/prisma";
import { getSessionContext, requireSession } from "../session";
import { updateProfileSchema } from "../validations/settings";
import { updateProfile } from "../services/profile.service";

/** ตั้ง cookie เสมอ และบันทึกลง users.locale ถ้า login อยู่ */
export async function setLocaleAction(locale: Locale): Promise<ActionResult<{ locale: Locale }>> {
  return runAction(async () => {
    const value = asLocale(locale);
    (await cookies()).set(LOCALE_COOKIE, value, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    const ctx = await getSessionContext();
    if (ctx) await prisma.user.update({ where: { id: ctx.userId }, data: { locale: value } });
    return { locale: value };
  });
}

/** เขียน users.locale และ cookie ภาษาในการ action เดียวกัน ไม่งั้นหน้าเว็บยังใช้ภาษาเดิมจนกว่าจะสลับซ้ำ */
export async function updateProfileAction(input: unknown): Promise<ActionResult<void>> {
  return runAction(async () => {
    const ctx = await requireSession();
    const data = updateProfileSchema.parse(input, { error: zodErrorMap(await getLocale()) });
    await updateProfile(ctx.userId, data);
    (await cookies()).set(LOCALE_COOKIE, data.locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  });
}
