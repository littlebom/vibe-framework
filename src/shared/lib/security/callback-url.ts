/** ปลายทางเมื่อไม่มี callbackUrl ที่ใช้ได้ */
export const DEFAULT_CALLBACK_URL = "/dashboard";

/** origin สมมติสำหรับ resolve เส้นทางสัมพัทธ์ — ต้องเป็นชื่อที่ไม่มีวันเป็นปลายทางจริง (RFC 6761 `.invalid`) */
const SENTINEL_ORIGIN = "http://callback.invalid";

/**
 * header ที่ `proxy.ts` ประทับเส้นทางที่ผู้ใช้กำลังขอไว้ให้ฝั่ง server อ่าน (Next ไม่มี API บอก pathname
 * ตอน render Server Component) — ผู้อ่านต้องส่งค่าผ่าน `safeCallbackUrl` เสมอ ไม่ไว้ใจว่า proxy เป็น
 * คนตั้งจริงทุกครั้ง (คำขอที่ไม่เข้า matcher ไม่ถูกทับค่า header ที่ client ส่งมาเอง)
 */
export const CURRENT_PATH_HEADER = "x-ums-path";

/**
 * resolve เส้นทางสัมพัทธ์เทียบ sentinel origin แล้วคืนสตริงที่ประกอบใหม่ — `null` เมื่อหลุด origin
 *
 * คืนค่าที่ประกอบจาก `pathname + search + hash` (ไม่ใช่ `url.href`) เพราะสิ่งที่ผู้เรียกต้องการคือ
 * เส้นทางล้วน ๆ สำหรับ `router.push` — และเพราะสตริงชุดนี้เองคือสิ่งที่ต้องเอากลับมาตรวจซ้ำ
 */
function resolveSameOrigin(raw: string): string | null {
  if (!raw.startsWith("/")) return null;
  let url: URL;
  try {
    url = new URL(raw, SENTINEL_ORIGIN);
  } catch {
    return null;
  }
  if (url.origin !== SENTINEL_ORIGIN) return null;
  return `${url.pathname}${url.search}${url.hash}`;
}

/**
 * แปลง `?callbackUrl=` จาก URL ให้เป็นเส้นทางภายในเว็บเดียวกันที่ปลอดภัยจะ redirect ไป (CWE-601)
 *
 * เช็ค `startsWith("/")` อย่างเดียวไม่พอ: `//evil.com` และ `/\evil.com` ขึ้นต้นด้วย `/` ทั้งคู่ แต่เป็น
 * protocol-relative URL ที่พาผู้ใช้ออกนอกเว็บทันทีหลัง login สำเร็จ (เบราว์เซอร์แปลง `\` เป็น `/` ตาม
 * สเปก URL และตัดอักขระควบคุม เช่น tab/newline ทิ้งก่อนแปลผล)
 *
 * และการตรวจ "ขาเข้า" อย่างเดียวก็ยังไม่พอ: การตัด dot-segment (`.` `..` `%2e`) เกิดข้างใน URL parser
 * อินพุตที่ resolve แล้วอยู่ origin เดิมจริง ๆ จึงยังให้ `pathname` ที่ขึ้นต้นด้วยสองสแลชได้ เช่น
 * `/.//evil.com` → `//evil.com` — ผลลัพธ์ที่ปลอดภัยตอนตรวจ กลายเป็น payload ตอนคืนออกไป
 *
 * จึงตรวจ **ขาออก** เป็นจุดตัดสิน: ประกอบสตริงสุดท้ายแล้ว resolve ซ้ำอีกรอบ ผ่านก็ต่อเมื่อรอบสองยัง
 * อยู่ origin เดิมและได้สตริงเดิมเป๊ะ (fixpoint) — เป็นการตรวจ "สิ่งที่จะส่งให้ `router.push` จริง ๆ"
 * ไม่ใช่ "สิ่งที่ผู้ใช้พิมพ์มา" จึงครอบคลุมทุกรูปแบบที่ parser ยังพับกลับได้ ไม่ต้องไล่แปะทีละเคส
 */
export function safeCallbackUrl(raw: string | null | undefined): string {
  if (!raw) return DEFAULT_CALLBACK_URL;
  const resolved = resolveSameOrigin(raw);
  if (resolved === null) return DEFAULT_CALLBACK_URL;
  if (resolveSameOrigin(resolved) !== resolved) return DEFAULT_CALLBACK_URL;
  return resolved;
}
