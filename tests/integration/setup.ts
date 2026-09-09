import { config } from "dotenv";
import { beforeEach, afterAll } from "vitest";
config({ path: ".env" });
// process.env.NODE_ENV เป็น readonly ตามชนิดที่ Next.js ประกาศไว้ — ใช้ Object.assign แทนการเซ็ตตรง ๆ
Object.assign(process.env, { NODE_ENV: "test" });
if (!process.env.DATABASE_URL) throw new Error("ต้องมี DATABASE_URL ใน .env สำหรับ integration test (createdb ums_dev)");
if (!process.env.AUTH_SECRET) process.env.AUTH_SECRET = "integration-test-secret-32-bytes!!";
process.env.APP_URL ??= "http://localhost:3010";

const { prisma } = await import("@/shared/lib/infra/prisma");

/** ล้างทุกตารางก่อนแต่ละเทสต์ — แต่ละเทสต์ seed เองเท่าที่ต้องใช้ */
export async function resetDb() {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "audit_logs","login_throttles","auth_tokens","role_permissions","user_roles","roles","user_tenants","users","permissions","tenants" RESTART IDENTITY CASCADE',
  );
}

beforeEach(async () => { await resetDb(); });
afterAll(async () => { await prisma.$disconnect(); });
