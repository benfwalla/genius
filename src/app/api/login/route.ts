import { login } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const formData = await req.formData();
  const password = formData.get("password") as string;
  const ok = await login(password);
  if (ok) return NextResponse.json({ ok: true });
  return NextResponse.json({ error: "Wrong password" }, { status: 401 });
}
