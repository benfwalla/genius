"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";

export default function HomePage() {
  const posts = useQuery(api.posts.list);

  return (
    <div className="flex flex-col flex-1">
      <header className="border-b border-zinc-100 px-6 py-4">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          genius.ben-mini.com
        </Link>
      </header>
      <main className="max-w-2xl mx-auto w-full px-6 py-10">
        {!posts ? (
          <p className="text-sm text-zinc-400">Loading...</p>
        ) : posts.length === 0 ? (
          <p className="text-sm text-zinc-400">Nothing here yet.</p>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <Link
                key={post._id}
                href={`/${post.slug}`}
                className="block group"
              >
                <div className="flex items-baseline gap-3">
                  <h2 className="text-base font-medium group-hover:underline">
                    {post.title}
                  </h2>
                  <span className="text-xs text-zinc-400 shrink-0">
                    {post.type}
                  </span>
                </div>
                <p className="text-sm text-zinc-500 mt-0.5">{post.author}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
