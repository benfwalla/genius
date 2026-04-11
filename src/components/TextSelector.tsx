"use client";

import { useRef, useCallback, useEffect } from "react";
import type { Doc } from "../../convex/_generated/dataModel";
import TextDisplay from "./TextDisplay";

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
  pendingRange,
}: {
  content: string;
  annotations: Doc<"annotations">[];
  accentColor: string;
  activeAnnotationId?: string;
  onAnnotationClick?: (id: string | null, e?: React.MouseEvent) => void;
  onSelect?: (start: number, end: number, text: string, e?: MouseEvent) => void;
  onClickOut?: () => void;
  fontClass?: string;
  pendingRange?: { start: number; end: number };
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const justSelectedRef = useRef(false);

  const handleSelection = useCallback((mouseEvent?: MouseEvent) => {
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

    const text = content.slice(clampedLo, clampedHi);

    const overlaps = annotations.some(
      (a) => clampedLo < a.endOffset && clampedHi > a.startOffset
    );
    if (overlaps) {
      alert("This selection overlaps an existing annotation. Remove it first.");
      sel.removeAllRanges();
      return;
    }

    justSelectedRef.current = true;
    onSelect(clampedLo, clampedHi, text, mouseEvent);
    sel.removeAllRanges();
  }, [content, annotations, onSelect]);

  useEffect(() => {
    function onMouseUp(e: MouseEvent) {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        handleSelection(e);
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
        pendingRange={pendingRange}
      />
    </div>
  );
}
