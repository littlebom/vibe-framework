import { test, expect } from "@playwright/test";
import { loginAs, DEV_PASSWORD } from "./helpers";
import { prisma } from "@/shared/lib/infra/prisma";

test("ไม่มี session ถูกส่งไป /login พร้อม callbackUrl", async ({ page }) => {
  await page.goto("/users");
  await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fusers/);
});

test("forgot-password ตอบข้อความเดียวไม่ว่ามีบัญชีหรือไม่", async ({ page }) => {
  await page.goto("/forgot-password");
  await page.fill("#email", "nobody@app.local");
  await page.getByRole("button", { name: /ส่งลิงก์|Send link/ }).click();
  await expect(page.getByText(/ถ้ามีบัญชีนี้ในระบบ|If that account exists/)).toBeVisible();
});

test("reset-password ด้วยโทเคนปลอมแสดงสถานะใช้ไม่ได้", async ({ page }) => {
  await page.goto("/reset-password/this-token-is-not-valid-at-all");
  await page.fill("#pw", "NewPass123!");
  await page.fill("#pw2", "NewPass123!");
  await page.getByRole("button", { name: /บันทึกรหัสผ่าน|Save password/ }).click();
  // getByRole("alert") เจอสองตัว: .state.bad ของเราเอง กับ #__next-route-announcer__ ที่ Next.js
  // แปะ role="alert" ให้ทุกหน้าเองอัตโนมัติ (accessibility route announcer) — filter ด้วยข้อความ
  // เพื่อเลือกตัวที่มีเนื้อหาจริง ไม่ชนกับ strict mode ของ Playwright
  await expect(page.getByRole("alert").filter({ hasText: /ใช้ไม่ได้|invalid/ })).toBeVisible();
});

test("บัญชีที่ต้องเปลี่ยนรหัสถูกเด้งไป /change-password จนกว่าจะเปลี่ยน", async ({ page }) => {
  await loginAs(page, "forced@app.local");
  await expect(page).toHaveURL(/\/change-password/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/change-password/);
});

// รันท้ายสุดเสมอ: ทดสอบนี้ล็อกบัญชีจริงใน DB 15 นาที และ throttle คีย์ "ip:..." ล็อกทุกอีเมลจาก
// เครื่องเดียวกัน (ดู throttle.int.test.ts) — ถ้ารันก่อนเทสต์อื่นที่ต้อง login สำเร็จ (เช่นเทสต์
// forced@app.local ด้านบน) เทสต์เหล่านั้นจะถูกบล็อกไปด้วยเพราะมาจาก IP เดียวกัน
//
// การเรียงลำดับในไฟล์นี้ (belt) ไม่พอ เพราะ Playwright ไม่รับประกันลำดับระหว่าง project
// "admin" (ผ่าน setup ที่ล็อกอินเป็น admin@app.local) กับ "guest" (ไฟล์นี้) — ทั้งสองรันจาก
// IP เดียวกัน (localhost) จึงต้องล้างแถว login_throttles ที่เทสต์นี้สร้างเองด้วย (braces) ไม่งั้น
// แถว "ip:..." ที่ค้างอยู่จะบล็อกทุก login หลังจากนี้ในรันเดียวกัน ไม่ว่า project ไหนรันก่อนหลัง
test("รหัสผิดได้ข้อความเดียว และพลาด 5 ครั้งแล้วรหัสถูกก็เข้าไม่ได้", async ({ page }) => {
  try {
    for (let i = 0; i < 5; i++) {
      await loginAs(page, "lockme@app.local", "wrong-password");
      await expect(page.getByText(/อีเมลหรือรหัสผ่านไม่ถูกต้อง|Incorrect email or password/)).toBeVisible();
    }
    await loginAs(page, "lockme@app.local", DEV_PASSWORD);
    await expect(page.getByText(/อีเมลหรือรหัสผ่านไม่ถูกต้อง|Incorrect email or password/)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  } finally {
    // ล้างทุกแถวที่เทสต์นี้อาจสร้าง (ทั้งคีย์ "email:lockme@app.local" และ "ip:...") — ไม่มีเทสต์อื่น
    // ในชุดนี้ที่ต้องพึ่งสถานะ throttle ข้ามเทสต์ จึง deleteMany ทั้งตารางได้อย่างปลอดภัย
    await prisma.loginThrottle.deleteMany();
    await prisma.$disconnect();
  }
});
