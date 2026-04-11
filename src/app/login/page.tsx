import { login } from "@/lib/auth";
import { redirect } from "next/navigation";

export default function LoginPage() {
  async function handleLogin(formData: FormData) {
    "use server";
    const password = formData.get("password") as string;
    const ok = await login(password);
    if (ok) redirect("/admin");
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <form action={handleLogin} className="w-full max-w-xs space-y-4">
        <input
          name="password"
          type="password"
          placeholder="Password"
          autoFocus
          className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm focus:border-zinc-400 focus:outline-none"
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
        >
          Log in
        </button>
      </form>
    </div>
  );
}
