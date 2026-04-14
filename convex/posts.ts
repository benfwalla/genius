import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";

async function withImageUrl(ctx: QueryCtx, post: Doc<"posts">) {
  return {
    ...post,
    imageUrl: post.imageId ? await ctx.storage.getUrl(post.imageId) : null,
  };
}

export const list = query({
  handler: async (ctx) => {
    const posts = await ctx.db.query("posts").order("desc").collect();
    return Promise.all(posts.map((post) => withImageUrl(ctx, post)));
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const post = await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!post) return null;
    return withImageUrl(ctx, post);
  },
});

export const generateUploadUrl = mutation({
  handler: async (ctx) => ctx.storage.generateUploadUrl(),
});

export const create = mutation({
  args: {
    title: v.string(),
    author: v.string(),
    type: v.string(),
    content: v.string(),
    slug: v.string(),
    font: v.string(),
    accentColor: v.string(),
    imageId: v.optional(v.id("_storage")),
    youtubeUrl: v.optional(v.string()),
    releasedAt: v.optional(v.string()),
    createdAt: v.optional(v.number()),
  },
  handler: async (ctx, { createdAt, ...rest }) => {
    return ctx.db.insert("posts", { ...rest, createdAt: createdAt ?? Date.now() });
  },
});

export const update = mutation({
  args: {
    id: v.id("posts"),
    title: v.optional(v.string()),
    author: v.optional(v.string()),
    type: v.optional(v.string()),
    content: v.optional(v.string()),
    slug: v.optional(v.string()),
    font: v.optional(v.string()),
    accentColor: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
    youtubeUrl: v.optional(v.string()),
    releasedAt: v.optional(v.string()),
    createdAt: v.optional(v.number()),
  },
  handler: async (ctx, { id, ...fields }) => {
    const updates = Object.fromEntries(
      Object.entries(fields).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("posts") },
  handler: async (ctx, { id }) => {
    const post = await ctx.db.get(id);
    if (post?.imageId) await ctx.storage.delete(post.imageId);
    const annotations = await ctx.db
      .query("annotations")
      .withIndex("by_post", (q) => q.eq("postId", id))
      .collect();
    await Promise.all(annotations.map((a) => ctx.db.delete(a._id)));
    await ctx.db.delete(id);
  },
});
