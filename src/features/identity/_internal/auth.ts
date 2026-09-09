import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { prisma } from "@/shared/lib/infra/prisma";
import { env, googleOAuthConfigured, microsoftOAuthConfigured } from "@/shared/lib/infra/env";
import { verifyPassword } from "@/shared/lib/security/password";
import { logger } from "@/shared/lib/infra/logger";
import { loginSchema } from "./validations/auth";
import { throttleKeys, isLoginThrottled, recordLoginFailure, resetLoginFailures } from "./throttle";
import { applyAuthorizationSnapshot, loadAuthorizationSnapshot } from "./revalidate";
import { passwordHashFor, DUMMY_PASSWORD_HASH } from "./password-select";

export type OAuthProviderId = "google" | "microsoft";

/** ปุ่ม OAuth โผล่เฉพาะเมื่อ env ครบ — ไม่ลงทะเบียน provider ที่ไม่มี credential */
export function oauthProviderIds(): OAuthProviderId[] {
  const ids: OAuthProviderId[] = [];
  if (googleOAuthConfigured()) ids.push("google");
  if (microsoftOAuthConfigured()) ids.push("microsoft");
  return ids;
}

function clientIp(req: Request | undefined): string | null {
  const xff = req?.headers.get("x-forwarded-for");
  return xff ? xff.split(",")[0].trim() : null;
}

/** ผู้ใช้ต้องมีสมาชิกภาพ active ใน tenant เดียว (single tenant) — คืน tenantId */
async function homeTenantId(userId: string): Promise<string | null> {
  const ut = await prisma.userTenant.findFirst({ where: { userId, isActive: true }, orderBy: { joinedAt: "asc" }, select: { tenantId: true } });
  return ut?.tenantId ?? null;
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 2 * 24 * 60 * 60, updateAge: 24 * 60 * 60 },
  providers: [
    ...(googleOAuthConfigured() ? [Google({ clientId: env().GOOGLE_CLIENT_ID, clientSecret: env().GOOGLE_CLIENT_SECRET })] : []),
    ...(microsoftOAuthConfigured()
      ? [MicrosoftEntraID({ clientId: env().MICROSOFT_CLIENT_ID, clientSecret: env().MICROSOFT_CLIENT_SECRET, issuer: `https://login.microsoftonline.com/${env().MICROSOFT_TENANT_ID}/v2.0` })]
      : []),
    Credentials({
      credentials: { email: { type: "email" }, password: { type: "password" } },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const keys = throttleKeys(email, clientIp(request));

        if (await isLoginThrottled(keys)) {
          logger.warn("login throttled", { email });
          return null;
        }
        const user = await prisma.user.findUnique({ where: { email } });
        const passwordOk = await verifyPassword(password, passwordHashFor(user, DUMMY_PASSWORD_HASH));
        if (!user || !user.passwordHash || !user.isActive || !passwordOk) {
          await recordLoginFailure(keys);
          return null;
        }
        await resetLoginFailures(keys);
        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        return { id: user.id, email: user.email, name: user.name, image: user.imageUrl ?? undefined };
      },
    }),
  ],
  callbacks: {
    /** OAuth: ต้องมีบัญชีอยู่ก่อน (แอดมินสร้าง) ไม่สร้างอัตโนมัติ */
    async signIn({ user, account }) {
      if (!account || account.provider === "credentials") return true;
      const providerKey: OAuthProviderId = account.provider === "microsoft-entra-id" ? "microsoft" : "google";
      if (!user.email) return "/login?error=NoAccount";
      const existing = await prisma.user.findUnique({ where: { email: user.email.toLowerCase() } });
      if (!existing || !existing.isActive) return "/login?error=NoAccount";
      await prisma.user.update({
        where: { id: existing.id },
        data: { provider: providerKey, providerId: account.providerAccountId, imageUrl: user.image ?? existing.imageUrl, lastLoginAt: new Date() },
      });
      user.id = existing.id;
      return true;
    },

    async jwt({ token, user, trigger, session }) {
      if (user?.id) {
        token.userId = user.id;
        token.tenantId = (await homeTenantId(user.id)) ?? undefined;
        token.checkedAt = 0; // บังคับโหลด snapshot ทันทีด้านล่าง
      }
      if (trigger === "update" && session) {
        if (typeof session.name === "string") token.name = session.name;
        if (session.image !== undefined) token.picture = session.image;
        token.checkedAt = 0; // เช่น เปลี่ยนรหัสผ่านแล้ว mustChangePassword ต้องหายทันที
      }
      // edge runtime ไม่มี Prisma — proxy.ts อ่าน token ที่ฝั่ง node เขียนไว้แล้วเท่านั้น
      // เงื่อนไขเวลา/การเขียน token ทั้งหมดอยู่ใน applyAuthorizationSnapshot (มีเทสต์ใน revalidate.int.test.ts)
      if (process.env.NEXT_RUNTIME === "edge") return token;
      return applyAuthorizationSnapshot(token, loadAuthorizationSnapshot);
    },

    async session({ session, token }) {
      if (token.invalid || !token.userId || !token.tenantId) {
        session.user.id = "";
        session.tenantId = "";
        session.roles = []; session.permissions = []; session.isSuperAdmin = false; session.mustChangePassword = false; session.locale = null;
        return session;
      }
      session.user.id = token.userId;
      session.user.name = (token.name as string) ?? session.user.name;
      session.user.image = (token.picture as string) ?? undefined;
      session.tenantId = token.tenantId;
      session.locale = token.locale ?? null;
      session.roles = token.roles ?? [];
      session.permissions = token.permissions ?? [];
      session.isSuperAdmin = token.isSuperAdmin ?? false;
      session.mustChangePassword = token.mustChangePassword ?? false;
      return session;
    },
  },
});
