import Link from "next/link";
import Header from "@/components/Header";

export default function NotFound() {
  return (
    <div className="flex flex-col flex-1">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
        <p className="text-8xl font-semibold tracking-tighter">404</p>
        <p className="text-base">This page doesn&apos;t exist.</p>
        <Link
          href="/"
          className="mt-2 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
        >
          Go home
        </Link>
      </main>
    </div>
  );
}
