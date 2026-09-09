import { z } from "zod";

export const createSampleItemSchema = z.object({
  title: z.string().min(1, "title_required").max(255),
  description: z.string().max(2000).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const updateSampleItemSchema = createSampleItemSchema.extend({
  id: z.string().uuid(),
});

export type CreateSampleItemInput = z.infer<typeof createSampleItemSchema>;
export type UpdateSampleItemInput = z.infer<typeof updateSampleItemSchema>;
