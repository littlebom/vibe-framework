export const PALETTE_IDS = ["blue", "coral", "pink", "green", "purple"] as const;
export type PaletteId = (typeof PALETTE_IDS)[number];
export const DEFAULT_PALETTE: PaletteId = "blue";

export const PALETTES: Record<PaletteId, { swatch: string; labelKey: string }> = {
  blue: { swatch: "#0556CA", labelKey: "palette.blue" },
  coral: { swatch: "#F06A4F", labelKey: "palette.coral" },
  pink: { swatch: "#C2185B", labelKey: "palette.pink" },
  green: { swatch: "#0F7A5A", labelKey: "palette.green" },
  purple: { swatch: "#6D28D9", labelKey: "palette.purple" },
};

export function isPalette(v: unknown): v is PaletteId {
  return typeof v === "string" && (PALETTE_IDS as readonly string[]).includes(v);
}
