"use client";

import type { Doc } from "../../convex/_generated/dataModel";

export default function AnnotationPanel({
  annotation,
  onClose,
}: {
  annotation: Doc<"annotations"> | null;
  onClose?: () => void;
}) {
  if (!annotation) {
    return (
      <div className="text-sm text-zinc-400 italic">
        Click a highlighted passage to see the annotation.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
          Annotation
        </p>
        {onClose && (
          <button
            onClick={onClose}
            className="text-xs text-zinc-400 hover:text-zinc-600"
          >
            &times;
          </button>
        )}
      </div>
      <blockquote className="text-xs text-zinc-500 border-l-2 border-zinc-200 pl-3 italic">
        &ldquo;{annotation.anchorText}&rdquo;
      </blockquote>
      <div
        className="prose prose-sm prose-zinc max-w-none text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: annotation.body }}
      />
    </div>
  );
}
