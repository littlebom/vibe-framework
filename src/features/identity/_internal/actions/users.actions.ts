"use server";
import { runAction, type ActionResult } from "@/shared/lib/result";
import { getLocale } from "@/shared/lib/i18n/server";
import { zodErrorMap } from "@/shared/lib/i18n/zod-locale";
import { env } from "@/shared/lib/infra/env";
import { prisma } from "@/shared/lib/infra/prisma";
import { P } from "../../permissions";
import { requirePermission } from "../rbac";
import { listUsersQuerySchema, createUserSchema, updateUserSchema, setUserActiveSchema, issuePasswordLinkSchema, requestEmailChangeSchema } from "../validations/users";
import * as svc from "../services/user.service";

const em = async () => ({ error: zodErrorMap(await getLocale()) });

/** ข้อมูลผู้กระทำจาก session snapshot — ที่มาของอำนาจให้ guard F1/F2 ในชั้น service (ห้าม re-derive ที่นั่น) */
const actorOf = (ctx: { tenantId: string; userId: string; isSuperAdmin: boolean; permissions: string[] }) =>
  ({ tenantId: ctx.tenantId, actorId: ctx.userId, isSuperAdmin: ctx.isSuperAdmin, permissions: ctx.permissions });

export async function listUsersAction(q: unknown): Promise<ActionResult<{ items: svc.UserListItem[]; total: number }>> {
  return runAction(async () => {
    const ctx = await requirePermission(P.usersRead);
    return svc.listUsers(ctx.tenantId, listUsersQuerySchema.parse(q, await em()));
  });
}

export async function listRolesForPickerAction(): Promise<ActionResult<{ id: string; code: string; nameTh: string; nameEn: string }[]>> {
  return runAction(async () => {
    const ctx = await requirePermission(P.usersRead);
    return prisma.role.findMany({ where: { tenantId: ctx.tenantId }, orderBy: { code: "asc" }, select: { id: true, code: true, nameTh: true, nameEn: true } });
  });
}

export async function createUserAction(input: unknown): Promise<ActionResult<{ userId: string; link: string; hours: number; mailDelivered: boolean }>> {
  return runAction(async () => {
    const ctx = await requirePermission(P.usersManage);
    const data = createUserSchema.parse(input, await em());
    const r = await svc.createUser({ ...actorOf(ctx), ...data });
    return { userId: r.user.id, link: `${env().APP_URL}/reset-password/${r.rawToken}`, hours: 72, mailDelivered: r.mailDelivered };
  });
}

export async function updateUserAction(input: unknown): Promise<ActionResult<void>> {
  return runAction(async () => {
    const ctx = await requirePermission(P.usersManage);
    await svc.updateUser({ ...actorOf(ctx), ...updateUserSchema.parse(input, await em()) });
  });
}

export async function setUserActiveAction(input: unknown): Promise<ActionResult<void>> {
  return runAction(async () => {
    const ctx = await requirePermission(P.usersManage);
    await svc.setUserActive({ ...actorOf(ctx), ...setUserActiveSchema.parse(input, await em()) });
  });
}

export async function issuePasswordLinkAction(input: unknown): Promise<ActionResult<{ link: string; hours: number; mailDelivered: boolean }>> {
  return runAction(async () => {
    const ctx = await requirePermission(P.usersManage);
    const { userId } = issuePasswordLinkSchema.parse(input, await em());
    const r = await svc.issuePasswordSetupLink({ ...actorOf(ctx), userId });
    return { link: `${env().APP_URL}/reset-password/${r.rawToken}`, hours: 72, mailDelivered: r.mailDelivered };
  });
}

export async function requestEmailChangeAction(input: unknown): Promise<ActionResult<{ link: string; hours: number; mailDelivered: boolean }>> {
  return runAction(async () => {
    const ctx = await requirePermission(P.usersManage);
    const r = await svc.requestEmailChange({ ...actorOf(ctx), ...requestEmailChangeSchema.parse(input, await em()) });
    return { link: `${env().APP_URL}/verify-email/${r.rawToken}`, hours: 24, mailDelivered: r.mailDelivered };
  });
}

export async function confirmEmailChangeAction(token: string): Promise<ActionResult<boolean>> {
  return runAction(() => svc.confirmEmailChange(token));
}
