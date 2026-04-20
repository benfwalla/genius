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
      <main className="max-w-5xl mx-auto w-full px-4 md:px-6 py-6 md:py-10">
        {posts && posts.length === 0 ? (
          <p className="text-base">Nothing here yet.</p>
        ) : posts && posts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-8">
            {posts.map((post) => (
              <Link
                key={post._id}
                href={`/${post.slug}`}
                className="flex flex-col cursor-pointer"
              >
                <div className="w-full aspect-square rounded-lg border border-zinc-300 overflow-hidden bg-zinc-100">
                  {post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="mt-3 md:mt-4">
                  <h2 className="text-lg md:text-2xl font-bold tracking-tight leading-[1.1] text-balance">
                    {post.title}
                  </h2>
                  <p className="text-sm md:text-base text-black mt-1.5 flex items-center flex-wrap gap-x-2 gap-y-1">
                    <span>{post.author}</span>
                    <span className="inline-block text-[10px] md:text-xs font-medium border border-zinc-400 rounded-full px-2 py-0.5 align-middle">
                      {post.type}
                    </span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </main>
    </div>
  );
}
