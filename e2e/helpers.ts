import "dotenv/config";
import { type BrowserContext, type Page, expect } from "@playwright/test";
import { encode } from "next-auth/jwt";

export const DEV_PASSWORD = "Passw0rd!vibe";
export const ADMIN = { email: "admin@app.local", password: DEV_PASSWORD };

/** ชื่อคุกกี้เซสชันของ next-auth บน http (ไม่ใช่ __Secure-) — เป็นทั้งชื่อคุกกี้และ `salt` ของ JWE */
const SESSION_COOKIE = "authjs.session-token";

/**
 * ยัดคุกกี้เซสชัน "ที่ลายเซ็นถูกต้องแต่ถูกเพิกถอนแล้ว" ให้ context — จำลองสภาพที่ B1.5 ต้องรับมือ
 *
 * ทำไมต้องปลอมคุกกี้แทนที่จะระงับผู้ใช้ผ่าน UI แล้วโหลดหน้าใหม่: `applyAuthorizationSnapshot` แตะ DB
 * เฉพาะเมื่อ `checkedAt` เก่ากว่า REVALIDATE_MS (5 นาที) เซสชันที่เพิ่ง login จึงยังไม่รู้ตัวว่าถูกระงับ
 * ภายในห้านาทีแรก และ Playwright รอห้านาทีไม่ได้ · `checkedAt: 0` บังคับให้ jwt callback ฝั่ง node
 * โหลด snapshot ทันทีในคำขอแรก ซึ่งคือ "คำขอแรกหลังถูกเพิกถอน" ที่เป็นหัวใจของเคสนี้พอดี
 *
 * `userId` เป็น UUID ที่ไม่มีในฐานข้อมูล = สมาชิกภาพหายไปแล้ว (ถูกลบ/ถูกถอดออกจาก tenant) ซึ่งเป็น
 * ทางเดียวกันกับที่ถูกระงับทุกประการในสายตาโค้ด: `loadAuthorizationSnapshot` คืน `{ invalid: true }`
 * เหมือนกัน · ด่าน edge (`proxy.ts`) ไม่แตะ DB จึงเห็นคุกกี้นี้เป็นเซสชันปกติและปล่อยผ่านทุกกรณี
 */
export async function seedRevokedSession(context: BrowserContext, baseURL: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("ต้องมี AUTH_SECRET ใน .env จึงจะปลอมคุกกี้เซสชันที่ถูกเพิกถอนได้");
  const token = await encode({
    salt: SESSION_COOKIE,
    secret,
    maxAge: 3600,
    token: { userId: "00000000-0000-4000-8000-0000000000ff", tenantId: "00000000-0000-4000-8000-0000000000fe", checkedAt: 0 },
  });
  await context.clearCookies();
  await context.addCookies([{ name: SESSION_COOKIE, value: token, url: baseURL, httpOnly: true, sameSite: "Lax" }]);
}

/** รอคุกกี้ authjs.csrf-token (ตั้งโดย password-login-form.tsx ตอน mount) ก่อนกด submit — ถ้ากดเร็วกว่า
 *  ที่คุกกี้จะมาถึง (เร็วกว่าที่มนุษย์พิมพ์ได้จริง) next-auth จะเจอ MissingCSRF ในการ submit ครั้งแรก
 *  แม้รหัสผ่านจะถูกต้องก็ตาม — ไม่ใช่บั๊กของฟอร์ม แค่ Playwright เร็วกว่าคนจริง */
async function waitForCsrfCookie(page: Page) {
  await expect
    .poll(async () => (await page.context().cookies()).some((c) => c.name === "authjs.csrf-token"), { timeout: 5_000 })
    .toBe(true);
}

/**
 * ล้างคุกกี้ก่อนเสมอ — `browser.newContext()` ที่เรียกจากเทสต์ในโปรเจกต์ "admin" สืบทอด
 * `storageState` ของโปรเจกต์ (เซสชันของ admin@app.local) มาด้วยโดยปริยาย (พฤติกรรมมาตรฐานของ
 * Playwright — context ใหม่รับค่าเริ่มต้นจาก `use` ของโปรเจกต์ เว้นแต่ระบุ options เอง) ผู้เรียก
 * loginAs ด้วย context ใหม่ (เช่น users.spec.ts ที่ทดสอบผู้ใช้อื่นในเบราว์เซอร์คนละคน) ตั้งใจให้ได้
 * เซสชันของ email/password ที่ระบุเท่านั้น ถ้าไม่ล้างคุกกี้ก่อน หน้า /login จะเห็นเซสชัน admin เดิม
 * ที่ยังไม่หมดอายุแล้วเด้งไป /dashboard ทันที ทำให้ #email ไม่มีวันโผล่ */
export async function loginAs(page: Page, email: string, password = DEV_PASSWORD) {
  await page.context().clearCookies();
  await page.goto("/login");
  await waitForCsrfCookie(page);
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.getByRole("button", { name: /เข้าสู่ระบบ|Sign in/ }).click();
}

export async function expectNoRawI18nKeys(page: Page) {
  const body = await page.locator("body").innerText();
  const raw = (body.match(/\b[a-z]{2,8}(\.[a-zA-Z]{2,})+\b/g) ?? []).filter((k) => !k.includes("@") && !/\.(ac|co|com|th|org|local)\b/.test(k));
  expect(raw, `พบ key ดิบ: ${raw.join(", ")}`).toHaveLength(0);
}
