import { describe, it, expect } from "vitest";
import { hasPermission, permissionScopes } from "./rbac-pure";
import type { RoleGrant } from "./grants";

const roles: RoleGrant[] = [
  { code: "STAFF", nameTh: "เจ้าหน้าที่", nameEn: "Staff", scopeType: "CAMPUS", scopeId: "campus-A", permissions: ["curriculum:manage"] },
  { code: "HEAD", nameTh: "หัวหน้าภาค", nameEn: "Head", scopeType: "ORG_UNIT", scopeId: "dept-1", permissions: ["curriculum:manage", "personnel:read"] },
  { code: "VIEWER", nameTh: "ผู้ดู", nameEn: "Viewer", scopeType: "ALL", scopeId: null, permissions: ["users:read"] },
];
const ctx = { roles, permissions: ["curriculum:manage", "personnel:read", "users:read"], isSuperAdmin: false };

describe("hasPermission", () => {
  it("ไม่ระบุ scope ตรวจแค่มีสิทธิ์", () => {
    expect(hasPermission(ctx, "curriculum:manage")).toBe(true);
    expect(hasPermission(ctx, "roles:manage")).toBe(false);
  });
  it("ระบุ campus ต้องมีบทบาทที่ครอบ campus นั้นหรือเป็น ALL", () => {
    expect(hasPermission(ctx, "curriculum:manage", { campusId: "campus-A" })).toBe(true);
    expect(hasPermission(ctx, "curriculum:manage", { campusId: "campus-B" })).toBe(false);
    expect(hasPermission(ctx, "users:read", { campusId: "campus-B" })).toBe(true); // VIEWER scope ALL
  });
  it("ระบุ orgUnit ตรวจกับบทบาท ORG_UNIT", () => {
    expect(hasPermission(ctx, "personnel:read", { orgUnitId: "dept-1" })).toBe(true);
    expect(hasPermission(ctx, "personnel:read", { orgUnitId: "dept-2" })).toBe(false);
  });
  it("SUPER_ADMIN ผ่านทุกกรณี", () => {
    expect(hasPermission({ roles: [], permissions: [], isSuperAdmin: true }, "anything", { campusId: "x" })).toBe(true);
  });
});

describe("permissionScopes", () => {
  it("คืน all เมื่อมีบทบาท ALL ที่ให้สิทธิ์นั้นหรือเป็น super admin", () => {
    expect(permissionScopes(ctx, "users:read")).toEqual({ all: true });
    expect(permissionScopes({ ...ctx, isSuperAdmin: true }, "x")).toEqual({ all: true });
  });
  it("คืนรายการ campus/orgUnit ที่มีสิทธิ์", () => {
    expect(permissionScopes(ctx, "curriculum:manage")).toEqual({ all: false, campusIds: ["campus-A"], orgUnitIds: ["dept-1"] });
    expect(permissionScopes(ctx, "roles:manage")).toEqual({ all: false, campusIds: [], orgUnitIds: [] });
  });
});
