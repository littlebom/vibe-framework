import { prisma } from "@/shared/lib/infra/prisma";
import type { CreateSampleItemInput, UpdateSampleItemInput } from "./validations";

export interface SampleItemDto {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export async function listSampleItems(tenantId: string): Promise<SampleItemDto[]> {
  const items = await prisma.sampleItem.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });
  return items.map((item) => ({
    id: item.id,
    tenantId: item.tenantId,
    title: item.title,
    description: item.description,
    status: item.status,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));
}

export async function createSampleItem(tenantId: string, input: CreateSampleItemInput): Promise<SampleItemDto> {
  const created = await prisma.sampleItem.create({
    data: {
      tenantId,
      title: input.title,
      description: input.description ?? null,
      status: input.status,
    },
  });
  return {
    id: created.id,
    tenantId: created.tenantId,
    title: created.title,
    description: created.description,
    status: created.status,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  };
}

export async function updateSampleItem(tenantId: string, input: UpdateSampleItemInput): Promise<SampleItemDto> {
  const updated = await prisma.sampleItem.update({
    where: { id: input.id, tenantId },
    data: {
      title: input.title,
      description: input.description ?? null,
      status: input.status,
    },
  });
  return {
    id: updated.id,
    tenantId: updated.tenantId,
    title: updated.title,
    description: updated.description,
    status: updated.status,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function deleteSampleItem(tenantId: string, id: string): Promise<void> {
  await prisma.sampleItem.delete({
    where: { id, tenantId },
  });
}
