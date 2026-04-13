import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  posts: defineTable({
    title: v.string(),
    author: v.string(),
    type: v.string(),
    content: v.string(),
    slug: v.string(),
    font: v.string(),
    accentColor: v.string(),
    imageId: v.optional(v.id("_storage")),
    releasedAt: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_slug", ["slug"]),

  annotations: defineTable({
    postId: v.id("posts"),
    startOffset: v.number(),
    endOffset: v.number(),
    anchorText: v.string(),
    body: v.string(),
    createdAt: v.number(),
  }).index("by_post", ["postId"]),
});
