"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import PostForm from "@/components/PostForm";
import TextSelector from "@/components/TextSelector";
import AnnotationEditor from "@/components/AnnotationEditor";
import YouTubeAudioPlayer, { type YouTubeAudioPlayerHandle } from "@/components/YouTubeAudioPlayer";
import { getFontClass, POST_LAYOUT, computeCardPosition } from "@/lib/constants";
import { anchorTextFromRanges, type Range } from "@/lib/annotations";
import { formatDate, formatReleaseDate } from "@/lib/dates";
import { FaPlay, FaPause, FaChevronRight } from "react-icons/fa";

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
  const [pendingRanges, setPendingRanges] = useState<Range[]>([]);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<"annotate" | "edit">("annotate");
  const [annotationTop, setAnnotationTop] = useState<number | null>(null);
  const [caretOffset, setCaretOffset] = useState(40);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubeAudioPlayerHandle>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setHeaderScrolled(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-64px 0px 0px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [!!post]);

  useEffect(() => {
    if (post?.title) document.title = `${post.title} - ${post.author} | genius.ben-mini`;
  }, [post?.title, post?.author]);

  if (!post) return null;

  const fontClass = getFontClass(post.font);
  const activeAnnotation = annotations?.find((a) => a._id === activeAnnotationId) ?? null;

  function clearSelection() {
    setActiveAnnotationId(null);
    setPendingRanges([]);
    setEditing(false);
    setAnnotationTop(null);
    setConfirmingDelete(false);
  }

  function computeTop(rect: DOMRect) {
    if (!contentRef.current) return null;
    const pos = computeCardPosition(rect, contentRef.current.getBoundingClientRect());
    setCaretOffset(pos.caretOffset);
    return pos.cardTop;
  }

  async function handleSaveAnnotation(html: string) {
    if (pendingRanges.length > 0 && post) {
      const newId = await createAnnotation({
        postId: post._id,
        ranges: pendingRanges,
        anchorText: anchorTextFromRanges(post.content, pendingRanges),
        body: html,
      });
      setPendingRanges([]);
      setActiveAnnotationId(newId);
    } else if (activeAnnotation) {
      await updateAnnotation({ id: activeAnnotation._id, body: html });
    }
    setEditing(false);
  }

  const showSidebar = (pendingRanges.length > 0 && editing) || activeAnnotation;

  return (
    <>
      {headerScrolled && (
        <div className="sticky top-0 z-30 bg-white border-b border-zinc-300 px-4 md:px-6 py-3">
          <div className="flex items-center gap-3 max-w-5xl mx-auto">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="text-sm font-semibold text-black truncate cursor-pointer min-w-0"
            >
              {post.title} – {post.author}
            </button>
            {post.youtubeUrl && (
              <button
                type="button"
                onClick={() => playerRef.current?.togglePlay()}
                className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-black text-white cursor-pointer"
                aria-label="Play/Pause"
              >
                {isPlaying ? <FaPause size={9} /> : <FaPlay size={9} className="ml-px" />}
              </button>
            )}
          </div>
        </div>
      )}
      <div className={`${POST_LAYOUT.container} py-10`}>
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
            className="text-sm text-black mb-6 flex items-center gap-1.5 cursor-pointer"
          >
            <FaChevronRight className={`w-2.5 h-2.5 transition-transform ${infoOpen ? "rotate-90" : ""}`} />
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
            <div className={POST_LAYOUT.playerSection}>
              <YouTubeAudioPlayer ref={playerRef} youtubeUrl={post.youtubeUrl} onPlayingChange={setIsPlaying} />
            </div>
          )}

          <div ref={sentinelRef} />
          <hr className="border-zinc-300 mb-10" />
          <div
            ref={contentRef}
            className={POST_LAYOUT.grid}
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
                  setPendingRanges([]);
                  if (id && e) {
                    const markRect = (e.target as HTMLElement).getBoundingClientRect();
                    setAnnotationTop(computeTop(markRect));
                  } else {
                    setAnnotationTop(null);
                  }
                }}
                onSelect={(range, append, rect) => {
                  if (editing && !append) return;
                  setActiveAnnotationId(null);
                  setPendingRanges((prev) => (append ? [...prev, range] : [range]));
                  setEditing(true);
                  if (rect) setAnnotationTop(computeTop(rect));
                }}
                onClickOut={() => { if (!editing) clearSelection(); }}
                fontClass={fontClass}
                pendingRanges={pendingRanges}
              />
            </div>

            <aside className="hidden md:block">
              <div
                className={POST_LAYOUT.sidebarPosition}
                style={{
                  top: annotationTop != null ? `${Math.max(0, annotationTop)}px` : "0px",
                  opacity: showSidebar ? 1 : 0,
                  pointerEvents: showSidebar ? "auto" : "none",
                }}
              >
                {pendingRanges.length > 0 && editing ? (
                  <div className="annotation-card relative rounded-lg border border-zinc-400 p-5 space-y-3" style={{ "--caret-top": `${caretOffset}px` } as React.CSSProperties}>
                    <p className="text-sm font-semibold text-black">
                      New annotation
                      {pendingRanges.length > 1 && (
                        <span className="ml-2 text-xs font-normal text-black">
                          ({pendingRanges.length} selections — ⌘+drag to add more)
                        </span>
                      )}
                    </p>
                    <AnnotationEditor
                      onSave={handleSaveAnnotation}
                      onCancel={() => {
                        setPendingRanges([]);
                        setEditing(false);
                        setAnnotationTop(null);
                      }}
                    />
                  </div>
                ) : activeAnnotation ? (
                  <div className="annotation-card relative rounded-lg border border-zinc-400 p-5 space-y-3" style={{ "--caret-top": `${caretOffset}px` } as React.CSSProperties}>
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
                          className="text-base text-black leading-relaxed annotation-body"
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
    </>
  );
}
