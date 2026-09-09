import { test, expect } from "@playwright/test";

test("สร้าง แก้ และลบบทบาทที่ไม่มีผู้ถือ · บทบาทระบบล็อก", async ({ page }) => {
  const code = `E2E_${Date.now().toString(36).toUpperCase()}`;
  await page.goto("/users/roles");
  await page.getByRole("button", { name: /สร้างบทบาท/ }).click();
  await page.fill("#role-code", code.toLowerCase());
  await page.fill("#role-name-th", "บทบาททดสอบ");
  await page.fill("#role-name-en", "E2E role");
  await page.getByLabel(/ดูรายชื่อผู้ใช้/).check();
  await page.getByRole("button", { name: /^บันทึก$/ }).click();
  await expect(page.getByText(/บันทึกบทบาทแล้ว/)).toBeVisible();
  const row = page.getByRole("row", { name: new RegExp(code) });
  await expect(row).toBeVisible();
  // ต้องเจาะจงเซลล์ "สิทธิ์" (คอลัมน์ที่ 4: รหัส · ชื่อ · ผู้ถือ · สิทธิ์) — toContainText กับทั้งแถวผ่านได้
  // ด้วยเลขที่อยู่ในรหัสบทบาทที่สุ่มมา (E2E_<base36> มีเลข 1 อยู่ราว 20% ของครั้ง) คือผ่านทั้งที่นับผิด
  await expect(row.getByRole("cell").nth(3)).toHaveText("1"); // 1 สิทธิ์
  await row.getByRole("button", { name: /เมนูของ/ }).click();
  await page.getByRole("menuitem", { name: /แก้ไข/ }).click();
  await page.getByLabel(/ดูประวัติการใช้งาน/).check();
  await page.getByRole("button", { name: /^บันทึก$/ }).click();
  await expect(page.getByRole("row", { name: new RegExp(code) }).getByRole("cell").nth(3)).toHaveText("2");
  await page.getByRole("row", { name: new RegExp(code) }).getByRole("button", { name: /เมนูของ/ }).click();
  await page.getByRole("menuitem", { name: /ลบบทบาท/ }).click();
  await page.getByRole("button", { name: /ยืนยัน/ }).click();
  await expect(page.getByText(/ลบบทบาทแล้ว/)).toBeVisible();
  await expect(page.getByRole("row", { name: new RegExp(code) })).toHaveCount(0);

  await page.getByRole("row", { name: /SUPER_ADMIN/ }).getByRole("button", { name: /เมนูของ/ }).click();
  await expect(page.getByRole("menuitem", { name: /แก้ไข/ })).toBeDisabled();
});

test("ลบบทบาทที่มีผู้ถือไม่ได้", async ({ page }) => {
  await page.goto("/users/roles");
  await page.getByRole("row", { name: /VIEWER/ }).getByRole("button", { name: /เมนูของ/ }).click();
  await expect(page.getByRole("menuitem", { name: /ลบบทบาท/ })).toBeDisabled();
});
