"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import PostForm from "@/components/PostForm";
import TextSelector from "@/components/TextSelector";
import AnnotationEditor from "@/components/AnnotationEditor";
import YouTubeAudioPlayer from "@/components/YouTubeAudioPlayer";
import { getFontClass } from "@/lib/constants";
import { formatDate, formatReleaseDate } from "@/lib/dates";

const BottomDrawer = dynamic(() => import("@/components/BottomDrawer"), {
  ssr: false,
});

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
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  if (!post) return <div className="p-6 text-base">Loading...</div>;

  const fontClass = getFontClass(post.font);
  const activeAnnotation = annotations?.find((a) => a._id === activeAnnotationId) ?? null;

  function clearSelection() {
    setActiveAnnotationId(null);
    setPendingSelection(null);
    setEditing(false);
    setAnnotationTop(null);
    setConfirmingDelete(false);
  }

  function computeTop(rect: DOMRect) {
    if (!contentRef.current) return null;
    const contentRect = contentRef.current.getBoundingClientRect();
    return rect.top - contentRect.top - 20;
  }

  async function handleSaveAnnotation(html: string) {
    if (pendingSelection && post) {
      const newId = await createAnnotation({
        postId: post._id,
        startOffset: pendingSelection.start,
        endOffset: pendingSelection.end,
        anchorText: pendingSelection.text,
        body: html,
      });
      setPendingSelection(null);
      setActiveAnnotationId(newId);
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
          <div className="flex items-start gap-6 mb-6">
            {post.imageUrl && (
              <img
                src={post.imageUrl}
                alt=""
                className="w-28 h-28 rounded-lg object-cover shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-4xl font-bold tracking-tight">{post.title}</h1>
              <p className="text-lg text-black mt-1">
                {post.author}
                <span className="ml-2 inline-block text-xs font-medium border border-zinc-400 rounded-full px-2.5 py-0.5 align-middle">
                  {post.type}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setInfoOpen(!infoOpen)}
            className="text-sm text-black mb-6 flex items-center gap-1.5"
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform ${infoOpen ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            More information
          </button>
          {infoOpen ? (
            <div className="text-sm text-black space-y-1 mb-6 pl-5">
              {post.releasedAt && (
                <p>
                  <span className="font-medium">Released</span>{" "}
                  {formatReleaseDate(post.releasedAt)}
                </p>
              )}
              <p>
                <span className="font-medium">Added by Ben</span>{" "}
                {formatDate(post.createdAt)}
              </p>
            </div>
          ) : null}

          {post.youtubeUrl && (
            <div className="mb-6">
              <YouTubeAudioPlayer youtubeUrl={post.youtubeUrl} />
            </div>
          )}

          <hr className="border-zinc-300 mb-10" />
          <div
            ref={contentRef}
            className="relative grid grid-cols-1 md:grid-cols-[1fr_440px] gap-10"
          >
            <div>
              <TextSelector
                content={post.content}
                annotations={annotations ?? []}
                accentColor={post.accentColor}
                activeAnnotationId={activeAnnotationId ?? undefined}
                onAnnotationClick={(id, e) => {
                  if (editing) return;
                  setActiveAnnotationId(id);
                  setPendingSelection(null);
                  if (id && e) {
                    const markRect = (e.target as HTMLElement).getBoundingClientRect();
                    setAnnotationTop(computeTop(markRect));
                  } else {
                    setAnnotationTop(null);
                  }
                }}
                onSelect={(start, end, text, rect) => {
                  if (editing) return;
                  setPendingSelection({ start, end, text });
                  setActiveAnnotationId(null);
                  setEditing(true);
                  if (rect) setAnnotationTop(computeTop(rect));
                }}
                onClickOut={() => { if (!editing) clearSelection(); }}
                fontClass={fontClass}
                pendingRange={pendingSelection ?? undefined}
              />
            </div>

            <aside className="hidden md:block">
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
                          {confirmingDelete ? (
                            <>
                              <span className="text-sm text-red-600 font-medium">Delete?</span>
                              <button
                                onClick={async () => {
                                  await removeAnnotation({ id: activeAnnotation._id });
                                  clearSelection();
                                }}
                                className="text-sm text-red-600 font-medium underline"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setConfirmingDelete(false)}
                                className="text-sm text-black font-medium underline"
                              >
                                No
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setConfirmingDelete(true)}
                              className="text-sm text-black font-medium hover:text-red-600"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            </aside>
          </div>

          {/* Mobile drawer for viewing/deleting annotations */}
          <BottomDrawer
            annotation={activeAnnotation}
            accentColor={post.accentColor}
            onClose={clearSelection}
            actions={
              activeAnnotation ? (
                <div className="flex gap-4">
                  <button
                    onClick={() => setEditing(true)}
                    className="text-sm text-black font-medium hover:underline"
                  >
                    Edit
                  </button>
                  {confirmingDelete ? (
                    <>
                      <span className="text-sm text-red-600 font-medium">Delete?</span>
                      <button
                        onClick={async () => {
                          await removeAnnotation({ id: activeAnnotation._id });
                          clearSelection();
                        }}
                        className="text-sm text-red-600 font-medium underline"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmingDelete(false)}
                        className="text-sm text-black font-medium underline"
                      >
                        No
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmingDelete(true)}
                      className="text-sm text-black font-medium hover:text-red-600"
                    >
                      Delete
                    </button>
                  )}
                </div>
              ) : undefined
            }
          />
        </>
      )}
    </div>
  );
}
