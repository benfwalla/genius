import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getByPost = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    return ctx.db
      .query("annotations")
      .withIndex("by_post", (q) => q.eq("postId", postId))
      .collect();
  },
});

export const create = mutation({
  args: {
    postId: v.id("posts"),
    startOffset: v.number(),
    endOffset: v.number(),
    anchorText: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("annotations", { ...args, createdAt: Date.now() });
  },
});

export const update = mutation({
  args: {
    id: v.id("annotations"),
    body: v.string(),
  },
  handler: async (ctx, { id, body }) => {
    await ctx.db.patch(id, { body });
  },
});

export const remove = mutation({
  args: { id: v.id("annotations") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
