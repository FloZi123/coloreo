import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import { limited } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const retry = limited(req, "coupon", 30);
  if (retry) return NextResponse.json({ valid: false, error: "rate_limited" }, { status: 429 });
  const { code } = await req.json().catch(() => ({ code: "" }));
  if (!code || typeof code !== "string") {
    return NextResponse.json({ valid: false }, { status: 400 });
  }
  const sb = createPublicClient();
  const { data, error } = await sb.rpc("validate_coupon", { p_code: code.trim() });
  if (error || !data || data.length === 0) {
    return NextResponse.json({ valid: false });
  }
  const c = data[0];
  return NextResponse.json({
    valid: true,
    coupon: {
      code: c.code,
      type: c.type,
      value: Number(c.value),
      min_order_cents: c.min_order_cents,
    },
  });
}
