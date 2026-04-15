"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import TextDisplay from "@/components/TextDisplay";
import AnnotationPanel from "@/components/AnnotationPanel";
import YouTubeAudioPlayer, { type YouTubeAudioPlayerHandle } from "@/components/YouTubeAudioPlayer";
import { getFontClass, POST_LAYOUT, computeCardPosition } from "@/lib/constants";
import { formatDate, formatReleaseDate } from "@/lib/dates";
import { FaPlay, FaPause, FaChevronRight } from "react-icons/fa";

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
  const [caretOffset, setCaretOffset] = useState(40);
  const [infoOpen, setInfoOpen] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubeAudioPlayerHandle>(null);

  const activeAnnotation = annotations?.find((a) => a._id === activeAnnotationId) ?? null;

  const handleClose = useCallback(() => {
    setActiveAnnotationId(null);
    setAnnotationTop(null);
    history.replaceState(null, "", window.location.pathname);
  }, []);

  const annotationsRef = useRef(annotations);
  annotationsRef.current = annotations;

  const handleAnnotationClick = useCallback(
    (id: string | null, e?: React.MouseEvent) => {
      setActiveAnnotationId(id);
      if (id && e && contentRef.current) {
        const pos = computeCardPosition(
          (e.target as HTMLElement).getBoundingClientRect(),
          contentRef.current.getBoundingClientRect()
        );
        setAnnotationTop(pos.cardTop);
        setCaretOffset(pos.caretOffset);
        const ann = annotationsRef.current?.find((a) => a._id === id);
        if (ann) history.replaceState(null, "", `#${ann.startOffset}`);
      } else {
        setAnnotationTop(null);
        history.replaceState(null, "", window.location.pathname);
      }
    },
    []
  );

  // Restore annotation from URL hash on load
  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current || !annotations?.length) return;
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const offset = Number(hash);
    if (Number.isNaN(offset)) return;
    const match = annotations.find((a) => a.startOffset === offset);
    if (!match) return;
    restoredRef.current = true;
    requestAnimationFrame(() => {
      const mark = document.querySelector(`[data-annotation-id="${match._id}"]`);
      if (mark && contentRef.current) {
        mark.scrollIntoView({ behavior: "smooth", block: "center" });
        const pos = computeCardPosition(
          mark.getBoundingClientRect(),
          contentRef.current.getBoundingClientRect()
        );
        setActiveAnnotationId(match._id);
        setAnnotationTop(pos.cardTop);
        setCaretOffset(pos.caretOffset);
      }
    });
  }, [annotations]);

  useEffect(() => {
    if (post?.title) document.title = `${post.title} - ${post.author} | genius.ben-mini`;
  }, [post?.title, post?.author]);

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

  if (!post) return null;

  const fontClass = getFontClass(post.font);

  return (
    <div className="flex flex-col flex-1">
      <Header
        scrolledContent={
          headerScrolled ? (
            <div className="flex items-center min-w-0 flex-1 gap-3">
              <div className="hidden md:block w-px h-6 bg-zinc-300 shrink-0" />
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
          ) : undefined
        }
      />
      <main className={`${POST_LAYOUT.container} w-full pt-10 pb-128`}>
        <div className="flex items-start gap-6 mb-6">
          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt={post.title}
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
              className={POST_LAYOUT.sidebarPosition}
              style={{
                top: annotationTop != null ? `${Math.max(0, annotationTop)}px` : "0px",
                opacity: activeAnnotation ? 1 : 0,
                pointerEvents: activeAnnotation ? "auto" : "none",
              }}
            >
              <AnnotationPanel annotation={activeAnnotation} caretOffset={caretOffset} />
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
