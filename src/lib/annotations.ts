export type Range = { start: number; end: number };

export function rangesOverlap(a: Range, b: Range): boolean {
  return a.start < b.end && a.end > b.start;
}

/** Concatenates text slices from sorted ranges with a newline separator. */
export function anchorTextFromRanges(content: string, ranges: Range[]): string {
  return ranges
    .slice()
    .sort((a, b) => a.start - b.start)
    .map((r) => content.slice(r.start, r.end))
    .join("\n");
}
