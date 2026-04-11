"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import type { Id } from "../../../convex/_generated/dataModel";
import { formatDate } from "@/lib/dates";

export default function AdminDashboard() {
  const posts = useQuery(api.posts.list);
  const removePost = useMutation(api.posts.remove);

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Posts</h1>
        <Link
          href="/admin/new"
          className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
        >
          + New
        </Link>
      </div>
      {!posts ? (
        <p className="text-base">Loading...</p>
      ) : posts.length === 0 ? (
        <p className="text-base">No posts yet. Create your first one.</p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post._id}
              className="flex items-center justify-between rounded-lg border border-zinc-300 px-5 py-4 hover:border-black transition-colors"
            >
              <Link href={`/admin/${post.slug}`} className="flex-1 min-w-0 flex items-center gap-4">
                {post.imageUrl && (
                  <img
                    src={post.imageUrl}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-base font-medium truncate">{post.title}</p>
                  <p className="text-sm text-black">
                    {post.author} &middot; {post.type} &middot; {formatDate(post.createdAt)}
                  </p>
                </div>
              </Link>
              <button
                onClick={() => {
                  if (confirm("Delete this post and all its annotations?")) {
                    removePost({ id: post._id as Id<"posts"> });
                  }
                }}
                className="ml-4 text-sm text-black font-medium hover:text-red-600 transition-colors"
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
