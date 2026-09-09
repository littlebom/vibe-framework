import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers";

test("เปลี่ยน palette ใน settings แล้ว <html data-palette> เปลี่ยนทั้งระบบ", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.locator("html")).toHaveAttribute("data-palette", "blue");
  await page.getByRole("radio", { name: /เขียว/ }).click();
  await page.getByRole("button", { name: /^บันทึก$/ }).click();
  await expect(page.getByText(/บันทึกการตั้งค่าแล้ว/)).toBeVisible();
  await page.goto("/dashboard");
  await expect(page.locator("html")).toHaveAttribute("data-palette", "green");
  // คืนค่า
  await page.goto("/settings");
  await page.getByRole("radio", { name: /น้ำเงิน/ }).click();
  await page.getByRole("button", { name: /^บันทึก$/ }).click();
  await expect(page.getByText(/บันทึกการตั้งค่าแล้ว/)).toBeVisible();
});

test("แก้ชื่อที่แสดงใน /me แล้ว navbar เปลี่ยน", async ({ page }) => {
  await page.goto("/me");
  await page.fill("#me-name", "ผู้ดูแลสูงสุด (แก้)");
  await page.getByRole("button", { name: /^บันทึก$/ }).click();
  await expect(page.getByText(/บันทึกโปรไฟล์แล้ว/)).toBeVisible();
  await expect(page.locator(".acct .nm")).toContainText("(แก้)");
  await page.fill("#me-name", "ผู้ดูแลสูงสุด");
  await page.getByRole("button", { name: /^บันทึก$/ }).click();
});

// A4 — แถบเมนูซ่อนลิงก์ /settings ให้ VIEWER อยู่แล้ว แต่ bookmark เดิมหรือการพิมพ์ URL เองยังพามาถึงได้
// requirePermission จะ throw ตอน render ซึ่งก่อนมีไฟล์ (admin)/error.tsx จะกลายเป็นหน้า 500 เปล่า ๆ ของ Next
test("VIEWER เปิด /settings ตรง ๆ เห็นข้อความ 403 ไม่ใช่หน้า 500", async ({ browser }) => {
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await loginAs(p, "viewer@app.local");
  await p.waitForURL("**/dashboard");
  await p.goto("/settings");
  // getByRole("alert") เจอ #__next-route-announcer__ ด้วย — filter ด้วยข้อความจริงเหมือน login.spec.ts
  await expect(p.getByRole("alert").filter({ hasText: /ไม่มีสิทธิ์ดำเนินการ/ })).toBeVisible();
  await expect(p.getByText(/เกิดข้อผิดพลาดภายในระบบ/)).toHaveCount(0);
  await ctx.close();
});
