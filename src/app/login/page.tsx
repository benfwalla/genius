"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(false);
    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/login", {
      method: "POST",
      body: formData,
    });
    if (res.ok) {
      router.push("/admin");
    } else {
      setError(true);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
        <input
          name="password"
          type="password"
          placeholder="Password"
          autoFocus
          className={`w-full rounded-lg border px-4 py-3 text-base focus:border-black focus:outline-none ${
            error ? "border-red-500" : "border-zinc-400"
          }`}
        />
        {error && (
          <p className="text-sm text-red-600">Wrong password.</p>
        )}
        <button
          type="submit"
          className="w-full rounded-lg bg-black px-4 py-3 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
        >
          Log in
        </button>
      </form>
    </div>
  );
}
