"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";
import Header from "@/components/Header";

export default function HomePage() {
  const posts = useQuery(api.posts.list);

  return (
    <div className="flex flex-col flex-1">
      <Header />
      <main className="max-w-2xl mx-auto w-full px-6 py-10">
        {!posts ? (
          <p className="text-base">Loading...</p>
        ) : posts.length === 0 ? (
          <p className="text-base">Nothing here yet.</p>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <Link
                key={post._id}
                href={`/${post.slug}`}
                className="flex items-center justify-between rounded-lg border border-zinc-300 px-5 py-4 hover:border-black transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {post.imageUrl && (
                    <img src={post.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-base font-medium truncate">{post.title}</p>
                    <p className="text-sm text-black">
                      {post.author} &middot; {post.type}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
