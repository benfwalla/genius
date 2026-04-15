"use client";

import type { Doc } from "../../convex/_generated/dataModel";

export default function AnnotationPanel({
  annotation,
}: {
  annotation: Doc<"annotations"> | null;
}) {
  if (!annotation) return null;

  return (
    <div className="rounded-lg border border-zinc-300 p-5 space-y-3">
      <p className="text-sm font-semibold text-black">Annotation</p>
      <div
        className="text-base text-black leading-relaxed annotation-body"
        dangerouslySetInnerHTML={{ __html: annotation.body }}
      />
    </div>
  );
}
