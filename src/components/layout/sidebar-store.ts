import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Sidebar UI state — persisted to localStorage.
 *
 * Pattern adapted from Dashcode's `useConfig()` (Jotai atomWithStorage),
 * rebuilt with Zustand to match U-LMS's existing state library.
 *
 * State surface:
 *  - collapsed   : sidebar is collapsed to icons-only (desktop)
 *  - openGroup   : which menu group is currently expanded (accordion-style;
 *                  null when none, persisted so the same group is open
 *                  after reload)
 */

interface SidebarState {
  collapsed: boolean;
  openGroup: string | null;

  toggleCollapsed: () => void;
  setCollapsed: (collapsed: boolean) => void;
  setOpenGroup: (href: string | null) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      collapsed: false,
      openGroup: null,

      toggleCollapsed: () =>
        set((s) => ({ collapsed: !s.collapsed })),
      setCollapsed: (collapsed) => set({ collapsed }),
      setOpenGroup: (href) => set({ openGroup: href }),
    }),
    {
      name: "sidebar-state",
      // Only persist these keys — exclude action functions
      partialize: (s) => ({
        collapsed: s.collapsed,
        openGroup: s.openGroup,
      }),
    },
  ),
);
