import { z } from "zod";

export const roleCodeSchema = z.string().trim().toUpperCase().regex(/^[A-Z][A-Z0-9_]{1,49}$/, "code_format");

export const createRoleSchema = z.object({
  code: roleCodeSchema,
  nameTh: z.string().trim().min(1).max(100),
  nameEn: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional().default(""),
  permissionCodes: z.array(z.string().min(1)).default([]),
});
export const updateRoleSchema = createRoleSchema.omit({ code: true }).extend({ roleId: z.string().uuid() });
export const deleteRoleSchema = z.object({ roleId: z.string().uuid() });
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
