import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusPill } from "./status-pill";

describe("StatusPill", () => {
  it("ใส่คลาส .st และคลาสของโทนสี", () => {
    render(<StatusPill tone="ok">ใช้งาน</StatusPill>);
    const el = screen.getByText("ใช้งาน");
    expect(el.className).toContain("st");
    expect(el.className).toContain("ok");
  });

  it.each([["warn"], ["bad"], ["info"], ["off"]] as const)("รองรับโทน %s", (tone) => {
    render(<StatusPill tone={tone}>label</StatusPill>);
    expect(screen.getByText("label").className).toContain(tone);
  });
});
