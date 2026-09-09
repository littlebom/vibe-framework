import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";

const rootDir = path.resolve(__dirname, "..");
const envPath = path.join(rootDir, ".env");
const envExamplePath = path.join(rootDir, ".env.example");

console.log("\n🚀 กำลังเริ่มต้นตั้งค่า VibeCore Framework สำหรับนักเรียน...\n");

// 1. ตรวจสอบและสร้างไฟล์ .env
if (!fs.existsSync(envPath)) {
  console.log("📝 สร้างไฟล์ .env จาก .env.example...");
  let envContent = fs.readFileSync(envExamplePath, "utf-8");
  const randomSecret = crypto.randomBytes(32).toString("base64");
  envContent = envContent.replace("change-me-32-bytes-base64", randomSecret);
  fs.writeFileSync(envPath, envContent);
  console.log("✅ สร้าง .env พร้อมสุ่ม AUTH_SECRET เรียบร้อยแล้ว\n");
} else {
  console.log("ℹ️  พบไฟล์ .env อยู่แล้ว ข้ามขั้นตอนการสร้าง\n");
}

// 2. Prisma generate
console.log("📦 กำลังสร้าง Prisma Client...");
try {
  execSync("npx prisma generate", { cwd: rootDir, stdio: "inherit" });
  console.log("✅ สร้าง Prisma Client สำเร็จ\n");
} catch (error) {
  console.error("❌ ไม่สามารถสร้าง Prisma Client ได้:", error);
  process.exit(1);
}

// 3. Prisma migrate
console.log("🗄️  กำลังรัน Database Migrations...");
try {
  execSync("npx prisma migrate deploy", { cwd: rootDir, stdio: "inherit" });
  console.log("✅ Migration สำเร็จ\n");
} catch (error) {
  console.warn("⚠️  ไม่สามารถเชื่อมต่อฐานข้อมูลเพื่อ Migrate ได้ กรุณาตรวจสอบว่า Postgres รันอยู่และสร้างฐานข้อมูลแล้ว:");
  console.warn("   คำสั่งสร้างฐานข้อมูล: createdb -U postgres ums_dev\n");
}

// 4. Prisma seed
console.log("🌱 กำลัง Seed ข้อมูลผู้ใช้และบทบาทตั้งต้น...");
try {
  execSync("npm run db:seed", { cwd: rootDir, stdio: "inherit" });
  console.log("✅ Seed ข้อมูลสำเร็จ\n");
} catch (error) {
  console.warn("⚠️  ข้ามขั้นตอน Seed ข้อมูล (สามารถรัน npm run db:seed เองภายหลังเมื่อเตรียม DB เสร็จ)\n");
}

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("🎉 ตั้งค่าโปรเจกต์เสร็จสมบูรณ์ พร้อมเริ่ม Vibe Coding!");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("👉 เริ่มต้นรัน Dev Server:");
console.log("   npm run dev");
console.log("\n🌐 เปิดเบราว์เซอร์: http://localhost:3010");
console.log("🔑 บัญชีล็อกอินตั้งต้น:");
console.log("   Email:    admin@app.local");
console.log("   Password: Passw0rd!vibe");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
