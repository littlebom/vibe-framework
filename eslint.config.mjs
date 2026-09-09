import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import unusedImports from "eslint-plugin-unused-imports";

const internalPatterns = [
  {
    group: ["@/features/*/_internal", "@/features/*/_internal/*", "@/features/*/_internal/**"],
    message: "ห้าม import _internal ของ feature — ใช้ '@/features/<name>', '/server' หรือ '/actions'",
  },
];

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  // prisma/** และ scripts/** เคยถูก ignore ไว้ทั้งก้อน ทั้งที่เป็นโค้ดที่รันจริง (seed, bootstrap,
  // e2e-reset, sync-liyon-theme) — A8 เอาออกเพื่อให้เกต lint ครอบด้วย
  globalIgnores([".next/**", "out/**", "next-env.d.ts", "src/generated/**", "**/*.d.ts", "e2e/**", "playwright.config.ts", "tests/**"]),
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { "unused-imports": unusedImports },
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": ["warn", { vars: "all", varsIgnorePattern: "^_", args: "after-used", argsIgnorePattern: "^_", ignoreRestSiblings: true }],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/features/**"],
    rules: { "no-restricted-imports": ["error", { patterns: internalPatterns }] },
  },
  {
    files: ["src/features/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": ["error", { patterns: internalPatterns }] },
  },
  {
    files: ["src/**/*.ts"],
    ignores: ["src/**/*.test.ts", "src/shared/lib/infra/logger.ts"],
    rules: { "no-console": "warn" },
  },
]);
