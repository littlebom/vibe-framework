import { describe, it, expect } from "vitest";
import { buildGrants } from "./grants";

describe("buildGrants", () => {
  it("รวม permissions จากหลายบทบาทแบบไม่ซ้ำ และคง scope ของแต่ละแถว", () => {
    const g = buildGrants([
      { scopeType: "ALL", scopeId: null, role: { code: "ADMIN", nameTh: "ผู้ดูแลระบบ", nameEn: "Administrator", isSystem: false, permissions: ["users:read", "users:manage"] } },
      { scopeType: "CAMPUS", scopeId: "c1", role: { code: "STAFF", nameTh: "เจ้าหน้าที่", nameEn: "Staff", isSystem: false, permissions: ["users:read", "curriculum:manage"] } },
    ]);
    expect(g.permissions.sort()).toEqual(["curriculum:manage", "users:manage", "users:read"]);
    expect(g.roles).toHaveLength(2);
    expect(g.roles[1]).toEqual({ code: "STAFF", nameTh: "เจ้าหน้าที่", nameEn: "Staff", scopeType: "CAMPUS", scopeId: "c1", permissions: ["users:read", "curriculum:manage"] });
    expect(g.isSuperAdmin).toBe(false);
  });
  it("SUPER_ADMIN ทำให้ isSuperAdmin จริง แม้ไม่มี permission", () => {
    const g = buildGrants([{ scopeType: "ALL", scopeId: null, role: { code: "SUPER_ADMIN", nameTh: "ผู้ดูแลสูงสุด", nameEn: "Super admin", isSystem: true, permissions: [] } }]);
    expect(g.isSuperAdmin).toBe(true);
  });
  it("ไม่มีบทบาท → ว่าง", () => {
    expect(buildGrants([])).toEqual({ roles: [], permissions: [], isSuperAdmin: false });
  });
});
