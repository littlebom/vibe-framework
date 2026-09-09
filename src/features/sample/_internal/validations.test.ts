import { describe, it, expect } from "vitest";
import { createSampleItemSchema, updateSampleItemSchema } from "./validations";

describe("sample validations", () => {
  it("validate createSampleItemSchema สำเร็จเมื่อข้อมูลครบ", () => {
    const valid = { title: "หัวข้อทดสอบ", description: "รายละเอียด", status: "ACTIVE" };
    expect(createSampleItemSchema.parse(valid)).toEqual(valid);
  });

  it("validate createSampleItemSchema ล้มเมื่อไม่มี title", () => {
    expect(() => createSampleItemSchema.parse({ title: "" })).toThrow();
  });

  it("validate updateSampleItemSchema ต้องการ uuid", () => {
    const valid = { id: "123e4567-e89b-12d3-a456-426614174000", title: "หัวข้อใหม่" };
    expect(updateSampleItemSchema.parse(valid).id).toBe("123e4567-e89b-12d3-a456-426614174000");
  });
});
