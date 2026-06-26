import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendFreebieEmail } from "@/lib/email";
import { isLocale } from "@/i18n/config";

export const runtime = "nodejs";

export async function POST(req: Request) {
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
        { email: email.toLowerCase().trim(), source: leadSource, locale, confirm_token: token },
        { onConflict: "email,source" }
      );

    await sendFreebieEmail({ email, locale });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[freebie]", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
