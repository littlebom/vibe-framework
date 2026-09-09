import { requirePermission, hasPermission, P } from "@/features/identity/server";
import { UsersClient } from "./_components/users-client";

export default async function UsersPage() {
  const ctx = await requirePermission(P.usersRead);
  return <UsersClient canManage={hasPermission(ctx, P.usersManage)} selfId={ctx.userId} />;
}
