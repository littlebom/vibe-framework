import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(16),
  APP_URL: z.url().default("http://localhost:3010"),
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  SMTP_FROM: z.string().optional().default("App <no-reply@localhost>"),
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),
  MICROSOFT_CLIENT_ID: z.string().optional().default(""),
  MICROSOFT_CLIENT_SECRET: z.string().optional().default(""),
  MICROSOFT_TENANT_ID: z.string().optional().default("common"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

/** อ่านครั้งแรกตอนเรียก ไม่ใช่ตอน import — เทสต์ที่ไม่ใช้ env จึงไม่ล้ม */
export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`ตั้งค่า env ไม่ครบ/ไม่ถูกต้อง: ${missing} (ดู .env.example)`);
  }
  cached = parsed.data;
  return cached;
}

export const smtpConfigured = () => env().SMTP_HOST !== "";
export const googleOAuthConfigured = () => env().GOOGLE_CLIENT_ID !== "" && env().GOOGLE_CLIENT_SECRET !== "";
export const microsoftOAuthConfigured = () => env().MICROSOFT_CLIENT_ID !== "" && env().MICROSOFT_CLIENT_SECRET !== "";
