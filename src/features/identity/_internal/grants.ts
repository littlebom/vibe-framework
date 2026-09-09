import { SUPER_ADMIN_CODE } from "../permissions";

export type ScopeType = "ALL" | "CAMPUS" | "ORG_UNIT";

export interface RoleGrant {
  code: string;
  nameTh: string;
  nameEn: string;
  scopeType: ScopeType;
  scopeId: string | null;
  permissions: string[];
}

export interface Grants {
  roles: RoleGrant[];
  permissions: string[];
  isSuperAdmin: boolean;
}

export interface UserRoleRow {
  scopeType: ScopeType;
  scopeId: string | null;
  role: { code: string; nameTh: string; nameEn: string; isSystem: boolean; permissions: string[] };
}

/** รวมสิทธิ์จากทุกบทบาท (union) — ตรรกะบริสุทธิ์ ใช้ทั้งตอน login และตอน revalidate */
export function buildGrants(rows: UserRoleRow[]): Grants {
  const roles: RoleGrant[] = rows.map((r) => ({ code: r.role.code, nameTh: r.role.nameTh, nameEn: r.role.nameEn, scopeType: r.scopeType, scopeId: r.scopeId, permissions: [...r.role.permissions] }));
  const permissions = [...new Set(roles.flatMap((r) => r.permissions))];
  const isSuperAdmin = roles.some((r) => r.code === SUPER_ADMIN_CODE);
  return { roles, permissions, isSuperAdmin };
}
