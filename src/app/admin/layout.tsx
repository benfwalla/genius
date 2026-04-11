import { requireAdmin, logout } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

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
      <header className="border-b border-zinc-100 px-6 py-4 flex items-center justify-between">
        <Link href="/admin" className="text-sm font-semibold tracking-tight">
          genius.ben-mini.com
          <span className="ml-2 text-xs font-normal text-zinc-400">admin</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-700">
            View site
          </Link>
          <form action={handleLogout}>
            <button
              type="submit"
              className="text-xs text-zinc-500 hover:text-zinc-700"
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
