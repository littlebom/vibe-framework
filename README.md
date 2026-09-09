# VibeCore Framework — Enterprise Full-stack Starter Kit สำหรับ Vibe Coding

โปรเจกต์เว็บแอปพลิเคชันระดับองค์กรสร้างด้วย **Next.js 16 + Prisma/PostgreSQL + Tailwind 4** รองรับสองภาษา (ไทย/อังกฤษ) บนดีไซน์ระบบ **Liyon**

พร้อมใช้งานระบบพื้นฐาน (Identity & Access Management, Authentication, RBAC, i18n, Theme System) และมีโมดูลตัวอย่าง (`features/sample`) พร้อมให้นักเรียนนำไปใช้เป็น **Framework / Starter Kit** ในการเขียนโค้ดร่วมกับ AI (Vibe Coding) เพื่อสร้างฟีเจอร์ใหม่ ๆ ได้อย่างรวดเร็วและได้มาตรฐานสากล

---

## ⚡️ เริ่มต้นใช้งานแบบขั้นตอนเดียว (Quick Start)

1. **เลือก Node 22 และติดตั้ง dependencies:**
   ```bash
   nvm use
   npm install
   ```

2. **สั่งตั้งค่าอัตโนมัติ (สร้าง .env + migrate + seed):**
   ```bash
   npm run setup
   ```

3. **เริ่ม Dev Server:**
   ```bash
   npm run dev
   ```
   เปิดเบราว์เซอร์ไปที่: **http://localhost:3010**
   - บัญชี Admin ตั้งต้น: `admin@app.local`
   - รหัสผ่าน: `Passw0rd!vibe`

> [!TIP]
> ดูตัวอย่างประโยคคำสั่ง Prompt สำเร็จรูปสำหรับสั่ง AI เขียนฟีเจอร์ใหม่ได้ที่ [PROMPTS.md](file:///Users/jira/Documents/ViebCode/U-AI-MS/PROMPTS.md)

---

## ฟีเจอร์ที่มีพร้อมใช้งานใน Framework

- 🔐 **ระบบ Authentication & Security:**
  - Login ด้วย Email/Password, Forgot Password, Reset Password ด้วย Single-use Token (SHA-256)
  - บังคับเปลี่ยนรหัสผ่านในครั้งแรก (`mustChangePassword`), ระบบยืนยันอีเมล
  - ป้องกัน Brute-force Login (`LoginThrottle`), ระบบเพิกถอนเซสชันอัตโนมัติเมื่อถูกระงับสิทธิ์
  - บันทึกประวัติการใช้งานลง `audit_logs`
- 👥 **ระบบจัดการผู้ใช้และบทบาท (Users & RBAC):**
  - หน้าจัดการผู้ใช้ (`/users`): สร้าง, แก้ไข, ระงับการใช้งาน, รีเซ็ตรหัสผ่าน
  - หน้าจัดการบทบาทและสิทธิ์ (`/users/roles`): สร้างบทบาท, กำหนดชุดสิทธิ์ (Permissions), รองรับขอบเขตสิทธิ์ (Scopes)
  - หน้าโปรไฟล์ผู้ใช้ (`/me`) และเปลี่ยนรหัสผ่าน (`/change-password`)
- 📦 **โมดูลตัวอย่าง (Sample CRUD Feature - `/sample`):**
  - หน้าจัดการข้อมูลตัวอย่าง มีตารางค้นหา, Dialog สร้าง/แก้ไข, การลบข้อมูล และการแสดงสถานะ Badge
  - เขียนตามสถาปัตยกรรม Modular Monolith ครบวงจร ให้นักเรียนดูเป็นต้นแบบ
- 🌐 **ระบบสองภาษา (i18n):**
  - สลับภาษา TH/EN ผ่าน Cookie ทันที ปุ่มสลับภาษาบน Navbar
  - จัดรูปแบบวันที่ พ.ศ./ค.ศ. อัตโนมัติ, ข้อความ UI และ Zod Validation แปลสองภาษาครบถ้วน
- 🎨 **Liyon Design System:**
  - Layout สไตล์ Admin Dashboard (Navbar, Sidebar, Breadcrumb) และ Auth Layout
  - เลือกลวดลายสีระบบ (Color Palette) ได้ 5 โทนในหน้า Settings

---

## คำสั่งสำคัญในโปรเจกต์

- `npm run dev` — รันแอปในโหมดพัฒนาที่พอร์ต 3010
- `npm run check` — ตรวจสอบ type-check (ทั้งแอปและเทสต์) + lint + ตรวจ dependency cruiser + unit/integration tests
  > [!NOTE]
  > การรัน integration test จะมีการ TRUNCATE ตารางเพื่อทดสอบ ดังนั้นหลังรันเสร็จ ให้สั่ง `npm run db:seed` ใหม่ก่อนใช้งานต่อ
- `npm run test` — รันเฉพาะ Unit tests ด้วย Vitest
- `npm run test:integration` — รัน Integration tests
- `npm run test:e2e` — รัน End-to-End tests ด้วย Playwright
- `npm run db:seed` — สร้างผู้ใช้ตัวอย่าง 5 บัญชีและบทบาทตั้งต้น
- `npm run sync:liyon` — ดึงไฟล์สไตล์ล่าสุดจาก Liyon Theme

---

## โครงสร้างสถาปัตยกรรม (Modular Monolith)

โปรเจกต์จัดโครงสร้างแบบแบ่งตามโดเมนธุรกิจ (Feature-driven):

```
src/
├── app/                      # Next.js App Router (เฉพาะ Routing & Layout)
│   ├── (admin)/              # หน้าหลังบ้านที่มี Sidebar/Navbar
│   ├── (auth)/               # หน้าล็อกอินและกู้คืนรหัสผ่าน
│   └── api/                  # API Route Handlers (เช่น NextAuth)
├── features/                 # โดเมนธุรกิจหลัก
│   ├── identity/             # ระบบผู้ใช้ บทบาท และสิทธิ์ (ตัวอย่าง Feature ที่สมบูรณ์)
│   │   ├── index.ts          # Public types & Client-safe helper
│   │   ├── server.ts         # Public server functions สำหรับ Feature อื่นเรียกใช้
│   │   ├── actions.ts        # Server Actions ที่ UI เรียกใช้
│   │   ├── messages.ts       # พจนานุกรมข้อความสองภาษา (TH/EN)
│   │   ├── permissions.ts    # ทะเบียนสิทธิ์ของ Feature นี้
│   │   └── _internal/        # โค้ดภายใน (ห้าม Feature อื่น import ตรง ๆ)
│   └── <your-feature>/       # โฟลเดอร์ฟีเจอร์ใหม่ที่นักเรียนสร้าง
├── shared/                   # โค้ด ส่วนประกอบ และ Utility ที่ใช้ร่วมกันทั้งหมด
│   ├── components/liyon/     # UI Components ของระบบดีไซน์ Liyon
│   └── lib/                  # ฟังก์ชันช่วยเหลือ เช่น i18n, formatting, date
├── i18n/                     # จุดรวมพจนานุกรมสองภาษาของทุก Feature
└── permissions.ts            # จุดรวม Permission Registry ทั้งหมดของระบบ
```

---

## คู่มือสำหรับนักเรียน: การสร้าง Feature ใหม่ด้วย Vibe Coding

เมื่อต้องการสร้างฟีเจอร์ใหม่ ให้แจ้ง AI Assistant (Claude Code, Cursor, Antigravity) โดยทำตามขั้นตอนสถาปัตยกรรมดังนี้:

### ขั้นตอนที่ 1: เพิ่ม Data Model ใน Prisma
1. เปิดไฟล์ `prisma/schema.prisma` และเพิ่ม Model ใหม่
2. **กติกา:** ทุกตารางธุรกิจต้องมีฟิลด์ `tenantId String @map("tenant_id") @db.Uuid`
3. รันคำสั่ง migration:
   ```bash
   npm run db:migrate:dev -- --name add_<feature_name>
   ```

### ขั้นตอนที่ 2: สร้าง Feature โฟลเดอร์ `src/features/<name>/`
สร้างไฟล์มาตรฐานของ Feature:
- `index.ts`: export เฉพาะ types และ helper ปลอดภัยสำหรับ Client
- `server.ts`: export ฟังก์ชันสำหรับ Server Components
- `actions.ts`: export Server Actions (รับ input ด้วย Zod และครอบด้วย `runAction`)
- `permissions.ts`: ประกาศสิทธิ์ที่เกี่ยวข้อง เช่น `<feature>:read`, `<feature>:create`
- `messages.ts`: ประกาศข้อความแปลสองภาษา `{ key: { th: "...", en: "..." } }`
- โฟลเดอร์ `_internal/`: วาง Business Logic และ Services

### ขั้นตอนที่ 3: เชื่อมต่อระบบกลาง
1. **ลงทะเบียนสิทธิ์:** นำสิทธิ์จาก `src/features/<name>/permissions.ts` ไปรวมใน `src/permissions.ts`
2. **ลงทะเบียนข้อความสองภาษา:** นำ `messages` ไปรวมใน `src/i18n/index.ts`
3. **ตรวจสอบความถูกต้อง:** รัน `npm test src/i18n/index.test.ts` เพื่อเช็กว่าคีย์ภาษาครบทั้ง TH/EN

### ขั้นตอนที่ 4: สร้างหน้า UI ใน `src/app/(admin)/<name>/`
1. วาง Page ใน `src/app/(admin)/<name>/page.tsx`
2. แสดงข้อความผ่าน `t("key")` เสมอ ห้าม hardcode ข้อความตรงๆ
3. ใช้งาน UI Components จาก `@/shared/components/liyon`
4. เรียกใช้ Server Actions ผ่าน hooks หรือ form action

### ขั้นตอนที่ 5: ตรวจสอบความถูกต้อง
รันคำสั่งตรวจสอบมาตรฐาน:
```bash
npm run check
```
หากผ่านทุกข้อ แสดงว่าฟีเจอร์ใหม่ปฏิบัติตามมาตรฐานสถาปัตยกรรมอย่างสมบูรณ์แบบ!
