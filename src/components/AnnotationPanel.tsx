"use client";

import type { Doc } from "../../convex/_generated/dataModel";

export default function AnnotationPanel({
  annotation,
  caretOffset,
}: {
  annotation: Doc<"annotations"> | null;
  caretOffset?: number;
}) {
  if (!annotation) return null;

  return (
    <div
      className="annotation-card relative rounded-lg border border-zinc-400 p-5 space-y-3"
      style={caretOffset != null ? { "--caret-top": `${caretOffset}px` } as React.CSSProperties : undefined}
    >
      <p className="text-sm font-semibold text-black">Annotation</p>
      <div
        className="text-base text-black leading-relaxed annotation-body"
        dangerouslySetInnerHTML={{ __html: annotation.body }}
      />
    </div>
  );
}
