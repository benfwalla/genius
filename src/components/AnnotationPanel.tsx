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
        className="prose prose-base prose-black max-w-none leading-relaxed"
        dangerouslySetInnerHTML={{ __html: annotation.body }}
      />
    </div>
  );
}
