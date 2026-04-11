"use client";

import { useRef, useCallback } from "react";
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
  fontClass,
}: {
  content: string;
  annotations: Doc<"annotations">[];
  accentColor: string;
  activeAnnotationId?: string;
  onAnnotationClick?: (id: string | null) => void;
  onSelect?: (start: number, end: number, text: string) => void;
  fontClass?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = useCallback(() => {
    if (!onSelect || !containerRef.current) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return;

    const range = sel.getRangeAt(0);
    if (!containerRef.current.contains(range.commonAncestorContainer)) return;

    const start = getTextOffset(
      containerRef.current,
      range.startContainer,
      range.startOffset
    );
    const end = getTextOffset(
      containerRef.current,
      range.endContainer,
      range.endOffset
    );

    if (start === end) return;

    const [lo, hi] = start < end ? [start, end] : [end, start];
    const text = content.slice(lo, hi);

    // Check for overlap with existing annotations
    const overlaps = annotations.some(
      (a) => lo < a.endOffset && hi > a.startOffset
    );
    if (overlaps) {
      alert("This selection overlaps an existing annotation. Remove it first.");
      sel.removeAllRanges();
      return;
    }

    onSelect(lo, hi, text);
    sel.removeAllRanges();
  }, [content, annotations, onSelect]);

  return (
    <div ref={containerRef} onMouseUp={handleMouseUp} className="select-text">
      <TextDisplay
        content={content}
        annotations={annotations}
        accentColor={accentColor}
        activeAnnotationId={activeAnnotationId}
        onAnnotationClick={onAnnotationClick}
        fontClass={fontClass}
      />
    </div>
  );
}
