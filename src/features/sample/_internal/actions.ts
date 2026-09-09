"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/shared/lib/result";
import { getLocale } from "@/shared/lib/i18n/server";
import { zodErrorMap } from "@/shared/lib/i18n/zod-locale";
import { requirePermission } from "@/features/identity/server";
import { SAMPLE_P } from "../permissions";
import { createSampleItemSchema, updateSampleItemSchema } from "./validations";
import { createSampleItem, updateSampleItem, deleteSampleItem, listSampleItems, type SampleItemDto } from "./services";

export async function getSampleItemsAction(): Promise<ActionResult<SampleItemDto[]>> {
  return runAction(async () => {
    const ctx = await requirePermission(SAMPLE_P.sampleRead);
    return listSampleItems(ctx.tenantId);
  });
}

export async function createSampleItemAction(input: unknown): Promise<ActionResult<SampleItemDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(SAMPLE_P.sampleManage);
    const parsed = createSampleItemSchema.parse(input, { error: zodErrorMap(await getLocale()) });
    const result = await createSampleItem(ctx.tenantId, parsed);
    revalidatePath("/sample");
    return result;
  });
}

export async function updateSampleItemAction(input: unknown): Promise<ActionResult<SampleItemDto>> {
  return runAction(async () => {
    const ctx = await requirePermission(SAMPLE_P.sampleManage);
    const parsed = updateSampleItemSchema.parse(input, { error: zodErrorMap(await getLocale()) });
    const result = await updateSampleItem(ctx.tenantId, parsed);
    revalidatePath("/sample");
    return result;
  });
}

export async function deleteSampleItemAction(id: string): Promise<ActionResult<void>> {
  return runAction(async () => {
    const ctx = await requirePermission(SAMPLE_P.sampleManage);
    await deleteSampleItem(ctx.tenantId, id);
    revalidatePath("/sample");
  });
}
