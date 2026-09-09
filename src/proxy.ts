import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { CURRENT_PATH_HEADER } from "@/shared/lib/security/callback-url";

const PUBLIC_PREFIXES = ["/reset-password/", "/verify-email/", "/api/auth/", "/_next/", "/favicon.ico"];
const GUEST_ONLY = ["/login", "/forgot-password"];

/** ด่านตรวจระดับ route — ไม่แตะ DB (edge) · สิทธิ์ละเอียดตรวจใน Server Action ผ่าน requirePermission */
export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const secureCookie = (process.env.APP_URL ?? "").startsWith("https://");
  const token = await getToken({ req, secret: process.env.AUTH_SECRET, secureCookie });
  const loggedIn = !!token && !token.invalid && !!token.userId;

  if (GUEST_ONLY.includes(pathname)) {
    return loggedIn ? NextResponse.redirect(new URL("/dashboard", req.url)) : NextResponse.next();
  }
  if (pathname === "/") {
    return NextResponse.redirect(new URL(loggedIn ? "/dashboard" : "/login", req.url));
  }
  if (!loggedIn) {
    const login = new URL("/login", req.url);
    login.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(login);
  }
  if (token?.mustChangePassword && pathname !== "/change-password") {
    return NextResponse.redirect(new URL("/change-password", req.url));
  }
  // B1.5: ด่านนี้อยู่บน edge จึงมองไม่เห็นว่าเซสชันถูกเพิกถอนไปแล้ว (ต้องแตะ DB) คำขอแรกหลังถูกเพิกถอน
  // จึงผ่านมาถึงเพจเสมอ แล้วไปตายที่ requireSession — ส่งเส้นทางปัจจุบันไปให้ requireSession เอาไว้ทำ
  // callbackUrl ตอนเด้งกลับหน้า login · ทับค่าเดิมเสมอ ไม่ให้ client ปลอม header นี้ส่งเข้ามาได้
  const headers = new Headers(req.headers);
  headers.set(CURRENT_PATH_HEADER, pathname + search);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
