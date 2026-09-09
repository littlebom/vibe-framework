import { requirePermission, hasPermission } from "@/features/identity/server";
import { SAMPLE_P, listSampleItems } from "@/features/sample/server";
import { SampleClient } from "./_components/sample-client";

export default async function SamplePage() {
  const ctx = await requirePermission(SAMPLE_P.sampleRead);
  const initialItems = await listSampleItems(ctx.tenantId);
  return (
    <SampleClient
      initialItems={initialItems}
      canManage={hasPermission(ctx, SAMPLE_P.sampleManage)}
    />
  );
}
