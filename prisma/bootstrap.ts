import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { seedCore, seedUser } from "./lib/seed-core";
import { requireDatabaseUrl } from "./lib/require-database-url";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: requireDatabaseUrl() }) });

async function main() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!email || !password || password.length < 12) {
    console.error("[bootstrap] ต้องตั้ง BOOTSTRAP_ADMIN_EMAIL และ BOOTSTRAP_ADMIN_PASSWORD (≥12 ตัวอักษร)");
    process.exit(1);
  }
  const core = await seedCore(prisma, {
    tenantCode: process.env.BOOTSTRAP_TENANT_CODE ?? "DEFAULT",
    nameTh: process.env.BOOTSTRAP_TENANT_NAME_TH ?? "องค์กรหลัก",
    nameEn: process.env.BOOTSTRAP_TENANT_NAME_EN ?? "Main Organization",
  });
  await seedUser(prisma, core.tenantId, { email, name: "Super admin", passwordHash: await bcrypt.hash(password, 12), roleIds: [core.roleIds.SUPER_ADMIN], mustChangePassword: true });
  console.log(`[bootstrap] สร้าง SUPER_ADMIN ${email} แล้ว (ต้องเปลี่ยนรหัสครั้งแรก)`);
}

main().finally(() => prisma.$disconnect());
