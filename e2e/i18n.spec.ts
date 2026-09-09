import { test, expect } from "@playwright/test";
import { expectNoRawI18nKeys } from "./helpers";

test("สลับ TH → EN เปลี่ยนทั้งเมนูและหน้า แล้วจำภาษาข้าม reload", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "แดชบอร์ด" })).toBeVisible();
  await expectNoRawI18nKeys(page);
  await page.getByRole("button", { name: /Switch language to EN/ }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expectNoRawI18nKeys(page);
  await page.getByRole("button", { name: /Switch language to TH/ }).click();
  await expect(page.getByRole("heading", { name: "แดชบอร์ด" })).toBeVisible();
});
