import type { PermissionDef } from "@/shared/lib/permission-def";

export const SAMPLE_P = {
  sampleRead: "sample:read",
  sampleManage: "sample:manage",
} as const;

export const SAMPLE_PERMISSIONS: readonly PermissionDef[] = [
  { code: SAMPLE_P.sampleRead, module: "sample", action: "read" },
  { code: SAMPLE_P.sampleManage, module: "sample", action: "manage" },
];
