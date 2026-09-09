"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/shared/lib/utils";
import { LOCALES, type Locale } from "@/shared/lib/i18n/config";
import { useLocale } from "@/shared/lib/i18n/client";
import { setLocaleAction } from "@/features/identity/actions";
import { Button } from "@/components/ui/button";

/**
 * Minimal locale toggle — a single ghost button showing the language you'll
 * switch TO (e.g. shows "EN" while the UI is in Thai). Clicking cycles to the
 * next locale, writes the cookie (and users.locale ถ้า login อยู่), then
 * refreshes so Server Components re-read it and the whole tree re-renders in
 * the new language.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Next locale in the list (wraps around) — the one this button switches to.
  const target: Locale = LOCALES[(LOCALES.indexOf(locale) + 1) % LOCALES.length];

  const change = () => {
    if (pending) return;
    startTransition(async () => {
      await setLocaleAction(target);
      router.refresh();
    });
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={change}
      disabled={pending}
      aria-label={`Switch language to ${target.toUpperCase()}`}
      title={`Switch language to ${target.toUpperCase()}`}
      className={cn("text-xs font-semibold uppercase disabled:opacity-60", className)}
    >
      {target}
    </Button>
  );
}
