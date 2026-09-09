import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LiyonCard } from "./card";

describe("LiyonCard", () => {
  it("render เป็น section คลาส .det-pane", () => {
    render(<LiyonCard>เนื้อหา</LiyonCard>);
    const el = screen.getByText("เนื้อหา");
    expect(el.tagName).toBe("SECTION");
    expect(el.className).toContain("det-pane");
  });

  it("ต่อคลาสเพิ่มเติมได้", () => {
    render(<LiyonCard className="extra">x</LiyonCard>);
    expect(screen.getByText("x").className).toContain("extra");
  });
});
