"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import TextDisplay from "@/components/TextDisplay";
import AnnotationPanel from "@/components/AnnotationPanel";
import { getFontClass } from "@/lib/constants";
import { formatDate } from "@/lib/dates";

const BottomDrawer = dynamic(() => import("@/components/BottomDrawer"), {
  ssr: false,
});

export default function PostDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = useQuery(api.posts.getBySlug, { slug });
  const annotations = useQuery(
    api.annotations.getByPost,
    post ? { postId: post._id } : "skip"
  );
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);
  const [annotationTop, setAnnotationTop] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const activeAnnotation = annotations?.find((a) => a._id === activeAnnotationId) ?? null;

  const handleClose = useCallback(() => {
    setActiveAnnotationId(null);
    setAnnotationTop(null);
  }, []);

  const handleAnnotationClick = useCallback(
    (id: string | null, e?: React.MouseEvent) => {
      setActiveAnnotationId(id);
      if (id && e && contentRef.current) {
        const contentRect = contentRef.current.getBoundingClientRect();
        const markRect = (e.target as HTMLElement).getBoundingClientRect();
        setAnnotationTop(markRect.top - contentRect.top - 20);
      } else {
        setAnnotationTop(null);
      }
    },
    []
  );

  if (!post) {
    return (
      <div className="flex flex-1 items-center justify-center text-base text-black">
        Loading...
      </div>
    );
  }

  const fontClass = getFontClass(post.font);

  return (
    <div className="flex flex-col flex-1">
      <Header />
      <main className="max-w-4xl mx-auto w-full px-6 pt-10 pb-32">
        <div className="flex items-start gap-6 mb-10">
          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-28 h-28 rounded-lg object-cover shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold tracking-tight">{post.title}</h1>
                <p className="text-lg text-black mt-1">
                  {post.author}
                  <span className="ml-2 inline-block text-xs font-medium border border-zinc-400 rounded-full px-2.5 py-0.5 align-middle">
                    {post.type}
                  </span>
                </p>
              </div>
              <p className="text-sm text-black shrink-0 mt-2">
                {formatDate(post.createdAt)}
              </p>
            </div>
          </div>
        </div>
        <hr className="border-zinc-300 mb-10" />
        <div
          ref={contentRef}
          className="relative grid grid-cols-1 md:grid-cols-[1fr_320px] gap-8"
        >
          <div
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (target.tagName !== "MARK") {
                handleClose();
              }
            }}
          >
            <TextDisplay
              content={post.content}
              annotations={annotations ?? []}
              accentColor={post.accentColor}
              activeAnnotationId={activeAnnotationId ?? undefined}
              onAnnotationClick={handleAnnotationClick}
              fontClass={fontClass}
            />
          </div>
          {/* Desktop sidebar */}
          <aside className="hidden md:block">
            <div
              className="absolute right-0 w-[320px] pl-6"
              style={{
                top: annotationTop != null ? `${Math.max(0, annotationTop)}px` : "0px",
                opacity: activeAnnotation ? 1 : 0,
                pointerEvents: activeAnnotation ? "auto" : "none",
              }}
            >
              <AnnotationPanel annotation={activeAnnotation} />
            </div>
          </aside>
        </div>
      </main>

      {/* Mobile bottom drawer */}
      <BottomDrawer
        annotation={activeAnnotation}
        accentColor={post.accentColor}
        onClose={handleClose}
      />
    </div>
  );
}
