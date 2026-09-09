# คู่มือการเรียนการสอนและรวมชุดคำสั่ง Prompt สำหรับวิชา Vibe Coding 🚀
**เป้าหมายของโปรเจกต์:** พัฒนาเว็บไซต์คณะที่เป็น Public Portal และ Admin Back-office  
**ระบบหลักที่ต้องพัฒนา (5 ฟีเจอร์):**
1. ระบบจัดการข่าวสารประชาสัมพันธ์
2. ระบบจัดการบุคลากร
3. ระบบจัดการหลักสูตร
4. ระบบบริหารจัดการและอนุมัติเอกสาร
5. ระบบจองห้องประชุมและยานพาหนะ

---

## ⚡️ Antigravity Superpowers (สำหรับผู้ใช้ Google Antigravity)

หากนักเรียนใช้งาน **Google Antigravity** เป็น AI Assistant จะมีฟีเจอร์ระดับสูง (Agentic Capabilities) ที่ช่วยให้การเขียนโค้ดทรงพลังและรวดเร็วกว่า AI Chat ทั่วไปอย่างมาก:

1. **Autonomous Execution (รัน Terminal และแก้ไฟล์จริงในเครื่อง):**
   - ไม่ต้องคอย Copy & Paste โค้ดเอง Antigravity สามารถแก้ไขไฟล์, สั่งรัน Migration, และรันคำสั่ง Terminal ได้อัตโนมัติ
2. **Slash Command `/grill-me` (ระบบสัมภาษณ์เจาะลึกความต้องการ):**
   - พิมพ์ `/grill-me` เพื่อให้ Antigravity สวมบทเป็น Senior Software Architect ซักถามความต้องการและท้าทายแนวคิดของนักเรียนทีละประเด็น ฝึกทักษะ System Thinking ได้ยอดเยี่ยม
3. **Slash Command `/boost` (เพิ่มพลังการคิดเชิงลึก):**
   - ใช้กับระบบที่มี Logic ซับซ้อน เช่น Conflict Detection ของระบบจอง หรือ State Machine ของการอนุมัติเอกสาร
4. **Self-Healing Loop (แก้บั๊กอัตโนมัติ):**
   - เมื่อสั่งตรวจสอบคุณภาพ Antigravity จะอ่าน Error Log จาก Terminal และแก้บั๊กจนกว่าคำสั่ง `npm run check` จะผ่านฉลุยทุกข้อโดยอัตโนมัติ

---

## 🧭 แผนผังกระบวนการพัฒนา (Vibe Coding Lifecycle)

```
[สเต็ป 1: Setup เครื่อง] 
       │
       ▼
[สเต็ป 2: Master Analysis Prompt] ────► วิเคราะห์ภาพรวม 5 ระบบ (Portal vs Admin)
       │
       ▼
[สเต็ป 3: Deep-Dive Feature Prompt] ──► เจาะลึกรายฟีเจอร์ (ใช้ /grill-me หรือ D-A-B-U)
       │
       ▼
[สเต็ป 4: Blueprint Generation] ─────► สั่ง AI สร้าง 6 ไฟล์พิมพ์เขียวใน docs/
       │
       ▼
[สเต็ป 5: Step-by-Step Execution] ───► สั่ง Agentic Execution ตาม implementation-plan.md
       │
       ▼
[สเต็ป 6: Quality Gate & Self-Heal] ──► ตรวจสอบมาตรฐานและแก้บั๊กอัตโนมัติด้วย npm run check
```

---

## 📌 สเต็ปที่ 1: ขั้นตอนการเตรียมเครื่องในคาบแรก (Student Setup Steps)

ให้นักเรียนเปิด Terminal (PowerShell หรือ Bash) และทำตาม 4 ขั้นตอนนี้:

### 1.1 โคลนโปรเจกต์และเข้าสู่โฟลเดอร์
```bash
git clone https://github.com/littlebom/vibe-framework.git faculty-app
cd faculty-app
```

### 1.2 ติดตั้ง Dependencies
```bash
npm install
```
*(กรณีใช้ Windows PowerShell แล้วพบ Error สีแดงเรื่อง Script Execution Policy ให้พิมพ์ `npm.cmd install` หรือสั่ง `Set-ExecutionPolicy -Scope Process Bypass`)*

### 1.3 ตั้งค่าระบบอัตโนมัติ (สร้าง .env + เปิด Docker Postgres + Migrate + Seed ข้อมูล)
```bash
npm run setup
```

### 1.4 รันระบบเพื่อทดสอบ
```bash
npm run dev
```
- เปิดเบราว์เซอร์ไปที่: **http://localhost:3010**
- บัญชี Admin ตั้งต้น: `admin@app.local`
- รหัสผ่าน: `Passw0rd!vibe`
- นักเรียนควรเข้าไปสำรวจตัวอย่างฟีเจอร์ต้นแบบที่เมนู `/sample` เพื่อดูมาตรฐานของโค้ด

---

## 📌 สเต็ปที่ 2: วิเคราะห์ภาพรวมโปรเจกต์ (Master Analysis Prompt)

> **วิธีใช้งาน:** ให้นักเรียนเปิด Antigravity และคัดลอกข้อความด้านล่างไปสั่งในครั้งแรก

```markdown
คุณคือ Senior Software Architect และอาจารย์ที่ปรึกษาการพัฒนาซอฟต์แวร์
ขณะนี้ฉันได้โคลนโปรเจกต์ `vibe-framework` ลงในเครื่องเรียบร้อยแล้ว 
โปรดอ่านไฟล์ `README.md`, `AGENTS.md` และศึกษาตัวอย่างโค้ดใน `src/features/sample/` เพื่อทำความเข้าใจสถาปัตยกรรม Modular Monolith ของระบบ

เป้าหมายของฉันคือ พัฒนา "เว็บไซต์คณะ (Faculty Web Platform)" ซึ่งประกอบด้วย 2 ส่วนหลัก:
1. Public Portal (หน้าบ้านสำหรับบุคคลภายนอกและนักศึกษา)
2. Admin Console (หลังบ้านสำหรับเจ้าหน้าที่และอาจารย์)

โดยมี 5 ฟีเจอร์หลักที่ต้องพัฒนา ได้แก่:
1. ระบบจัดการข่าวสารประชาสัมพันธ์
2. ระบบจัดการบุคลากร
3. ระบบจัดการหลักสูตร
4. ระบบบริหารจัดการและอนุมัติเอกสาร
5. ระบบจองห้องประชุมและยานพาหนะ

โปรดช่วยฉันวิเคราะห์และแจกแจงคุณสมบัติ (Specification) ของทั้ง 5 ฟีเจอร์ สรุปออกมาเป็นตารางตามกรอบ D-A-B-U ดังนี้:
- [Data] ตารางข้อมูลหลักและฟิลด์สำคัญที่ต้องจัดเก็บ
- [Access & Roles] สิทธิ์การใช้งาน ใครทำอะไรได้บ้าง (Guest, บุคลากร, ผู้ดูแลระบบ, ผู้อนุมัติ)
- [Business Rules] กฎเกณฑ์และเงื่อนไขทางธุรกิจที่ระบบต้องตรวจสอบ
- [UI/UX] หน้าจอฝั่ง Portal (หน้าบ้าน) ต้องเห็นอะไร และฝั่ง Admin (หลังบ้าน) ต้องมีปุ่ม/ฟอร์มอะไรบ้าง

ขอผลลัพธ์เป็นภาษาไทยที่กระชับ ชัดเจน พร้อมนำไปเป็นพิมพ์เขียวในการวางสถาปัตยกรรมต่อไป
```

---

## 📌 สเต็ปที่ 3: วิเคราะห์เจาะลึกรายฟีเจอร์ (Deep-Dive Feature Prompt)

นักเรียนสามารถเลือกใช้ 1 ใน 2 วิธีนี้:

### ทางเลือก ก: ใช้ Slash Command `/grill-me` (แนะนำสำหรับ Antigravity 🌟)
พิมพ์คำสั่งนี้ใน Antigravity เพื่อให้อัลกอริทึมสัมภาษณ์นักเรียนกลับ:
```
/grill-me ฉันต้องการพัฒนา "ระบบ [ใส่ชื่อระบบ เช่น จองห้องประชุมและยานพาหนะ]" บน vibe-framework โปรดสัมภาษณ์ฉันทีละคำถาม เพื่อช่วยฉันตกผลึกความต้องการ กฎทางธุรกิจ และสิทธิ์การใช้งาน
```

### ทางเลือก ข: ใช้ Prompt แบบมาตรฐาน
```markdown
จากโครงสร้างของ vibe-framework ตอนนี้ฉันต้องการเริ่มวิเคราะห์และพัฒนา:
"ระบบ [ใส่ชื่อฟีเจอร์ เช่น บริหารจัดการและอนุมัติเอกสาร]"

โปรดวิเคราะห์ความต้องการเชิงลึกและออกแบบโครงสร้างฟีเจอร์ตามมาตรฐานใน AGENTS.md ดังนี้:

1. Data Attributes & Prisma Schema:
   - ตารางที่ต้องสร้าง และ Enum ที่ต้องใช้ (ต้องมี tenantId เสมอ)
   - ฟิลด์ข้อมูลทั้งหมด (ชื่อฟิลด์, ชนิดข้อมูล, ฟิลด์ที่บังคับ/ไม่บังคับ)
   - ความสัมพันธ์ (Relations) กับตาราง User หรือหน่วยงานอื่น

2. Lifecycle & Business Rules (วงจรและสถานะ):
   - สถานะของข้อมูล (State/Status) มีอะไรบ้าง และเปลี่ยนสถานะอย่างไร?
   - กฎการตรวจสอบ (Validation) เช่น เงื่อนไขก่อนอนุมัติ, เงื่อนไขการแนบไฟล์

3. Permissions (RBAC):
   - กำหนดชุดสิทธิ์ Permission Code (เช่น [feature]:read, [feature]:approve) สำหรับลงทะเบียนใน src/permissions.ts

4. Dual-view Requirements (หน้าบ้าน vs หลังบ้าน):
   - ฝั่ง Portal (สาธารณะ): ผู้ใช้ทั่วไปเห็นอะไร ค้นหา/ดาวน์โหลดอย่างไร
   - ฝั่ง Admin (เจ้าหน้าที่): ตารางแสดงผล, ตัวกรอง, ฟอร์มบันทึกข้อมูล, ปุ่มกดอนุมัติ/ตีกลับ

5. Step-by-Step Implementation Checklist:
   - สรุปลำดับไฟล์ที่จะต้องสร้างใน `src/features/[ชื่อฟีเจอร์ภาษาอังกฤษ]/` ตามแพทเทิร์น Modular Monolith
```

---

## 📌 สเต็ปที่ 4: สั่งสร้าง 6 ไฟล์พิมพ์เขียว (Blueprint Generation Prompt)

> **วิธีใช้งาน:** สั่งต่อเนื่องทันทีหลังจากที่คุยผลวิเคราะห์จากสเต็ปที่ 3 เสร็จแล้ว เพื่อให้ Antigravity สร้างไฟล์เอกสารพิมพ์เขียวลงในโฟลเดอร์ `docs/` โดยอัตโนมัติ

```markdown
จากผลการวิเคราะห์ของ "ระบบ [ใส่ชื่อฟีเจอร์ เช่น บริหารจัดการและอนุมัติเอกสาร]" ที่เราสรุปกันข้างต้น

โปรดสร้างชุดเอกสารพิมพ์เขียวสำหรับการพัฒนาจริง (Engineering Blueprints) จำนวน 6 ไฟล์ 
บันทึกไว้ในโฟลเดอร์ `docs/features/[ชื่อฟีเจอร์ภาษาอังกฤษ เช่น documents]/` ดังต่อไปนี้:

1. `prd.md` (Product Requirements Document)
   - วัตถุประสงค์ของระบบ (Objective)
   - กลุ่มผู้ใช้งาน (User Personas & Roles)
   - Functional Requirements และ Use Cases รายละเอียด
   - Acceptance Criteria (เกณฑ์การตรวจรับงานที่ต้องผ่าน)

2. `agent.md` (AI Coding Instructions & Rules)
   - กฎเหล็กและข้อห้ามสำหรับ AI เมื่อเขียนฟีเจอร์นี้ (สอดคล้องกับ AGENTS.md)
   - ห้ามแก้ไขไฟล์นอกขอบเขตโมดูล
   - การใช้ Component จาก `@/shared/components/liyon`
   - การบังคับใช้ i18n (`t("key")`) และห้ามฮาร์ดโค้ดข้อความ

3. `architecture.md` (Technical Architecture & Flow)
   - โครงสร้างโฟลเดอร์ของฟีเจอร์ตาม Modular Monolith (`index.ts`, `server.ts`, `actions.ts`, `_internal/`)
   - Route Mapping: หน้าบ้าน `src/app/(portal)/...` และหลังบ้าน `src/app/(admin)/...`
   - Data Flow Diagram หรือ State Machine แสดงการเปลี่ยนสถานะ
   - รายชื่อ Permissions ที่ต้องลงทะเบียนใน `src/permissions.ts`

4. `schema.md` (Data Model & Validations)
   - โค้ด Prisma Model และ Enums ที่พร้อมนำไปใส่ใน `prisma/schema.prisma` (มี tenantId เสมอ)
   - ข้อกำหนด Zod Validation Schemas (Input DTO สำหรับ Create / Update)
   - รายการคีย์คำแปลสองภาษา (TH/EN) ที่ต้องใส่ใน `messages.ts`

5. `implementation-plan.md` (Step-by-step Execution Plan)
   - แผนปฏิบัติการแบ่งเป็นขั้นตอนย่อย (Task-by-Task) พร้อม Checkbox `[ ]`
   - เรียงลำดับ: Migration → Validations → Services → Server Actions → Public API → Admin UI → Portal UI → Unit Tests

6. `progress.md` (Task Tracking & Quality Gates)
   - ตารางติดตามความคืบหน้ารายขั้นตอน
   - Checklist การตรวจสอบคุณภาพตามมาตรฐาน VibeCore (`npm run check`)

โปรดสร้างไฟล์ทั้ง 6 นี้ลงในระบบไฟล์จริงให้ครบถ้วนและสมบูรณ์ที่สุด
```

---

## 📌 สเต็ปที่ 5: สั่ง Antigravity เขียนโค้ดแบบ Agentic (Step-by-Step Execution)

> **จุดเด่นของ Antigravity:** สามารถสั่งให้ Agent ลงมือสร้าง/แก้ไฟล์ และรัน Terminal ให้เราได้โดยตรง ให้นักเรียนสั่งทีละ Step ตาม `implementation-plan.md`

### คำสั่งที่ 5.1: Database Model & Migration
```markdown
โปรดอ่าน `docs/features/[ชื่อฟีเจอร์]/implementation-plan.md` 
และเริ่มลงมือทำ **Step 1: Data Model & Migration**:
1. นำ Prisma model จาก `schema.md` ไปเพิ่มใน `prisma/schema.prisma`
2. รันคำสั่ง migration สำหรับฟีเจอร์นี้ผ่าน Terminal
3. อัปเดตเครื่องหมาย [x] ใน `progress.md`
```

### คำสั่งที่ 5.2: Business Logic & Services
```markdown
โปรดดำเนินการต่อใน **Step 2: Internal Services & Validations**:
1. สร้าง Zod schema ใน `src/features/[ชื่อฟีเจอร์]/_internal/validations.ts`
2. สร้าง Services ใน `src/features/[ชื่อฟีเจอร์]/_internal/services.ts`
โดยอ้างอิงโค้ดต้นแบบจาก `src/features/sample/_internal/`
เมื่อเสร็จแล้วให้อัปเดต [x] ใน `progress.md`
```

### คำสั่งที่ 5.3: Server Actions & สิทธิ์ระบบกลาง
```markdown
โปรดดำเนินการต่อใน **Step 3: Server Actions & Central Registration**:
1. สร้าง Server Actions ใน `src/features/[ชื่อฟีเจอร์]/_internal/actions.ts` โดยใช้ `runAction` และ `requirePermission`
2. Export Public API ใน `index.ts`, `server.ts`, `actions.ts`
3. ลงทะเบียนสิทธิ์ใน `src/permissions.ts`
4. ลงทะเบียนคำแปลสองภาษาใน `src/i18n/index.ts`
เมื่อเสร็จแล้วให้อัปเดต [x] ใน `progress.md`
```

### คำสั่งที่ 5.4: UI Development (Portal & Admin)
```markdown
โปรดดำเนินการต่อใน **Step 4: UI Development**:
1. สร้างหน้าหลังบ้านใน `src/app/(admin)/[ชื่อฟีเจอร์]/page.tsx` โดยใช้ Component จาก `@/shared/components/liyon` (DataTable, Dialog, Button)
2. สร้างหน้าบ้านใน `src/app/(portal)/[ชื่อฟีเจอร์]/page.tsx` สำหรับแสดงผลสู่สาธารณะ
3. ใช้ฟังก์ชัน `t("key")` สำหรับข้อความ UI ทั้งหมด ห้ามฮาร์ดโค้ด
เมื่อเสร็จแล้วให้อัปเดต [x] ใน `progress.md`
```

---

## 📌 สเต็ปที่ 6: ตรวจสอบคุณภาพและสั่ง Self-Healing (Quality Gate Prompt)

> **คำสั่งปิดท้ายสำหรับ Antigravity (One-Shot Quality Check & Self-Healing):**

สั่งคำสั่งนี้คำสั่งเดียว Antigravity จะรันตรวจทั้งระบบและแก้บั๊กเองจนกว่าจะผ่าน:

```markdown
โปรดช่วยตรวจสอบคุณภาพของฟีเจอร์นี้ตามมาตรฐาน VibeCore:
1. รันคำสั่ง `npm run check` (หรือ `npm.cmd run check`) ใน Terminal
2. หากพบข้อผิดพลาด (TypeScript, ESLint, dependency-cruiser หรือ i18n test) โปรดวิเคราะห์และแก้ไขไฟล์ที่เกี่ยวข้องให้ถูกต้องตามกฎใน `AGENTS.md`
3. รันซ้ำจนกว่าผลการทดสอบทั้งหมดจะผ่านเป็นสีเขียว 100%
4. เมื่อผ่านหมดแล้ว ให้อัปเดตสถานะสุดท้ายใน `docs/features/[ชื่อฟีเจอร์]/progress.md` และสรุปผลให้ฉัน
```

---

> [!TIP]
> **เกณฑ์การให้คะแนนสำหรับอาจารย์ผู้สอน (Evaluation Rubric):**
> 1. **Spec Quality (20%):** มีไฟล์เอกสารทั้ง 6 ไฟล์ใน `docs/features/[ฟีเจอร์]/` ครบถ้วนและชัดเจน
> 2. **Architecture Compliance (30%):** โค้ดอยู่ใน `src/features/` มีการแยก `_internal/` ถูกต้อง ไม่ทำผิดกฎ dependency-cruiser
> 3. **Functionality (30%):** หน้าบ้าน (Portal) และหลังบ้าน (Admin) ใช้งานได้จริง มีระบบสิทธิ์ถูกต้อง
> 4. **Zero-Error Gate (20%):** รันคำสั่ง `npm run check` ผ่านฉลุย 100% (สีเขียวทุกข้อ)
