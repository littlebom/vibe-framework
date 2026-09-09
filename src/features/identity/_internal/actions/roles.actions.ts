"use server";
import { runAction, type ActionResult } from "@/shared/lib/result";
import { getLocale } from "@/shared/lib/i18n/server";
import { zodErrorMap } from "@/shared/lib/i18n/zod-locale";
import { P } from "../../permissions";
import { requirePermission } from "../rbac";
import { createRoleSchema, updateRoleSchema, deleteRoleSchema } from "../validations/roles";
import * as svc from "../services/role.service";

const em = async () => ({ error: zodErrorMap(await getLocale()) });

/** ข้อมูลผู้กระทำจาก session snapshot — ที่มาของอำนาจให้ guard A7/F1 ในชั้น service (ห้าม re-derive ที่นั่น) */
const actorOf = (ctx: { tenantId: string; userId: string; isSuperAdmin: boolean; permissions: string[] }) =>
  ({ tenantId: ctx.tenantId, actorId: ctx.userId, isSuperAdmin: ctx.isSuperAdmin, permissions: ctx.permissions });

export async function listRolesAction(): Promise<ActionResult<svc.RoleItem[]>> {
  return runAction(async () => svc.listRoles((await requirePermission(P.rolesManage)).tenantId));
}
export async function listPermissionsAction(): Promise<ActionResult<{ code: string; module: string; action: string }[]>> {
  return runAction(async () => { await requirePermission(P.rolesManage); return svc.listPermissions(); });
}
export async function createRoleAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const ctx = await requirePermission(P.rolesManage);
    const r = await svc.createRole({ ...actorOf(ctx), ...createRoleSchema.parse(input, await em()) });
    return { id: r.id };
  });
}
export async function updateRoleAction(input: unknown): Promise<ActionResult<void>> {
  return runAction(async () => {
    const ctx = await requirePermission(P.rolesManage);
    await svc.updateRole({ ...actorOf(ctx), ...updateRoleSchema.parse(input, await em()) });
  });
}
export async function deleteRoleAction(input: unknown): Promise<ActionResult<void>> {
  return runAction(async () => {
    const ctx = await requirePermission(P.rolesManage);
    await svc.deleteRole({ ...actorOf(ctx), ...deleteRoleSchema.parse(input, await em()) });
  });
}
