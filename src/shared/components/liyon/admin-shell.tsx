"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { cn } from "@/shared/lib/utils";
import type { Crumb } from "./breadcrumb-tail";

export interface SiteNavAccountLink {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

export interface SiteNavAccount {
  name: string;
  email: string;
  imageUrl?: string | null;
  initials: string;
  links: SiteNavAccountLink[];
  onSignOut: () => void;
  signOutLabel: string;
}

export interface AdminShellProps {
  brandName: string;
  brandTagline: string;
  brandHref: string;
  /** ชื่อหน้าปัจจุบัน (`.tenant` ใน navbar) — ว่างได้ถ้าหาไม่เจอ (ไม่ fallback เป็นค่าปลอม) */
  /** breadcrumb บน navbar — ขั้นสุดท้ายเป็น span[aria-current=page] (h1 เป็นของหัวหน้าในเนื้อหา) ขั้นก่อนหน้าเป็นลิงก์ · ว่าง = ไม่แสดง */
  breadcrumb: Crumb[];
  breadcrumbLabel: string;
  /** ป้ายบทบาท เช่น "ผู้ดูแลระบบ" — ไม่มีถ้ายังไม่รู้บทบาท */
  roleLabel?: string | null;
  languageSwitcher?: React.ReactNode;
  notifications: { count: number; href: string; label: string } | null;
  /** null = ยังโหลด session ไม่เสร็จ (แสดง skeleton แทนเมนูอวตาร) */
  account: SiteNavAccount | null;
  accountLoading?: boolean;
  themeToggleLabel: string;

  collapsed: boolean;
  onToggleCollapsed: () => void;
  collapseLabel: string;
  expandLabel: string;

  drawerOpen: boolean;
  onToggleDrawer: () => void;
  onCloseDrawer: () => void;
  drawerLabel: string;

  sidebarAriaLabel: string;
  /** เนื้อหาเมนู (กลุ่ม/รายการ) — คำนวณ active/locked/platformOnly โดยผู้เรียก */
  sidebarNav: React.ReactNode;

  children: React.ReactNode;
}

/**
 * เปลือกฝั่งผู้ดูแลระบบ — primitive ตัวที่สี่ของ shared/components/liyon
 * Markup ตรงกับ `.adm` ของ Liyon-Admin-Dashboard.html / Liyon-Admin-Spec.html:
 * navbar เต็มความกว้างแถวบน (`.adm-head`) + sidebar การ์ดลอย (`.side`) +
 * พื้นที่ทำงาน (`.adm-body > .adm-main > .in`)
 *
 * เหมือน SiteNav: เมนูอวตารใช้ Radix DropdownMenu แทน `<details>` ของ mockup เพื่อคง
 * focus handling — ใช้ primitive ของ radix-ui ตรง ๆ (ไม่ผ่าน shadcn wrapper ที่
 * src/components/ui/dropdown-menu.tsx) เพราะ dependency-cruiser ห้าม shared/ import
 * components/ (กติกา no-shared-to-features) เมนูจึงใช้คลาส `.menu-list` ของ
 * liyon-shell.css แทน `.acct-menu` — `.acct-menu` อิง position:absolute ของ mockup ที่
 * ไม่ได้พอร์ต ส่วน `.menu-list` เป็น position:fixed ที่ออกแบบมาให้ใช้กับเมนูลอยที่ JS/Popper
 * จัดตำแหน่งเองอยู่แล้ว (แบบเดียวกับ RowMenu ใน data-table.tsx) — ส่วนปุ่ม theme/hamburger/
 * collapse/bell ใช้ SVG
 * inline คัดลอกจาก mockup ตรง ๆ เพราะเป็นไอคอนที่ `.icon-btn > svg` ต้องมีรูป
 * ตรงตัวถึงจะดูเป็นชิ้นเดียวกับปุ่มอื่นในแถบเดียวกัน
 *
 * ไม่มี palette switcher ในนี้โดยตั้งใจ — ของจริง palette ผูกกับ
 * tenant.settings.palette ฝั่งเซิร์ฟเวอร์ ไม่ใช่ตัวสลับสดในหน้าเหมือน mockup
 * (เดียวกับที่ SiteNav ของฝั่ง public ไม่มี palette switcher เช่นกัน)
 *
 * เนื้อหาเมนู sidebar เป็น slot (`sidebarNav`) ไม่ใช่ prop ข้อมูลโครงสร้าง —
 * ผู้เรียกต้องพึ่ง hook เฉพาะแอป (useAppSession/useIsFeatureLocked/
 * useSidebarStore) ซึ่งไม่ใช่ของที่ shared/ ควรผูกตรง ๆ
 */
export function AdminShell({
  brandName,
  brandTagline,
  brandHref,
  breadcrumb,
  breadcrumbLabel,
  roleLabel,
  languageSwitcher,
  notifications,
  account,
  accountLoading = false,
  themeToggleLabel,
  collapsed,
  onToggleCollapsed,
  collapseLabel,
  expandLabel,
  drawerOpen,
  onToggleDrawer,
  onCloseDrawer,
  drawerLabel,
  sidebarAriaLabel,
  sidebarNav,
  children,
}: AdminShellProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={cn("adm", collapsed && "narrow", drawerOpen && "drawer")}>
      <header className="adm-head">
        <Link className="brand-blk" href={brandHref}>
          <i>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22 10 12 5 2 10l10 5 10-5Z" />
              <path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
            </svg>
          </i>
          <div className="t">
            <b>{brandName}</b>
            <span>{brandTagline}</span>
          </div>
        </Link>

        <button
          type="button"
          className="icon-btn"
          data-drawer
          aria-label={drawerLabel}
          onClick={onToggleDrawer}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>

        {breadcrumb.length > 0 && (
          <nav className="crumbs" aria-label={breadcrumbLabel}>
            {breadcrumb.map((c, i) => {
              const last = i === breadcrumb.length - 1;
              return (
                <React.Fragment key={`${c.href ?? ""}#${c.label}#${i}`}>
                  {i > 0 && (
                    <span className="sep" aria-hidden="true">
                      ›
                    </span>
                  )}
                  {last ? (
                    <span className="cur" aria-current="page">
                      {c.label}
                    </span>
                  ) : c.href ? (
                    <Link href={c.href}>{c.label}</Link>
                  ) : (
                    <span>{c.label}</span>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        )}
        <span className="sp" />

        {roleLabel && <span className="pill role">{roleLabel}</span>}

        <button
          type="button"
          className="icon-btn"
          aria-label={themeToggleLabel}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <svg className="sun" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2v2.3M12 19.7V22M2 12h2.3M19.7 12H22M5.1 5.1l1.6 1.6M17.3 17.3l1.6 1.6M18.9 5.1l-1.6 1.6M6.7 17.3l-1.6 1.6" />
          </svg>
          <svg className="moon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20.2 14.7A8.3 8.3 0 0 1 9.3 3.8a8.5 8.5 0 1 0 10.9 10.9Z" />
          </svg>
        </button>

        {languageSwitcher}

        {notifications && (
          <Link href={notifications.href} className="icon-btn bell" aria-label={notifications.label}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16S18 14 18 9Z" />
              <path d="M13.7 20a2 2 0 0 1-3.4 0" />
            </svg>
            {notifications.count > 0 && (
              <span className="dot num">{notifications.count > 99 ? "99+" : notifications.count}</span>
            )}
          </Link>
        )}

        {accountLoading ? (
          <div aria-hidden="true" className="h-9 w-9 animate-pulse rounded-full bg-[var(--glass-strong)]" />
        ) : account ? (
          <div className="acct">
            <DropdownMenuPrimitive.Root>
              <DropdownMenuPrimitive.Trigger asChild>
                <button type="button">
                  <span className="who" aria-hidden="true">
                    {account.imageUrl ? (
                      // รูปโปรไฟล์มาจาก OAuth provider (โฮสต์ภายนอกที่ไม่รู้ล่วงหน้า) next/image ต้อง
                      // ประกาศโดเมนใน next.config ก่อน จึงใช้ <img> ตรง ๆ กับรูปขนาด 36px รูปเดียวต่อหน้า
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={account.imageUrl} alt="" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      account.initials
                    )}
                  </span>
                  <span className="nm">{account.name}</span>
                  <svg className="chev" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              </DropdownMenuPrimitive.Trigger>
              <DropdownMenuPrimitive.Portal>
                {/* .menu-list (liyon-shell.css) ตรงกับที่ RowMenu ของ data-table.tsx ใช้อยู่แล้ว
                    (.acct-menu ของ mockup อิง position:absolute ของ <details> ที่ไม่พอร์ตมา —
                    ดูหมายเหตุด้านบนของไฟล์) — .menu-list เขียน position:fixed ไว้สำหรับ JS ของ
                    mockup เอง (ดูคอมเมนต์ใน liyon-shell.css) แต่ที่นี่ Radix Popper (data-radix-popper
                    -content-wrapper) เป็นตัวจัดตำแหน่ง fixed ให้แล้วรอบนอก — ถ้าปล่อยให้ Content เอง
                    เป็น position:fixed ด้วย wrapper จะวัดขนาดลูกไม่ได้ (ลูกหลุด flow ไปอ้างอิง viewport
                    เอง) กลายเป็นกล่อง 0×0 แล้ว Radix คำนวณตำแหน่ง align="end" ผิดพลาด (เมนูเบี้ยว
                    หลุดจอ) จึง override เป็น static ที่นี่ ไม่แตะไฟล์ CSS ที่ generate ไว้ */}
                <DropdownMenuPrimitive.Content
                  className="menu-list"
                  align="end"
                  sideOffset={8}
                  style={{ position: "static" }}
                >
                  <DropdownMenuPrimitive.Label asChild>
                    <div className="px-2.5 py-2">
                      <p className="text-sm font-medium">{account.name}</p>
                      <p className="text-xs text-muted-foreground">{account.email}</p>
                    </div>
                  </DropdownMenuPrimitive.Label>
                  <DropdownMenuPrimitive.Separator asChild>
                    <hr />
                  </DropdownMenuPrimitive.Separator>
                  {account.links.map((link) => (
                    <DropdownMenuPrimitive.Item key={link.href} asChild>
                      <Link href={link.href}>
                        {link.icon}
                        {link.label}
                      </Link>
                    </DropdownMenuPrimitive.Item>
                  ))}
                  <DropdownMenuPrimitive.Separator asChild>
                    <hr />
                  </DropdownMenuPrimitive.Separator>
                  <DropdownMenuPrimitive.Item asChild onSelect={account.onSignOut}>
                    <button type="button" className="danger">
                      {account.signOutLabel}
                    </button>
                  </DropdownMenuPrimitive.Item>
                </DropdownMenuPrimitive.Content>
              </DropdownMenuPrimitive.Portal>
            </DropdownMenuPrimitive.Root>
          </div>
        ) : null}
      </header>

      <aside className="side" aria-label={sidebarAriaLabel}>
        <button
          type="button"
          data-collapse
          aria-expanded={!collapsed}
          aria-controls="admnav"
          aria-label={collapsed ? expandLabel : collapseLabel}
          title={collapsed ? expandLabel : collapseLabel}
          onClick={onToggleCollapsed}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14 6l-6 6 6 6" />
          </svg>
        </button>
        <nav id="admnav">{sidebarNav}</nav>
      </aside>

      <div className="backdrop" aria-hidden="true" onClick={onCloseDrawer} />

      <div className="adm-body">
        <main className="adm-main">
          <div className="in">{children}</div>
        </main>
      </div>
    </div>
  );
}
