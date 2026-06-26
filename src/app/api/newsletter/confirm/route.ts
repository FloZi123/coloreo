import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isLocale } from "@/i18n/config";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const locale = isLocale(url.searchParams.get("locale") ?? "") ? url.searchParams.get("locale")! : "de";
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? url.origin;

  if (token) {
    try {
      const admin = createAdminClient();
      await admin.from("leads").update({ opt_in_confirmed: true, confirm_token: null }).eq("confirm_token", token);
    } catch (e) {
      console.error("[newsletter/confirm]", e);
    }
  }
  return NextResponse.redirect(`${site}/${locale}/newsletter-bestaetigt`);
}
