import { prisma } from "@/shared/lib/infra/prisma";
import { logger } from "@/shared/lib/infra/logger";
import { writeAudit } from "../audit";
import type { UpdateProfileInput } from "../validations/settings";

/**
 * บันทึก audit เฉพาะตอนชื่อเปลี่ยนจริง — locale เป็นแค่ preference ส่วนตัว ไม่ต้อง audit
 * หา tenant จาก membership เหมือน password.service.ts (self-service): ไม่มี membership ก็เขียน
 * audit ไม่ได้จริง ๆ เพราะ audit_logs.tenant_id เป็น NOT NULL — แต่ต้องส่งเสียงเตือน ไม่ใช่เงียบ
 * (B18: ทั้งสี่เส้นทาง self-service ใช้รูปแบบเดียวกันหมดแล้ว ไม่แตกกันสามแบบเหมือนเดิม)
 */
export async function updateProfile(userId: string, input: UpdateProfileInput): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const before = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true } });
    await tx.user.update({ where: { id: userId }, data: { name: input.name, locale: input.locale } });
    if (input.name !== before.name) {
      const ut = await tx.userTenant.findFirst({ where: { userId }, select: { tenantId: true } });
      if (ut) {
        await writeAudit({ tenantId: ut.tenantId, actorId: userId, action: "user.profile_update", entity: "user", entityId: userId, before: { name: before.name }, after: { name: input.name } }, tx);
      } else {
        logger.warn("updateProfile: no tenant membership found, name changed without an audit row", { userId });
      }
    }
  });
}
