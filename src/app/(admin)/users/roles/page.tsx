import { requirePermission, P } from "@/features/identity/server";
import { RolesClient } from "./_components/roles-client";

export default async function RolesPage() {
  await requirePermission(P.rolesManage);
  return <RolesClient />;
}
