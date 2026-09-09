# Vibe Coding Prompt Cheat-sheet สำหรับนักเรียน 🚀

เอกสารนี้รวบรวมตัวอย่างประโยคคำสั่ง (Prompts) สำเร็จรูป ให้นักเรียนสามารถคัดลอก (Copy & Paste) ไปสั่ง AI Assistant (เช่น Claude Code, Cursor, Windsurf, Antigravity, ChatGPT) เพื่อพัฒนาฟีเจอร์ใหม่บน **VibeCore Framework** ได้ทันที

---

## 💡 คำแนะนำทั่วไปในการสั่ง AI (Vibe Coding Best Practices)
- ให้ระบุชื่อโฟลเดอร์และอ้างอิงถึง `features/sample` และ `AGENTS.md` เสมอ เพื่อให้ AI ยึดตามสถาปัตยกรรมที่ถูกต้อง
- สั่งทีละขั้นตอน (Step-by-step): Data Model → Backend Service → Server Action → UI

---

## 1. คำสั่งสร้าง Feature ใหม่ทั้งชุด (Full Feature Generation)

คัดลอก Prompt ด้านล่างแล้วเปลี่ยนคำใน `[ ... ]` ให้เป็นโจทย์ของตนเอง:

```markdown
ฉันต้องการพัฒนาเว็บไซต์คณะที่เป็น Portal และ ​Admin โดยเริ่มจาก framwork ของฉันบน github "https://github.com/littlebom/vibe-framework.git"
```

---

## 2. คำสั่งเพิ่มฟิลด์ใน Model และอัปเดตหน้าจอ (Add Field & Form Update)

```markdown
ในฟีเจอร์ "[ชื่อฟีเจอร์]" ฉันต้องการเพิ่มฟิลด์ใหม่:
- ชื่อฟิลด์: [เช่น dueDate, category, remarks]
- ชนิดข้อมูล: [เช่น String, DateTime, Enum]
- คำอธิบาย: [เช่น วันที่ครบกำหนด, หมวดหมู่]

ช่วยดำเนินการ:
1. เพิ่มคอลัมน์ใน `prisma/schema.prisma`
2. อัปเดต Zod schema ใน `_internal/validations.ts`
3. อัปเดตฟังก์ชันใน `_internal/services.ts` และ actions
4. เพิ่มคำแปลภาษา TH/EN ใน `messages.ts`
5. เพิ่ม input field ในฟอร์ม dialog และคอลัมน์ใน DataTable
```

---

## 3. คำสั่งสร้างระบบค้นหาและตัวกรอง (Search & Filter)

```markdown
ในหน้ารายการของฟีเจอร์ "[ชื่อฟีเจอร์]" ช่วยเพิ่มระบบ Search และ Filter ดังนี้:
1. ช่องค้นหา (Search input) ค้นหาจาก [title / name / code]
2. ตัวกรองสถานะ (Status filter) เลือก [Active / Inactive / All]
3. อัปเดต service และ server action ให้รองรับ parameter การค้นหา
4. จัดการ debounce เมื่อผู้ใช้พิมพ์ค้นหาใน Client Component
```

---

## 4. คำสั่งเขียน Unit Tests สำหรับฟีเจอร์ใหม่

```markdown
ช่วยเขียน Unit Tests ด้วย Vitest สำหรับฟีเจอร์ "[ชื่อฟีเจอร์]" ในไฟล์:
`src/features/[ชื่อฟีเจอร์]/_internal/validations.test.ts`
ทดสอบ:
1. ตรวจสอบว่าข้อมูลที่ถูกต้องผ่าน schema validation
2. ตรวจสอบว่าข้อมูลที่ผิดรูปแบบ (เช่น ฟิลด์บังคับว่าง, สตริงยาวเกิน) จะล้มเหลวตามที่คาดหวัง
และรันคำสั่ง `npm run test` เพื่อตรวจสอบว่าผ่านทั้งหมด
```

---

## 5. คำสั่งตรวจสอบคุณภาพและข้อผิดพลาด (Check & Debug)

```markdown
ช่วยรันการตรวจสอบระบบด้วยคำสั่ง:
`npm run check`
หากพบข้อผิดพลาดเกี่ยวกับ TypeScript, ESLint, หรือ dependency-cruiser ช่วยวิเคราะห์และแก้ไขให้ถูกต้องตามกฎใน AGENTS.md
```
