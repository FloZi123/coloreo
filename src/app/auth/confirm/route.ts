import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

export const runtime = "nodejs";

/**
 * Löst den selbst versendeten Magic-Link ein (token_hash → Session).
 * PKCE-frei: verifyOtp benötigt keinen client-seitigen code_verifier,
 * funktioniert also auch, wenn der Link in einem anderen Browser geöffnet wird.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = (url.searchParams.get("type") ?? "magiclink") as EmailOtpType;
  const rawNext = url.searchParams.get("next") ?? "/de/bibliothek";
  // Open-Redirect-Schutz: nur projekt-interne Pfade zulassen.
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/de/bibliothek";
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? url.origin;

  if (tokenHash) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) {
      return NextResponse.redirect(`${site}/de/login?error=link_expired`);
    }
  }
  return NextResponse.redirect(`${site}${next}`);
}
