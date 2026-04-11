"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { FONTS, ACCENT_COLORS, POST_TYPES, type FontId } from "@/lib/constants";
import type { Doc } from "../../convex/_generated/dataModel";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function PostForm({ post }: { post?: Doc<"posts"> }) {
  const router = useRouter();
  const createPost = useMutation(api.posts.create);
  const updatePost = useMutation(api.posts.update);

  const [title, setTitle] = useState(post?.title ?? "");
  const [author, setAuthor] = useState(post?.author ?? "");
  const [type, setType] = useState(post?.type ?? "lyrics");
  const [content, setContent] = useState(post?.content ?? "");
  const [font, setFont] = useState<FontId>((post?.font as FontId) ?? "lora");
  const [accentColor, setAccentColor] = useState(
    post?.accentColor ?? "#FFFF00"
  );
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const slug = post?.slug ?? slugify(title);
    try {
      if (post) {
        await updatePost({
          id: post._id,
          title,
          author,
          type,
          content,
          slug,
          font,
          accentColor,
        });
      } else {
        await createPost({ title, author, type, content, slug, font, accentColor });
      }
      router.push("/admin");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          required
          className="col-span-2 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm focus:border-zinc-400 focus:outline-none"
        />
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Author"
          required
          className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm focus:border-zinc-400 focus:outline-none"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm focus:border-zinc-400 focus:outline-none"
        >
          {POST_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Paste your lyrics, poem, passage..."
        rows={16}
        required
        className={`w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm leading-relaxed focus:border-zinc-400 focus:outline-none font-${font === "space-grotesk" ? "space" : font}`}
        style={{ fontFamily: `var(--font-${font === "space-grotesk" ? "space" : font})` }}
      />

      {/* Font picker */}
      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-2">
          Font
        </label>
        <div className="flex gap-2">
          {FONTS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFont(f.id)}
              className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                font === f.id
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 hover:border-zinc-300"
              }`}
              style={{ fontFamily: `var(--font-${f.className.replace("font-", "")})` }}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>

      {/* Color picker */}
      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-2">
          Highlight color
        </label>
        <div className="flex gap-2">
          {ACCENT_COLORS.map((c) => (
            <button
              key={c.hex}
              type="button"
              onClick={() => setAccentColor(c.hex)}
              title={c.name}
              className={`w-8 h-8 rounded-full border-2 transition-transform ${
                accentColor === c.hex
                  ? "border-zinc-900 scale-110"
                  : "border-zinc-200 hover:scale-105"
              }`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
      >
        {saving ? "Saving..." : post ? "Update" : "Create"}
      </button>
    </form>
  );
}
