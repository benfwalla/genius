"use client";

import type { Doc } from "../../convex/_generated/dataModel";

type Annotation = Doc<"annotations">;

interface Segment {
  text: string;
  annotation?: Annotation;
  offset: number;
}

function buildSegments(
  content: string,
  annotations: Annotation[]
): Segment[] {
  const sorted = [...annotations].sort(
    (a, b) => a.startOffset - b.startOffset
  );
  const segments: Segment[] = [];
  let cursor = 0;

  for (const ann of sorted) {
    if (ann.startOffset > cursor) {
      segments.push({
        text: content.slice(cursor, ann.startOffset),
        offset: cursor,
      });
    }
    segments.push({
      text: content.slice(ann.startOffset, ann.endOffset),
      annotation: ann,
      offset: ann.startOffset,
    });
    cursor = ann.endOffset;
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
}: {
  content: string;
  annotations: Annotation[];
  accentColor: string;
  activeAnnotationId?: string;
  onAnnotationClick?: (id: string | null) => void;
  fontClass?: string;
}) {
  const segments = buildSegments(content, annotations);

  return (
    <div
      className={`whitespace-pre-wrap leading-relaxed text-base ${fontClass ?? ""}`}
    >
      {segments.map((seg, i) =>
        seg.annotation ? (
          <mark
            key={i}
            style={{
              backgroundColor:
                activeAnnotationId === seg.annotation._id
                  ? accentColor
                  : `${accentColor}80`,
            }}
            onClick={() =>
              onAnnotationClick?.(
                activeAnnotationId === seg.annotation!._id
                  ? null
                  : seg.annotation!._id
              )
            }
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
