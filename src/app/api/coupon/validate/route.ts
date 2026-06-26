import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";

export async function POST(req: Request) {
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
