import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMagicLink } from "@/lib/email";
import { isLocale } from "@/i18n/config";
import { limited } from "@/lib/rate-limit";

export const runtime = "nodejs";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Selbst versendeter Magic-Link: erzeugt den Login-Token via Supabase-Admin
 * (generateLink) und verschickt ihn über unsere gebrandete, lokalisierte
 * E-Mail (email.ts) – statt über Supabases statisches Default-Template.
 * Eingelöst wird er in /auth/confirm via verifyOtp(token_hash).
 */
export async function POST(req: Request) {
  const retry = limited(req, "magic-link", 5);
  if (retry) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(retry) } });
  try {
    const { email, locale: rawLocale } = await req.json();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }
    const locale = isLocale(rawLocale) ? rawLocale : "de";

    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: email.toLowerCase().trim(),
      options: { redirectTo: `${SITE}/auth/confirm` },
    });
    if (error || !data?.properties?.hashed_token) {
      console.error("[magic-link] generateLink", error);
      return NextResponse.json({ ok: false, error: "generate_failed" }, { status: 500 });
    }

    const next = `/${locale}/bibliothek`;
    const url = `${SITE}/auth/confirm?token_hash=${data.properties.hashed_token}&type=magiclink&next=${encodeURIComponent(next)}`;
    await sendMagicLink({ email, locale, url });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[magic-link]", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
