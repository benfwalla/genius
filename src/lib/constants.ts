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
