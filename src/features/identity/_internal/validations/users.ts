import { z } from "zod";
import { emailSchema } from "./auth";

export const roleAssignmentSchema = z.object({
  roleId: z.string().uuid(),
  scopeType: z.enum(["ALL", "CAMPUS", "ORG_UNIT"]).default("ALL"),
  scopeId: z.string().uuid().nullable().default(null),
}).refine((r) => (r.scopeType === "ALL") === (r.scopeId === null), { message: "scope_mismatch", path: ["scopeId"] });

/**
 * B4 — กันบทบาทซ้ำในคำขอเดียว: `@@unique([userTenantId, roleId, scopeType, scopeId])` ไม่ dedupe เมื่อ
 * `scope_id` เป็น NULL (มาตรฐาน SQL: NULL ไม่เท่ากับ NULL — schema.prisma รู้ข้อนี้อยู่แล้วในคอมเมนต์)
 * ถ้าไม่กันที่นี่ `createMany` แทรก (roleId, ALL, null) ซ้ำได้ ทำให้ memberCount ของบทบาทพองเกินจริง
 * และลบบทบาทนั้นไม่ได้อีกเลยเพราะระบบเห็นว่ายังมีผู้ถือ
 */
export const roleAssignmentsSchema = z
  .array(roleAssignmentSchema)
  .min(1)
  .refine((rs) => new Set(rs.map((r) => `${r.roleId}|${r.scopeType}|${r.scopeId ?? ""}`)).size === rs.length, { message: "duplicate_role_assignment" });

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(5).max(100).default(20),
  search: z.string().trim().max(100).default(""),
  status: z.enum(["all", "active", "inactive"]).default("all"),
  roleId: z.string().uuid().optional(),
});

export const createUserSchema = z.object({
  email: emailSchema,
  name: z.string().trim().min(1).max(255),
  roles: roleAssignmentsSchema,
});

export const updateUserSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().trim().min(1).max(255).optional(),
  roles: roleAssignmentsSchema.optional(),
  mustChangePassword: z.boolean().optional(),
});

export const setUserActiveSchema = z.object({ userId: z.string().uuid(), isActive: z.boolean() });
export const issuePasswordLinkSchema = z.object({ userId: z.string().uuid() });
export const requestEmailChangeSchema = z.object({ userId: z.string().uuid(), newEmail: emailSchema });

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type RoleAssignment = z.infer<typeof roleAssignmentSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
