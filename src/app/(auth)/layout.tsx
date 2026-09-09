"use client";
import { usePathname } from "next/navigation";
import { BrandPanel } from "./_components/brand-panel";

/** /login = สองคอลัมน์มีแผ่นแบรนด์ (`.auth-split`) · หน้าอื่น = การ์ดเดี่ยวกลางจอ (`.auth-solo`) ตาม liyon-auth.css */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const isLogin = usePathname() === "/login";
  if (isLogin) {
    return (
      <div className="auth auth-split">
        <BrandPanel />
        <main className="auth-main">{children}</main>
      </div>
    );
  }
  return <div className="auth auth-solo">{children}</div>;
}
