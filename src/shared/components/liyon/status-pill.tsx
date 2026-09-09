import { cn } from "@/shared/lib/utils";

export type StatusPillTone = "ok" | "warn" | "bad" | "info" | "off";

export interface StatusPillProps {
  tone: StatusPillTone;
  children: React.ReactNode;
  className?: string;
}

/**
 * ป้ายสถานะ `.st` ของ Liyon (liyon-shell.css) — primitive เล็ก ๆ ใช้ร่วมกันทุก
 * ตารางฝั่ง admin (ผู้ใช้ คอร์ส ลงทะเบียน ชำระเงิน ใบรับรอง ฯลฯ)
 */
export function StatusPill({ tone, children, className }: StatusPillProps) {
  return <span className={cn("st", tone, className)}>{children}</span>;
}
