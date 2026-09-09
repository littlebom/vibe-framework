import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AdminShell, type AdminShellProps } from "./admin-shell";

const setThemeMock = vi.fn();
let themeValue = "light";

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: themeValue, setTheme: setThemeMock }),
}));

function baseProps(overrides: Partial<AdminShellProps> = {}): AdminShellProps {
  return {
    brandName: "VibeCore",
    brandTagline: "Enterprise Management",
    brandHref: "/dashboard",
    breadcrumb: [{ label: "หน้าแรก", href: "/dashboard" }, { label: "แดชบอร์ด" }],
    breadcrumbLabel: "ตำแหน่งหน้า",
    roleLabel: "ผู้ดูแลระบบ",
    notifications: null,
    account: null,
    themeToggleLabel: "สลับโหมดสี",
    collapsed: false,
    onToggleCollapsed: vi.fn(),
    collapseLabel: "ย่อเมนู",
    expandLabel: "ขยายเมนู",
    drawerOpen: false,
    onToggleDrawer: vi.fn(),
    onCloseDrawer: vi.fn(),
    drawerLabel: "เปิดเมนู",
    sidebarAriaLabel: "เมนูผู้ดูแลระบบ",
    sidebarNav: <div data-testid="nav-slot">nav</div>,
    children: <div data-testid="content">content</div>,
    ...overrides,
  };
}

describe("AdminShell", () => {
  beforeEach(() => {
    setThemeMock.mockClear();
    themeValue = "light";
  });

  it("แสดง breadcrumb บน navbar: ขั้นสุดท้ายเป็น aria-current=page (ไม่ใช่ h1) ขั้นก่อนหน้าเป็นลิงก์ และป้ายบทบาท", () => {
    render(<AdminShell {...baseProps()} />);
    const cur = screen.getByText("แดชบอร์ด");
    expect(cur.getAttribute("aria-current")).toBe("page");
    expect(screen.queryByRole("heading")).toBeNull();
    const nav = screen.getByRole("navigation", { name: "ตำแหน่งหน้า" });
    expect(nav.className).toContain("crumbs");
    const home = screen.getByRole("link", { name: "หน้าแรก" });
    expect(home.getAttribute("href")).toBe("/dashboard");
    expect(nav.querySelectorAll(".sep")).toHaveLength(1);
    expect(screen.getByText("ผู้ดูแลระบบ")).toBeTruthy();
  });

  it("ขั้นกลางที่ไม่มี href เป็นข้อความเฉย ๆ ไม่ใช่ลิงก์", () => {
    render(
      <AdminShell
        {...baseProps({
          breadcrumb: [{ label: "หน้าแรก", href: "/dashboard" }, { label: "ผู้ใช้ A" }, { label: "รายละเอียด" }],
        })}
      />,
    );
    expect(screen.queryByRole("link", { name: "ผู้ใช้ A" })).toBeNull();
    expect(screen.getByText("ผู้ใช้ A").tagName).toBe("SPAN");
    expect(screen.getByText("รายละเอียด").getAttribute("aria-current")).toBe("page");
  });

  it("ไม่แสดง breadcrumb เมื่อสายว่าง (ไม่ fallback เป็นข้อความสมมติ)", () => {
    render(<AdminShell {...baseProps({ breadcrumb: [] })} />);
    expect(screen.queryByRole("navigation", { name: "ตำแหน่งหน้า" })).toBeNull();
  });

  it("เรนเดอร์ sidebarNav slot ภายใน nav#admnav", () => {
    render(<AdminShell {...baseProps()} />);
    const slot = screen.getByTestId("nav-slot");
    expect(slot.closest("nav")?.id).toBe("admnav");
  });

  it("ใส่คลาส narrow/drawer บน .adm ตาม collapsed/drawerOpen", () => {
    const { container, rerender } = render(<AdminShell {...baseProps()} />);
    const root = container.querySelector(".adm");
    expect(root?.className).toBe("adm");

    rerender(<AdminShell {...baseProps({ collapsed: true, drawerOpen: true })} />);
    expect(root?.className).toContain("narrow");
    expect(root?.className).toContain("drawer");
  });

  it("ปุ่มย่อ/ขยายเรียก onToggleCollapsed และสลับ aria-expanded", () => {
    const onToggleCollapsed = vi.fn();
    const { rerender } = render(<AdminShell {...baseProps({ onToggleCollapsed })} />);
    const btn = screen.getByRole("button", { name: "ย่อเมนู" });
    expect(btn.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(btn);
    expect(onToggleCollapsed).toHaveBeenCalledTimes(1);

    rerender(<AdminShell {...baseProps({ collapsed: true })} />);
    expect(screen.getByRole("button", { name: "ขยายเมนู" }).getAttribute("aria-expanded")).toBe("false");
  });

  it("ปุ่ม drawer (hamburger) เรียก onToggleDrawer", () => {
    const onToggleDrawer = vi.fn();
    render(<AdminShell {...baseProps({ onToggleDrawer })} />);
    fireEvent.click(screen.getByRole("button", { name: "เปิดเมนู" }));
    expect(onToggleDrawer).toHaveBeenCalledTimes(1);
  });

  it("ไม่มี palette switcher (ของจริงผูกกับ tenant.settings ไม่ใช่ตัวสลับสด)", () => {
    render(<AdminShell {...baseProps()} />);
    expect(document.querySelector(".palette")).toBeNull();
  });

  it("signed-in: แสดงชื่อบัญชี และคลิก sign-out เรียก onSignOut", async () => {
    const onSignOut = vi.fn();
    render(
      <AdminShell
        {...baseProps({
          account: {
            name: "สมชาย ใจดี",
            email: "somchai@example.com",
            initials: "สจ",
            links: [{ href: "/me", label: "โปรไฟล์", icon: <span>icon</span> }],
            onSignOut,
            signOutLabel: "ออกจากระบบ",
          },
        })}
      />,
    );
    expect(screen.getByText("สมชาย ใจดี")).toBeTruthy();
    const trigger = screen.getByRole("button", { name: /สมชาย ใจดี/ });
    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
    const signOutItem = await screen.findByText("ออกจากระบบ");
    fireEvent.click(signOutItem);
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it("แสดงจำนวนแจ้งเตือนที่ยังไม่อ่าน", () => {
    render(
      <AdminShell
        {...baseProps({ notifications: { count: 3, href: "/notifications", label: "การแจ้งเตือน" } })}
      />,
    );
    expect(screen.getByText("3")).toBeTruthy();
  });
});
