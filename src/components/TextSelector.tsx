"use client";

import { useRef, useCallback, useEffect } from "react";
import type { Doc } from "../../convex/_generated/dataModel";
import TextDisplay from "./TextDisplay";
import { rangesOverlap, type Range } from "@/lib/annotations";

function getTextOffset(container: HTMLElement, node: Node, offset: number): number {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let total = 0;
  let current = walker.nextNode();
  while (current) {
    if (current === node) return total + offset;
    total += current.textContent?.length ?? 0;
    current = walker.nextNode();
  }
  return total + offset;
}

export default function TextSelector({
  content,
  annotations,
  accentColor,
  activeAnnotationId,
  onAnnotationClick,
  onSelect,
  onClickOut,
  fontClass,
  pendingRanges,
}: {
  content: string;
  annotations: Doc<"annotations">[];
  accentColor: string;
  activeAnnotationId?: string;
  onAnnotationClick?: (id: string | null, e?: React.MouseEvent) => void;
  onSelect?: (range: Range, append: boolean, rect?: DOMRect) => void;
  onClickOut?: () => void;
  fontClass?: string;
  pendingRanges?: Range[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const justSelectedRef = useRef(false);
  // Read pendingRanges via ref so the mouseup listener doesn't re-subscribe on every append.
  const pendingRangesRef = useRef(pendingRanges);
  pendingRangesRef.current = pendingRanges;

  const handleSelection = useCallback(
    (append: boolean) => {
      if (!onSelect || !containerRef.current) return;
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) return;

      const range = sel.getRangeAt(0);
      if (
        !containerRef.current.contains(range.startContainer) &&
        !containerRef.current.contains(range.endContainer)
      ) return;

      const start = getTextOffset(containerRef.current, range.startContainer, range.startOffset);
      const end = getTextOffset(containerRef.current, range.endContainer, range.endOffset);

      if (start === end) return;

      const [lo, hi] = start < end ? [start, end] : [end, start];
      const clampedLo = Math.max(0, lo);
      const clampedHi = Math.min(content.length, hi);
      if (clampedLo >= clampedHi) return;

      const newRange: Range = { start: clampedLo, end: clampedHi };

      const overlapsAnnotation = annotations.some((a) =>
        a.ranges.some((r) => rangesOverlap(r, newRange))
      );
      const overlapsPending =
        append && (pendingRangesRef.current ?? []).some((r) => rangesOverlap(r, newRange));
      if (overlapsAnnotation || overlapsPending) {
        alert("This selection overlaps an existing annotation. Remove it first.");
        sel.removeAllRanges();
        return;
      }

      const rangeRect = range.getBoundingClientRect();
      justSelectedRef.current = true;
      onSelect(newRange, append, rangeRect);
      sel.removeAllRanges();
    },
    [content, annotations, onSelect]
  );

  useEffect(() => {
    function onMouseUp(e: MouseEvent) {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        const append = e.metaKey || e.ctrlKey;
        handleSelection(append);
      }
    }
    document.addEventListener("mouseup", onMouseUp);
    return () => document.removeEventListener("mouseup", onMouseUp);
  }, [handleSelection]);

  const handleMouseDown = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (justSelectedRef.current) {
        justSelectedRef.current = false;
        return;
      }
      const target = e.target as HTMLElement;
      if (target.tagName !== "MARK" && onClickOut) {
        onClickOut();
      }
    },
    [onClickOut]
  );

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      className="select-text"
      style={{ "--selection-color": accentColor } as React.CSSProperties}
    >
      <TextDisplay
        content={content}
        annotations={annotations}
        accentColor={accentColor}
        activeAnnotationId={activeAnnotationId}
        onAnnotationClick={onAnnotationClick}
        fontClass={fontClass}
        pendingRanges={pendingRanges}
      />
    </div>
  );
}
