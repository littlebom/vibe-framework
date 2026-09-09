"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils";

/**
 * ชุดควบคุมฟอร์มของ Liyon (`.field` / `.selw` / `.sw-toggle` ใน liyon-shell.css)
 * primitive ตัวที่ห้าของ shared/components/liyon — props-only, ไม่ผูกกับฟีเจอร์ไหน
 * ใช้แทนช่องกรอก/ตัวเลือก/สวิตช์ของ shadcn ในหน้า admin ที่รื้อ markup ตาม Liyon
 */

// ── .field — ช่องกรอกมีป้ายกำกับ ─────────────────────────────────────────
export interface LiyonFieldProps {
  label?: React.ReactNode;
  htmlFor?: string;
  hint?: string;
  error?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function LiyonField({ label, htmlFor, hint, error, icon, children, className }: LiyonFieldProps) {
  return (
    <div className={cn("field", className)}>
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {icon ? (
        <span className="wrap">
          {icon}
          {children}
        </span>
      ) : (
        children
      )}
      {error ? <span className="err">{error}</span> : hint ? <span className="hint">{hint}</span> : null}
    </div>
  );
}

// ── .selw — <select> ของเบราว์เซอร์ วาดลูกศรเองผ่าน mask ─────────────────
export type LiyonSelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const LiyonSelect = React.forwardRef<HTMLSelectElement, LiyonSelectProps>(function LiyonSelect(
  { className, children, ...props },
  ref,
) {
  return (
    <span className="selw">
      <select ref={ref} className={className} {...props}>
        {children}
      </select>
    </span>
  );
});

// ── .sw-toggle — <input type=checkbox role=switch> ───────────────────────
export interface LiyonSwitchProps {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
  className?: string;
}

export function LiyonSwitch({ id, checked, onCheckedChange, disabled, className, ...aria }: LiyonSwitchProps) {
  return (
    <input
      id={id}
      type="checkbox"
      role="switch"
      className={cn("sw-toggle", className)}
      checked={checked}
      disabled={disabled}
      onChange={(e) => onCheckedChange(e.target.checked)}
      {...aria}
    />
  );
}

// ── .sw-row — แถวสวิตช์ในกรอบ: สวิตช์ซ้าย คำอธิบายขวา ─────────────────────
export interface LiyonSwitchRowProps {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  label: React.ReactNode;
  description?: React.ReactNode;
}

export function LiyonSwitchRow({ id, checked, onCheckedChange, disabled, label, description }: LiyonSwitchRowProps) {
  return (
    <div className="sw-row">
      <LiyonSwitch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
      <div>
        <label htmlFor={id}>{label}</label>
        {description && <p>{description}</p>}
      </div>
    </div>
  );
}
