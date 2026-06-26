import { NextResponse } from "next/server";
import { ADMIN_COOKIE, checkPassword, expectedToken } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: "" }));
  if (!(await checkPassword(password))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const token = await expectedToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token ?? "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
