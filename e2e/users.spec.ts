import { test, expect } from "@playwright/test";
import { loginAs, seedRevokedSession } from "./helpers";

test("สร้างผู้ใช้ → เปิดลิงก์ → ตั้งรหัส → login → เห็นเฉพาะเมนูตามสิทธิ์", async ({ page, browser }) => {
  const email = `e2e-${Date.now()}@app.local`;
  await page.goto("/users");
  await page.getByRole("button", { name: /เพิ่มผู้ใช้/ }).click();
  await page.fill("#user-name", "ผู้ใช้ทดสอบ");
  await page.fill("#user-email", email);
  // exact-match (ไม่ใช่ regex คลุมเครือ) — "ผู้ดู" (VIEWER) เป็นคำนำหน้าของ "ผู้ดูแลระบบ" (ADMIN) ด้วย
  // การจับคู่แบบ substring จึงชนกันเมื่อฟอร์มสร้างผู้ใช้เปิดให้เลือก ADMIN ได้ (ดู task-11 fix round 1 / F2)
  await page.getByLabel("ผู้ดู", { exact: true }).check();
  await page.getByRole("button", { name: /สร้างผู้ใช้/ }).click();
  const link = await page.getByTestId("issued-link").inputValue();
  expect(link).toMatch(/\/reset-password\/[A-Za-z0-9_-]{43}$/);

  const ctx = await browser.newContext();
  const p2 = await ctx.newPage();
  await p2.goto(link);
  await p2.fill("#pw", "NewUser123!");
  await p2.fill("#pw2", "NewUser123!");
  await p2.getByRole("button", { name: /บันทึกรหัสผ่าน/ }).click();
  await expect(p2.getByText(/ตั้งรหัสผ่านเรียบร้อย/)).toBeVisible();
  await loginAs(p2, email, "NewUser123!");
  await p2.waitForURL("**/dashboard");
  await expect(p2.getByRole("link", { name: "ผู้ใช้" })).toBeVisible();
  await expect(p2.getByRole("link", { name: "บทบาท" })).toHaveCount(0);
  await expect(p2.getByRole("link", { name: "ตั้งค่าองค์กร" })).toHaveCount(0);
  await ctx.close();
});

test("เพิ่มบทบาท ADMIN ให้ viewer แล้วเมนูบทบาทโผล่ (revalidate)", async ({ page, browser }) => {
  await page.goto("/users");
  await page.fill('input[type="search"]', "viewer@app.local");
  const row = page.getByRole("row", { name: /viewer@app.local/ });
  await row.getByRole("button", { name: /เมนูของ/ }).click();
  await page.getByRole("menuitem", { name: /แก้ไข/ }).click();
  await page.getByLabel("ผู้ดูแลระบบ", { exact: true }).check();
  await page.getByRole("button", { name: /บันทึก/ }).click();
  await expect(page.getByText(/บันทึกแล้ว/)).toBeVisible();

  const ctx = await browser.newContext();
  const p2 = await ctx.newPage();
  await loginAs(p2, "viewer@app.local");
  await p2.waitForURL("**/dashboard");
  await expect(p2.getByRole("link", { name: "บทบาท" })).toBeVisible(); // login ใหม่โหลด snapshot ทันที
  await ctx.close();
  // คืนค่า
  await page.goto("/users");
  await page.fill('input[type="search"]', "viewer@app.local");
  await page.getByRole("row", { name: /viewer@app.local/ }).getByRole("button", { name: /เมนูของ/ }).click();
  await page.getByRole("menuitem", { name: /แก้ไข/ }).click();
  await page.getByLabel("ผู้ดูแลระบบ", { exact: true }).uncheck();
  await page.getByRole("button", { name: /บันทึก/ }).click();
});

test("เปลี่ยนอีเมลแล้วยืนยันผ่านลิงก์", async ({ page, browser }) => {
  const newEmail = `staff-${Date.now()}@app.local`;
  await page.goto("/users");
  await page.fill('input[type="search"]', "staff@app.local");
  await page.getByRole("row", { name: /staff@app.local/ }).getByRole("button", { name: /เมนูของ/ }).click();
  await page.getByRole("menuitem", { name: /เปลี่ยนอีเมล/ }).click();
  await page.fill("#new-email", newEmail);
  await page.getByRole("button", { name: /ยืนยัน/ }).click();
  const link = await page.getByTestId("issued-link").inputValue();
  const ctx = await browser.newContext();
  const p2 = await ctx.newPage();
  await p2.goto(link);
  // A9 — การ GET ลิงก์ต้องไม่กินโทเคน (ตัวสแกนลิงก์ของเมลองค์กรเปิด URL ก่อนผู้ใช้เสมอ)
  // จำลองการสแกนด้วยการโหลดหน้าซ้ำอีกครั้งก่อนกดยืนยัน — ถ้าโทเคนถูกกินตอน render เคสนี้จะล้ม
  await p2.reload();
  await p2.getByRole("button", { name: /ยืนยัน/ }).click();
  await expect(p2.getByRole("status")).toContainText(/ยืนยันอีเมลใหม่เรียบร้อย/);
  await ctx.close();
  await page.goto("/users");
  await page.fill('input[type="search"]', newEmail);
  await expect(page.getByRole("row", { name: new RegExp(newEmail) })).toBeVisible();
});

test("ระงับผู้ใช้แล้วเข้าไม่ได้ และเปิดใช้งานกลับ", async ({ page, browser }) => {
  await page.goto("/users");
  await page.fill('input[type="search"]', "lockme@app.local");
  const row = page.getByRole("row", { name: /lockme@app.local/ });
  await row.getByRole("button", { name: /เมนูของ/ }).click();
  await page.getByRole("menuitem", { name: /ระงับบัญชี/ }).click();
  await page.getByRole("button", { name: /ยืนยัน/ }).click();
  await expect(page.getByText(/ระงับบัญชีแล้ว/)).toBeVisible();
  const ctx = await browser.newContext();
  const p2 = await ctx.newPage();
  await loginAs(p2, "lockme@app.local");
  await expect(p2.getByText(/อีเมลหรือรหัสผ่านไม่ถูกต้อง/)).toBeVisible();
  await ctx.close();
  await page.getByRole("row", { name: /lockme@app.local/ }).getByRole("button", { name: /เมนูของ/ }).click();
  await page.getByRole("menuitem", { name: /เปิดใช้งาน/ }).click();
  await expect(page.getByText(/เปิดใช้งานแล้ว/)).toBeVisible();
});

/**
 * B1.5 (รีวิวรอบสุดท้าย ข้อ 3) — คำขอ "แรก" หลังเซสชันถูกเพิกถอนต้องพาไปหน้า login ไม่ใช่หน้าแจ้ง
 * ข้อผิดพลาดภายในระบบ
 *
 * ด่าน edge (`proxy.ts`) อ่านคุกกี้ JWT โดยไม่แตะ DB จึงมองไม่เห็นการเพิกถอนและปล่อยผ่าน หน้าเพจจึงไป
 * ตายที่ `requireSession` ซึ่ง throw `unauthorized` แล้วตกลงตาข่าย `(admin)/error.tsx` ที่รู้จักแค่
 * `forbidden` กับ `internal` — ผู้ใช้ที่ถูกระงับ/ถูกถอนสิทธิ์ทุกคนจึงเห็น "เกิดข้อผิดพลาดภายในระบบ"
 * เป็นหน้าจอแรก แล้วค่อยถูกเด้งถูกต้องในคำขอที่สอง (ตอนนั้นคุกกี้ถูกเขียน invalid ไปแล้ว) — ต้องถูก
 * ตั้งแต่คำขอแรก
 */
test("เซสชันที่ถูกเพิกถอนแล้ว: คำขอแรกต้องไปหน้า login ไม่ใช่หน้าข้อผิดพลาด", async ({ browser, baseURL }) => {
  const ctx = await browser.newContext();
  await seedRevokedSession(ctx, baseURL!);
  const p2 = await ctx.newPage();
  await p2.goto("/dashboard");
  await p2.waitForURL(/\/login/);
  await expect(p2.locator("#email")).toBeVisible();
  await expect(p2.getByText(/เกิดข้อผิดพลาดภายในระบบ/)).toHaveCount(0);
  // เส้นทางเดิมถูกพากลับมาเป็น callbackUrl (ผ่าน safeCallbackUrl ตอน login สำเร็จ)
  expect(new URL(p2.url()).searchParams.get("callbackUrl")).toBe("/dashboard");
  await ctx.close();
});
