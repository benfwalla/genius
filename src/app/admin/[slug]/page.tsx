"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState, useRef } from "react";
import PostForm from "@/components/PostForm";
import TextSelector from "@/components/TextSelector";
import AnnotationEditor from "@/components/AnnotationEditor";
import { getFontClass } from "@/lib/constants";
import { formatDate } from "@/lib/dates";

export default function AdminEditPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = useQuery(api.posts.getBySlug, { slug });
  const annotations = useQuery(
    api.annotations.getByPost,
    post ? { postId: post._id } : "skip"
  );
  const createAnnotation = useMutation(api.annotations.create);
  const updateAnnotation = useMutation(api.annotations.update);
  const removeAnnotation = useMutation(api.annotations.remove);

  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);
  const [pendingSelection, setPendingSelection] = useState<{
    start: number;
    end: number;
    text: string;
  } | null>(null);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<"annotate" | "edit">("annotate");
  const [annotationTop, setAnnotationTop] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  if (!post) return <div className="p-6 text-base">Loading...</div>;

  const fontClass = getFontClass(post.font);
  const activeAnnotation = annotations?.find((a) => a._id === activeAnnotationId) ?? null;

  function clearSelection() {
    setActiveAnnotationId(null);
    setPendingSelection(null);
    setEditing(false);
    setAnnotationTop(null);
  }

  function computeTop(rect: DOMRect) {
    if (!contentRef.current) return null;
    const contentRect = contentRef.current.getBoundingClientRect();
    return rect.top - contentRect.top - 20;
  }

  async function handleSaveAnnotation(html: string) {
    if (pendingSelection && post) {
      await createAnnotation({
        postId: post._id,
        startOffset: pendingSelection.start,
        endOffset: pendingSelection.end,
        anchorText: pendingSelection.text,
        body: html,
      });
      setPendingSelection(null);
    } else if (activeAnnotation) {
      await updateAnnotation({ id: activeAnnotation._id, body: html });
    }
    setEditing(false);
  }

  const showSidebar = (pendingSelection && editing) || activeAnnotation;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex gap-3 mb-8">
        <button
          onClick={() => setTab("annotate")}
          className={`px-5 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
            tab === "annotate"
              ? "bg-black text-white border-black"
              : "text-black border-zinc-400 hover:border-black"
          }`}
        >
          Annotate
        </button>
        <button
          onClick={() => setTab("edit")}
          className={`px-5 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
            tab === "edit"
              ? "bg-black text-white border-black"
              : "text-black border-zinc-400 hover:border-black"
          }`}
        >
          Edit details
        </button>
      </div>

      {tab === "edit" ? (
        <PostForm post={post} />
      ) : (
        <>
          <div className="flex items-start gap-6 mb-10">
            {post.imageUrl && (
              <img
                src={post.imageUrl}
                alt=""
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
            className="relative grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-10"
          >
            <div>
              <TextSelector
                content={post.content}
                annotations={annotations ?? []}
                accentColor={post.accentColor}
                activeAnnotationId={activeAnnotationId ?? undefined}
                onAnnotationClick={(id, e) => {
                  setActiveAnnotationId(id);
                  setPendingSelection(null);
                  setEditing(false);
                  if (id && e) {
                    const markRect = (e.target as HTMLElement).getBoundingClientRect();
                    setAnnotationTop(computeTop(markRect));
                  } else {
                    setAnnotationTop(null);
                  }
                }}
                onSelect={(start, end, text, rect) => {
                  setPendingSelection({ start, end, text });
                  setActiveAnnotationId(null);
                  setEditing(true);
                  if (rect) setAnnotationTop(computeTop(rect));
                }}
                onClickOut={clearSelection}
                fontClass={fontClass}
                pendingRange={pendingSelection ?? undefined}
              />
            </div>

            <aside className="hidden lg:block">
              <div
                className="absolute right-0 w-[440px] pl-8"
                style={{
                  top: annotationTop != null ? `${Math.max(0, annotationTop)}px` : "0px",
                  opacity: showSidebar ? 1 : 0,
                  pointerEvents: showSidebar ? "auto" : "none",
                }}
              >
                {pendingSelection && editing ? (
                  <div className="rounded-lg border border-zinc-300 p-5 space-y-3">
                    <p className="text-sm font-semibold text-black">New annotation</p>
                    <AnnotationEditor
                      onSave={handleSaveAnnotation}
                      onCancel={() => {
                        setPendingSelection(null);
                        setEditing(false);
                        setAnnotationTop(null);
                      }}
                    />
                  </div>
                ) : activeAnnotation ? (
                  <div className="rounded-lg border border-zinc-300 p-5 space-y-3">
                    <p className="text-sm font-semibold text-black">Annotation</p>
                    {editing ? (
                      <AnnotationEditor
                        key={activeAnnotation._id}
                        initialHtml={activeAnnotation.body}
                        onSave={handleSaveAnnotation}
                        onCancel={() => setEditing(false)}
                      />
                    ) : (
                      <>
                        <div
                          className="prose prose-base prose-black max-w-none leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: activeAnnotation.body }}
                        />
                        <div className="flex gap-4 pt-2">
                          <button
                            onClick={() => setEditing(true)}
                            className="text-sm text-black font-medium hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm("Delete this annotation?")) {
                                await removeAnnotation({ id: activeAnnotation._id });
                                setActiveAnnotationId(null);
                                setAnnotationTop(null);
                              }
                            }}
                            className="text-sm text-black font-medium hover:text-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
