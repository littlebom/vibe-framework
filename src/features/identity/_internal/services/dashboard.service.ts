import { prisma } from "@/shared/lib/infra/prisma";

export async function getDashboardStats(tenantId: string): Promise<{ users: number; activeUsers: number; roles: number }> {
  const [users, activeUsers, roles] = await Promise.all([
    prisma.userTenant.count({ where: { tenantId } }),
    prisma.userTenant.count({ where: { tenantId, isActive: true, user: { isActive: true } } }),
    prisma.role.count({ where: { tenantId } }),
  ]);
  return { users, activeUsers, roles };
}
