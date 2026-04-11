"use client";

import { useMemo } from "react";
import type { Doc } from "../../convex/_generated/dataModel";

type Annotation = Doc<"annotations">;

interface Segment {
  text: string;
  annotation?: Annotation;
  isPending?: boolean;
  offset: number;
}

function buildSegments(
  content: string,
  annotations: Annotation[],
  pendingStart?: number,
  pendingEnd?: number
): Segment[] {
  const ranges: {
    start: number;
    end: number;
    annotation?: Annotation;
    isPending?: boolean;
  }[] = [
    ...annotations.map((a) => ({
      start: a.startOffset,
      end: a.endOffset,
      annotation: a,
    })),
    ...(pendingStart != null && pendingEnd != null
      ? [{ start: pendingStart, end: pendingEnd, isPending: true }]
      : []),
  ].sort((a, b) => a.start - b.start);

  const segments: Segment[] = [];
  let cursor = 0;

  for (const range of ranges) {
    if (range.start > cursor) {
      segments.push({ text: content.slice(cursor, range.start), offset: cursor });
    }
    segments.push({
      text: content.slice(range.start, range.end),
      annotation: range.annotation,
      isPending: range.isPending,
      offset: range.start,
    });
    cursor = range.end;
  }

  if (cursor < content.length) {
    segments.push({ text: content.slice(cursor), offset: cursor });
  }

  return segments;
}

export default function TextDisplay({
  content,
  annotations,
  accentColor,
  activeAnnotationId,
  onAnnotationClick,
  fontClass,
  pendingRange,
}: {
  content: string;
  annotations: Annotation[];
  accentColor: string;
  activeAnnotationId?: string;
  onAnnotationClick?: (id: string | null, e?: React.MouseEvent) => void;
  fontClass?: string;
  pendingRange?: { start: number; end: number };
}) {
  const segments = useMemo(
    () => buildSegments(content, annotations, pendingRange?.start, pendingRange?.end),
    [content, annotations, pendingRange?.start, pendingRange?.end]
  );

  return (
    <div className={`whitespace-pre-wrap leading-relaxed text-base text-black ${fontClass ?? ""}`}>
      {segments.map((seg, i) =>
        seg.isPending ? (
          <mark key={i} style={{ backgroundColor: accentColor }}>{seg.text}</mark>
        ) : seg.annotation ? (
          <mark
            key={i}
            style={{
              backgroundColor: activeAnnotationId === seg.annotation._id
                ? accentColor
                : `${accentColor}80`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onAnnotationClick?.(seg.annotation!._id, e);
            }}
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </div>
  );
}
