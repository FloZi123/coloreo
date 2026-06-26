import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendFreebieEmail } from "@/lib/email";
import { isLocale } from "@/i18n/config";
import { limited } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const retry = limited(req, "freebie", 5);
  if (retry) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(retry) } });
  try {
    const { email, locale: rawLocale, source } = await req.json();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }
    const locale = isLocale(rawLocale) ? rawLocale : "de";
    const leadSource = source === "newsletter" ? "newsletter" : "freebie";

    const admin = createAdminClient();
    const token = crypto.randomUUID().replace(/-/g, "");
    await admin
      .from("leads")
      .upsert(
        { email: email.toLowerCase().trim(), source: leadSource, locale, confirm_token: token, opt_in_confirmed: false },
        { onConflict: "email,source" }
      );

    const site = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
    const confirmUrl = `${site}/api/newsletter/confirm?token=${token}&locale=${locale}`;
    await sendFreebieEmail({ email, locale, confirmUrl });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[freebie]", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
