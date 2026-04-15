"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { FONTS, ACCENT_COLORS, POST_TYPES, type FontId } from "@/lib/constants";
import type { Doc, Id } from "../../convex/_generated/dataModel";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function PostForm({
  post,
}: {
  post?: Doc<"posts"> & { imageUrl?: string | null };
}) {
  const router = useRouter();
  const createPost = useMutation(api.posts.create);
  const updatePost = useMutation(api.posts.update);
  const generateUploadUrl = useMutation(api.posts.generateUploadUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!post;

  const [title, setTitle] = useState(post?.title ?? "");
  const [author, setAuthor] = useState(post?.author ?? "");
  const [type, setType] = useState(post?.type ?? "lyrics");
  const [content, setContent] = useState(post?.content ?? "");
  const [font, setFont] = useState<FontId>((post?.font as FontId) ?? "dm-sans");
  const [accentColor, setAccentColor] = useState(post?.accentColor ?? "#FFFF00");
  const [releasedAt, setReleasedAt] = useState(post?.releasedAt ?? "");
  const [youtubeUrl, setYoutubeUrl] = useState(post?.youtubeUrl ?? "");
  const [imagePreview, setImagePreview] = useState<string | null>(post?.imageUrl ?? null);
  const [createdAt, setCreatedAt] = useState(() => {
    const d = post ? new Date(post.createdAt) : new Date();
    return d.toISOString().slice(0, 10);
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const mountedRef = useRef(false);
  const blobUrlRef = useRef<string | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Use refs for form values so autoSave is stable
  const formRef = useRef({ title, author, type, content, font, accentColor, releasedAt, youtubeUrl, createdAt });
  formRef.current = { title, author, type, content, font, accentColor, releasedAt, youtubeUrl, createdAt };

  const showSaved = useCallback(() => {
    setSaved(true);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSaved(false), 1500);
  }, []);

  const autoSave = useCallback(async () => {
    if (!post) return;
    setSaving(true);
    setSaved(false);
    const v = formRef.current;
    const timestamp = new Date(v.createdAt + "T12:00:00").getTime();
    await updatePost({
      id: post._id,
      title: v.title,
      author: v.author,
      type: v.type,
      content: v.content,
      slug: post.slug,
      font: v.font,
      accentColor: v.accentColor,
      releasedAt: v.releasedAt || undefined,
      youtubeUrl: v.youtubeUrl || undefined,
      createdAt: timestamp,
    });
    setSaving(false);
    showSaved();
  }, [post, updatePost, showSaved]);

  useEffect(() => {
    if (!isEditing) return;
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(autoSave, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [title, author, type, content, font, accentColor, releasedAt, youtubeUrl, createdAt, isEditing, autoSave]);

  // Cleanup blob URLs and timers on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    const preview = URL.createObjectURL(file);
    blobUrlRef.current = preview;
    setImagePreview(preview);

    if (post) {
      setSaving(true);
      const url = await generateUploadUrl();
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await res.json();
      await updatePost({ id: post._id, imageId: storageId as Id<"_storage"> });
      setSaving(false);
      showSaved();
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const slug = slugify(title);
    try {
      let imageId: Id<"_storage"> | undefined;
      if (fileInputRef.current?.files?.[0]) {
        const file = fileInputRef.current.files[0];
        const url = await generateUploadUrl();
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const { storageId } = await res.json();
        imageId = storageId as Id<"_storage">;
      }
      const timestamp = new Date(createdAt + "T12:00:00").getTime();
      const args: Parameters<typeof createPost>[0] = {
        title, author, type, content, slug, font, accentColor, createdAt: timestamp,
        ...(releasedAt ? { releasedAt } : {}),
        ...(youtubeUrl ? { youtubeUrl } : {}),
      };
      if (imageId) args.imageId = imageId;
      await createPost(args);
      router.push("/admin");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "rounded-lg border border-zinc-400 px-4 py-3 text-base text-black focus:border-black focus:outline-none";

  return (
    <form onSubmit={isEditing ? (e) => e.preventDefault() : handleCreate} className="space-y-6 max-w-2xl">
      {isEditing && (
        <p className="text-xs text-black h-4">
          {saving ? "Saving..." : saved ? "Saved" : ""}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required className={`col-span-2 ${inputClass}`} />
        <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author" required className={inputClass} />
        <select value={type} onChange={(e) => setType(e.target.value)} className={`${inputClass} pr-10`}>
          {POST_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-black mb-2">Released</label>
          <input type="date" value={releasedAt} onChange={(e) => setReleasedAt(e.target.value)} className={`w-full ${inputClass}`} />
        </div>
        <div>
          <label className="block text-sm font-medium text-black mb-2">Added</label>
          <input type="date" value={createdAt} onChange={(e) => setCreatedAt(e.target.value)} className={`w-full ${inputClass}`} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-2">YouTube URL</label>
        <input
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className={`w-full ${inputClass}`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-3">Cover image</label>
        {imagePreview && (
          <div className="mb-3">
            <img src={imagePreview} alt="Cover preview" className="rounded-lg max-h-48 object-cover" />
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg border border-zinc-400 px-5 py-2.5 text-sm font-medium text-black hover:border-black transition-colors"
        >
          {imagePreview ? "Change image" : "Upload image"}
        </button>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Paste your lyrics, poem, passage..."
        rows={20}
        required
        className={`w-full leading-relaxed ${inputClass}`}
        style={{ fontFamily: `var(--font-${FONTS.find((f) => f.id === font)?.className.replace("font-", "") ?? "sans"})` }}
      />

      <div>
        <label className="block text-sm font-medium text-black mb-3">Font</label>
        <div className="flex gap-3">
          {FONTS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFont(f.id)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                font === f.id ? "border-black bg-black text-white" : "border-zinc-400 text-black hover:border-black"
              }`}
              style={{ fontFamily: `var(--font-${f.className.replace("font-", "")})` }}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-3">Highlight color</label>
        <div className="flex gap-3">
          {ACCENT_COLORS.map((c) => (
            <button
              key={c.hex}
              type="button"
              onClick={() => setAccentColor(c.hex)}
              title={c.name}
              className={`w-10 h-10 rounded-full border-2 transition-transform ${
                accentColor === c.hex ? "border-black scale-110" : "border-zinc-400 hover:scale-105"
              }`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
      </div>

      {!isEditing && (
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-black px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
        >
          {saving ? "Creating..." : "Create"}
        </button>
      )}
    </form>
  );
}
