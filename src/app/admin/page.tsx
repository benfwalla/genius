"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import type { Id } from "../../../convex/_generated/dataModel";

export default function AdminDashboard() {
  const posts = useQuery(api.posts.list);
  const removePost = useMutation(api.posts.remove);

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-lg font-semibold">Posts</h1>
        <Link
          href="/admin/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
        >
          + New
        </Link>
      </div>
      {!posts ? (
        <p className="text-sm text-zinc-400">Loading...</p>
      ) : posts.length === 0 ? (
        <p className="text-sm text-zinc-400">
          No posts yet. Create your first one.
        </p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post._id}
              className="flex items-center justify-between rounded-lg border border-zinc-100 px-4 py-3 hover:border-zinc-200 transition-colors"
            >
              <Link href={`/admin/${post.slug}`} className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{post.title}</p>
                <p className="text-xs text-zinc-400">
                  {post.author} &middot; {post.type}
                </p>
              </Link>
              <button
                onClick={() => {
                  if (confirm("Delete this post and all its annotations?")) {
                    removePost({ id: post._id as Id<"posts"> });
                  }
                }}
                className="ml-4 text-xs text-zinc-400 hover:text-red-500 transition-colors"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
