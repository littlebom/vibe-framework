import { cn } from "@/shared/lib/utils";

/**
 * การ์ด `.det-pane` แบบเดี่ยว (ไม่ผูกกับแท็บ/รางเหมือน DetailPane ใน detail-rail.tsx)
 * primitive ตัวที่เก้าของ shared/components/liyon — ใช้กับหน้าที่มีการ์ดตั้งค่าเรียง
 * ต่อกันเป็นชุด (`.set-cards`) เช่นหน้าตั้งค่าองค์กร หรือขั้นตอนเดี่ยวของตัวช่วยสร้าง
 * (`.wiz` pane) — ทั้งสองที่ mockup ใช้คลาส `.det-pane` เดียวกันแต่ไม่มีความหมาย
 * role="tabpanel" แบบ DetailPane เพราะไม่มีแท็บมาคู่กัน
 */
export interface LiyonCardProps {
  children: React.ReactNode;
  className?: string;
}

export function LiyonCard({ children, className }: LiyonCardProps) {
  return <section className={cn("det-pane", className)}>{children}</section>;
}
