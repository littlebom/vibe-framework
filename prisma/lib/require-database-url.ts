/**
 * ด่านบังคับสำหรับสคริปต์ standalone (`prisma/seed.ts`, `prisma/bootstrap.ts`, `scripts/e2e-reset.ts`)
 *
 * ถ้า `DATABASE_URL` ว่าง node-postgres จะ **ไม่** ล้ม แต่จะไหลไปใช้ค่าเริ่มต้นของ libpq เงียบ ๆ
 * (host=localhost, database=ชื่อผู้ใช้ระบบปฏิบัติการ หรือ `PGDATABASE` ถ้า export ไว้) — สคริปต์ที่ตั้งใจ
 * เขียนลง `ums_dev` จึงอาจไปเขียนฐานข้อมูลอื่นที่ไม่เกี่ยวข้องกันเลยโดยไม่มีใครรู้ (พิสูจน์ด้วยการซ่อน
 * `.env` แล้วรัน `scripts/e2e-reset.ts`: Prisma รายงาน `P1003 database_name: 'jira'` ซึ่งคือชื่อผู้ใช้
 * ของเครื่อง ไม่ใช่ `ums_dev`) ที่นี่จึงต้องล้มดัง ๆ แทนที่จะปล่อยให้ fallback เกิดขึ้นได้
 *
 * หมายเหตุ: ตัว generated Prisma client โหลด `.env` ให้เองเป็นผลข้างเคียงตอน import อยู่แล้ว แต่เป็น
 * พฤติกรรมโดยบังเอิญที่ขึ้นกับลำดับ import และไม่มีสัญญาว่าจะคงอยู่ — สคริปต์เหล่านี้จึง `import "dotenv/config"`
 * เป็นบรรทัดแรกเองอย่างชัดเจน (เหมือน `tests/integration/setup.ts`) แล้วผ่านด่านนี้อีกชั้น
 */
export function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "ไม่พบ DATABASE_URL — สคริปต์นี้อ่านจากไฟล์ .env ที่รากโปรเจกต์ (คัดลอกจาก .env.example แล้วแก้ค่า: cp .env.example .env)\n" +
        "ห้ามปล่อยให้ว่าง: node-postgres จะไหลไปใช้ค่าเริ่มต้นของ libpq แล้วเขียนลงฐานข้อมูลอื่นเงียบ ๆ",
    );
  }
  return url;
}
