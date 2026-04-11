import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  handler: async (ctx) => {
    return ctx.db.query("posts").order("desc").collect();
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
  },
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
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("posts", { ...args, createdAt: Date.now() });
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
    const annotations = await ctx.db
      .query("annotations")
      .withIndex("by_post", (q) => q.eq("postId", id))
      .collect();
    await Promise.all(annotations.map((a) => ctx.db.delete(a._id)));
    await ctx.db.delete(id);
  },
});
