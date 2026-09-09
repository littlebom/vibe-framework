import { test as setup, expect } from "@playwright/test";
import path from "node:path";
import { loginAs, ADMIN } from "./helpers";

setup("authenticate as super admin", async ({ page }) => {
  await loginAs(page, ADMIN.email, ADMIN.password);
  await page.waitForURL("**/dashboard", { timeout: 20_000 });
  await expect(page).toHaveURL(/\/dashboard/);
  await page.context().storageState({ path: path.join(__dirname, ".auth", "admin.json") });
});
