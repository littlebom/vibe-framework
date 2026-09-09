"use client";

import { useEffect } from "react";
import { create } from "zustand";

/** หนึ่งขั้นของ breadcrumb — ไม่มี href = ขั้นสุดท้าย/กดไม่ได้ */
export interface Crumb {
  label: string;
  href?: string;
}

interface BreadcrumbTailState {
  tail: Crumb[];
  setTail: (tail: Crumb[]) => void;
}

/**
 * "ท้ายสาย" ของ breadcrumb ที่หน้าลึกกว่า sidebar ส่งขึ้นมาให้ navbar
 * (เช่น ชื่อคอร์ส › แท็บ) — layout ต่อท้ายสายที่ได้จาก sidebar แล้วส่งให้ AdminShell
 * store เดียวทั้งแอป ไม่ persist: เปลี่ยนหน้าแล้วหน้าใหม่เป็นคนตั้งค่าใหม่/ล้างเอง
 */
export const useBreadcrumbTailStore = create<BreadcrumbTailState>()((set) => ({
  tail: [],
  setTail: (tail) => set({ tail }),
}));

/**
 * ให้หน้า/คอมโพเนนต์ประกาศท้ายสายของตัวเอง — ตั้งตอน mount/เปลี่ยนค่า และล้างตอน unmount
 * ส่ง null เมื่อยังไม่พร้อม (เช่นชื่อคอร์สยังโหลดไม่เสร็จ) จะไม่แตะ store
 */
export function useBreadcrumbTail(items: Crumb[] | null): void {
  const setTail = useBreadcrumbTailStore((s) => s.setTail);
  const key = items ? JSON.stringify(items) : null;
  useEffect(() => {
    if (key === null) return;
    setTail(JSON.parse(key) as Crumb[]);
    return () => setTail([]);
  }, [key, setTail]);
}

/** ท้ายสายปัจจุบัน (สำหรับ layout) */
export function useBreadcrumbTailItems(): Crumb[] {
  return useBreadcrumbTailStore((s) => s.tail);
}
