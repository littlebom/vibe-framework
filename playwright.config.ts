import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3010";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: "list",
  use: { baseURL: BASE_URL, trace: "on-first-retry", screenshot: "only-on-failure" },
  projects: [
    { name: "setup", testMatch: /.*\.setup\.ts/ },
    { name: "admin", testIgnore: /(login|guest)\.spec\.ts/, use: { ...devices["Desktop Chrome"], storageState: "e2e/.auth/admin.json" }, dependencies: ["setup"] },
    { name: "guest", testMatch: /(login|guest)\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: { command: "npm run dev", url: BASE_URL, reuseExistingServer: true, timeout: 120_000 },
});
