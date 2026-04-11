"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import Link from "next/link";
import TextDisplay from "@/components/TextDisplay";
import AnnotationPanel from "@/components/AnnotationPanel";
import { FONTS } from "@/lib/constants";

export default function PostDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = useQuery(api.posts.getBySlug, { slug });
  const annotations = useQuery(
    api.annotations.getByPost,
    post ? { postId: post._id } : "skip"
  );
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(
    null
  );

  if (!post) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-zinc-400">
        Loading...
      </div>
    );
  }

  const fontDef = FONTS.find((f) => f.id === post.font);
  const fontClass = fontDef?.className ?? "";
  const activeAnnotation =
    annotations?.find((a) => a._id === activeAnnotationId) ?? null;

  return (
    <div className="flex flex-col flex-1">
      <header className="border-b border-zinc-100 px-6 py-4">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          genius.ben-mini.com
        </Link>
      </header>
      <main className="max-w-4xl mx-auto w-full px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">{post.title}</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {post.author} &middot; {post.type}
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
          <TextDisplay
            content={post.content}
            annotations={annotations ?? []}
            accentColor={post.accentColor}
            activeAnnotationId={activeAnnotationId ?? undefined}
            onAnnotationClick={setActiveAnnotationId}
            fontClass={fontClass}
          />
          <aside className="lg:border-l lg:border-zinc-100 lg:pl-6">
            <div className="sticky top-6">
              <AnnotationPanel
                annotation={activeAnnotation}
                onClose={() => setActiveAnnotationId(null)}
              />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
