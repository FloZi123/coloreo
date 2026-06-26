import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, expectedToken } from "@/lib/admin-auth";
import { scanTrends } from "@/lib/autogen";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (token !== (await expectedToken())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const created = await scanTrends();
    return NextResponse.json({ created });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "scan_failed" }, { status: 500 });
  }
}
