"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import PostForm from "@/components/PostForm";
import TextSelector from "@/components/TextSelector";
import AnnotationPanel from "@/components/AnnotationPanel";
import AnnotationEditor from "@/components/AnnotationEditor";
import { FONTS } from "@/lib/constants";

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

  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(
    null
  );
  const [pendingSelection, setPendingSelection] = useState<{
    start: number;
    end: number;
    text: string;
  } | null>(null);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<"annotate" | "edit">("annotate");

  if (!post) return <div className="p-6 text-sm text-zinc-400">Loading...</div>;

  const fontDef = FONTS.find((f) => f.id === post.font);
  const fontClass = fontDef?.className ?? "";
  const activeAnnotation =
    annotations?.find((a) => a._id === activeAnnotationId) ?? null;

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
      setActiveAnnotationId(null);
    }
    setEditing(false);
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("annotate")}
          className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
            tab === "annotate"
              ? "bg-zinc-900 text-white"
              : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          Annotate
        </button>
        <button
          onClick={() => setTab("edit")}
          className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
            tab === "edit"
              ? "bg-zinc-900 text-white"
              : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          Edit details
        </button>
      </div>

      {tab === "edit" ? (
        <PostForm post={post} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          <div>
            <h1 className="text-xl font-semibold mb-1">{post.title}</h1>
            <p className="text-sm text-zinc-400 mb-6">
              {post.author} &middot; {post.type}
            </p>
            <TextSelector
              content={post.content}
              annotations={annotations ?? []}
              accentColor={post.accentColor}
              activeAnnotationId={activeAnnotationId ?? undefined}
              onAnnotationClick={(id) => {
                setActiveAnnotationId(id);
                setPendingSelection(null);
                setEditing(false);
              }}
              onSelect={(start, end, text) => {
                setPendingSelection({ start, end, text });
                setActiveAnnotationId(null);
                setEditing(true);
              }}
              fontClass={fontClass}
            />
          </div>

          <aside className="lg:border-l lg:border-zinc-100 lg:pl-6">
            <div className="sticky top-6">
              {pendingSelection && editing ? (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    New annotation
                  </p>
                  <blockquote className="text-xs text-zinc-500 border-l-2 border-zinc-200 pl-3 italic">
                    &ldquo;{pendingSelection.text}&rdquo;
                  </blockquote>
                  <AnnotationEditor
                    onSave={handleSaveAnnotation}
                    onCancel={() => {
                      setPendingSelection(null);
                      setEditing(false);
                    }}
                  />
                </div>
              ) : activeAnnotation ? (
                <div className="space-y-3">
                  <AnnotationPanel
                    annotation={activeAnnotation}
                    onClose={() => setActiveAnnotationId(null)}
                  />
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setEditing(true)}
                      className="text-xs text-zinc-500 hover:text-zinc-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm("Delete this annotation?")) {
                          await removeAnnotation({ id: activeAnnotation._id });
                          setActiveAnnotationId(null);
                        }
                      }}
                      className="text-xs text-zinc-400 hover:text-red-500"
                    >
                      Delete
                    </button>
                  </div>
                  {editing && (
                    <AnnotationEditor
                      initialHtml={activeAnnotation.body}
                      onSave={handleSaveAnnotation}
                      onCancel={() => setEditing(false)}
                    />
                  )}
                </div>
              ) : (
                <p className="text-sm text-zinc-400 italic">
                  Select text to annotate, or click a highlight to edit.
                </p>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
