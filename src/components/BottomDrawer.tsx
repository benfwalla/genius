"use client";

import { useEffect, useCallback, type ReactNode } from "react";
import type { Doc } from "../../convex/_generated/dataModel";

export default function BottomDrawer({
  annotation,
  accentColor,
  onClose,
  actions,
}: {
  annotation: Doc<"annotations"> | null;
  accentColor: string;
  onClose: () => void;
  actions?: ReactNode;
}) {
  const isOpen = annotation !== null;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);

    // Only lock body scroll when the drawer is actually visible (below md breakpoint)
    const mq = window.matchMedia("(max-width: 767px)");
    if (mq.matches) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-200 md:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out md:hidden ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ maxHeight: "70vh" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-zinc-300" />
        </div>

        <div className="overflow-y-auto px-6 pb-8 pt-2" style={{ maxHeight: "calc(70vh - 2rem)" }}>
          {annotation ? (
            <>
              {/* Highlighted anchor text */}
              <p className="text-base leading-relaxed text-black">
                <mark
                  style={{ backgroundColor: accentColor }}
                  className="cursor-default"
                >
                  {annotation.anchorText}
                </mark>
              </p>

              <hr className="border-zinc-300 my-4" />

              {/* Annotation body */}
              <div
                className="text-base text-black leading-relaxed annotation-body"
                dangerouslySetInnerHTML={{ __html: annotation.body }}
              />

              {actions && (
                <div className="mt-4 pt-4 border-t border-zinc-300">
                  {actions}
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
