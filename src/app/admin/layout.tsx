import { requireAdmin, logout } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  async function handleLogout() {
    "use server";
    await logout();
    redirect("/");
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-30 bg-white border-b border-zinc-300 px-6 py-5 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-3">
          <Image src="/logo.svg" alt="genius.ben-mini.com" width={240} height={48} />
          <span className="text-sm font-medium text-black">admin</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm text-black font-medium hover:underline">
            View site
          </Link>
          <form action={handleLogout}>
            <button
              type="submit"
              className="text-sm text-black font-medium hover:underline"
            >
              Log out
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
