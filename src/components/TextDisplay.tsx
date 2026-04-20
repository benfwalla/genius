"use client";

import { useMemo } from "react";
import type { Doc } from "../../convex/_generated/dataModel";
import type { Range } from "@/lib/annotations";

type Annotation = Doc<"annotations">;

interface Segment {
  text: string;
  annotation?: Annotation;
  isPending?: boolean;
  offset: number;
  rangeStart: number;
}

function buildSegments(
  content: string,
  annotations: Annotation[],
  pendingRanges: Range[]
): Segment[] {
  const ranges: {
    start: number;
    end: number;
    annotation?: Annotation;
    isPending?: boolean;
  }[] = [];

  for (const a of annotations) {
    for (const r of a.ranges) {
      ranges.push({ start: r.start, end: r.end, annotation: a });
    }
  }
  for (const r of pendingRanges) {
    ranges.push({ start: r.start, end: r.end, isPending: true });
  }
  ranges.sort((a, b) => a.start - b.start);

  const segments: Segment[] = [];
  let cursor = 0;

  for (const range of ranges) {
    if (range.start > cursor) {
      segments.push({
        text: content.slice(cursor, range.start),
        offset: cursor,
        rangeStart: cursor,
      });
    }
    segments.push({
      text: content.slice(range.start, range.end),
      annotation: range.annotation,
      isPending: range.isPending,
      offset: range.start,
      rangeStart: range.start,
    });
    cursor = range.end;
  }

  if (cursor < content.length) {
    segments.push({
      text: content.slice(cursor),
      offset: cursor,
      rangeStart: cursor,
    });
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
  pendingRanges,
}: {
  content: string;
  annotations: Annotation[];
  accentColor: string;
  activeAnnotationId?: string;
  onAnnotationClick?: (id: string | null, e?: React.MouseEvent) => void;
  fontClass?: string;
  pendingRanges?: Range[];
}) {
  const segments = useMemo(
    () => buildSegments(content, annotations, pendingRanges ?? []),
    [content, annotations, pendingRanges]
  );

  return (
    <div className={`whitespace-pre-wrap leading-relaxed text-lg text-black ${fontClass ?? ""}`}>
      {segments.map((seg, i) =>
        seg.isPending ? (
          <mark key={i} style={{ backgroundColor: accentColor }}>{seg.text}</mark>
        ) : seg.annotation ? (
          <mark
            key={i}
            data-annotation-id={seg.annotation._id}
            data-range-start={seg.rangeStart}
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
