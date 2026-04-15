export const FONTS = [
  { id: "playfair", name: "Playfair Display", className: "font-playfair" },
  { id: "dm-sans", name: "DM Sans", className: "font-dm" },
  { id: "space-grotesk", name: "Space Grotesk", className: "font-space" },
] as const;

export const ACCENT_COLORS = [
  { hex: "#FFFF00", name: "Genius Yellow" },
  { hex: "#FFD700", name: "Gold" },
  { hex: "#FF6B6B", name: "Coral" },
  { hex: "#FF69B4", name: "Hot Pink" },
  { hex: "#98FB98", name: "Mint" },
  { hex: "#87CEEB", name: "Sky" },
  { hex: "#DDA0DD", name: "Plum" },
  { hex: "#FFA07A", name: "Salmon" },
  { hex: "#90EE90", name: "Light Green" },
  { hex: "#B0E0E6", name: "Powder Blue" },
] as const;

export const POST_TYPES = [
  "lyrics",
  "poem",
  "quote",
  "passage",
  "other",
] as const;

export type FontId = (typeof FONTS)[number]["id"];
export type PostType = (typeof POST_TYPES)[number];

export function getFontClass(fontId: string): string {
  return FONTS.find((f) => f.id === fontId)?.className ?? "";
}

/** Shared layout values for public and admin post pages (keep in sync). */
export const POST_LAYOUT = {
  container: "max-w-5xl mx-auto px-6",
  grid: "relative grid grid-cols-1 md:grid-cols-[1fr_440px] gap-10",
  sidebarPosition: "absolute right-0 w-[440px] pl-8",
  playerSection: "mb-6 max-w-md",
  cardTopOffset: 40,
} as const;

/** Compute annotation card position and caret offset from a mark element. */
export function computeCardPosition(markRect: DOMRect, contentRect: DOMRect) {
  const cardTop = markRect.top - contentRect.top - POST_LAYOUT.cardTopOffset;
  const markCenter = markRect.top + markRect.height / 2 - contentRect.top;
  return { cardTop, caretOffset: markCenter - cardTop };
}
