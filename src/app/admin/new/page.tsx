"use client";

import PostForm from "@/components/PostForm";

export default function NewPostPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-lg font-semibold mb-8">New post</h1>
      <PostForm />
    </div>
  );
}
