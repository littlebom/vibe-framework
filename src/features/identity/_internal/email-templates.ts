import type { Locale } from "@/shared/lib/i18n/config";

export interface LinkMailParams { name: string; link: string; hours: number }
export interface MailContent { subject: string; text: string; html: string }

function wrap(title: string, body: string, link: string, cta: string, foot: string): MailContent["html"] {
  return `<div style="font-family:Sarabun,Inter,sans-serif;max-width:560px;margin:0 auto;padding:24px">
<h2 style="margin:0 0 12px">${title}</h2><p>${body}</p>
<p><a href="${link}" style="display:inline-block;padding:10px 18px;background:#0556CA;color:#fff;border-radius:6px;text-decoration:none">${cta}</a></p>
<p style="color:#666;font-size:13px">${foot}<br>${link}</p></div>`;
}

const T = {
  th: {
    setupSubject: "ตั้งรหัสผ่านสำหรับบัญชีของคุณ",
    setupBody: (n: string) => `สวัสดี ${n} ผู้ดูแลระบบได้สร้างบัญชีผู้ใช้ให้คุณแล้ว กรุณากดลิงก์เพื่อตั้งรหัสผ่าน`,
    resetSubject: "ตั้งรหัสผ่านใหม่",
    resetBody: (n: string) => `สวัสดี ${n} มีคำขอตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ ถ้าไม่ใช่คุณให้ละเว้นอีเมลนี้`,
    changeSubject: "ยืนยันการเปลี่ยนอีเมลใหม่",
    changeBody: (n: string) => `สวัสดี ${n} กรุณายืนยันว่าต้องการใช้อีเมลนี้เข้าสู่ระบบ`,
    cta: "เปิดลิงก์",
    foot: (h: number) => `ลิงก์หมดอายุใน ${h} ชั่วโมง ถ้าปุ่มกดไม่ได้ให้คัดลอกลิงก์นี้ไปวางในเบราว์เซอร์`,
  },
  en: {
    setupSubject: "Set the password for your account",
    setupBody: (n: string) => `Hi ${n}, an administrator created an account for you. Use the link to set your password.`,
    resetSubject: "Reset your password",
    resetBody: (n: string) => `Hi ${n}, a password reset was requested for your account. Ignore this email if it wasn't you.`,
    changeSubject: "Confirm your new email",
    changeBody: (n: string) => `Hi ${n}, please confirm you want to use this address to sign in.`,
    cta: "Open link",
    foot: (h: number) => `This link expires in ${h} hours. If the button doesn't work, paste the link into your browser.`,
  },
} as const;

function build(locale: Locale, subject: string, body: string, p: LinkMailParams): MailContent {
  const t = T[locale];
  const foot = t.foot(p.hours);
  return { subject, text: `${body}\n\n${p.link}\n\n${foot}`, html: wrap(subject, body, p.link, t.cta, foot) };
}

export const passwordSetupEmail = (l: Locale, p: LinkMailParams) => build(l, T[l].setupSubject, T[l].setupBody(p.name), p);
export const passwordResetEmail = (l: Locale, p: LinkMailParams) => build(l, T[l].resetSubject, T[l].resetBody(p.name), p);
export const emailChangeEmail = (l: Locale, p: LinkMailParams) => build(l, T[l].changeSubject, T[l].changeBody(p.name), p);
