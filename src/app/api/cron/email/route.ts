import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAbandonedCart, sendCrossSell, sendReviewRequest, sendWinBack } from "@/lib/email";
import { enqueueEmail, MARKETING_TYPES, type EmailJobType } from "@/lib/emailJobs";

export const runtime = "nodejs";
export const maxDuration = 60;

const WINBACK_WEEKS = Number(process.env.WINBACK_WEEKS ?? 6);
const WINBACK_COUPON = process.env.WINBACK_COUPON || undefined;

function authorized(req: Request): boolean {
  if (req.headers.get("x-vercel-cron")) return true; // von Vercel-Cron gesetzt
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production"; // lokal offen, in Prod gesperrt
  const url = new URL(req.url);
  return req.headers.get("authorization") === `Bearer ${secret}` || url.searchParams.get("key") === secret;
}

async function processDue(): Promise<{ sent: number; cancelled: number; failed: number }> {
  const admin = createAdminClient();
  const { data: jobs } = await admin
    .from("email_jobs")
    .select("*")
    .eq("status", "pending")
    .lte("run_after", new Date().toISOString())
    .order("run_after", { ascending: true })
    .limit(50);
  let sent = 0, cancelled = 0, failed = 0;

  for (const job of jobs ?? []) {
    const email = job.recipient as string;
    const locale = (job.locale as string) || "de";
    const type = job.type as EmailJobType;
    const payload = (job.payload as Record<string, unknown>) ?? {};

    // Abmeldung respektieren; werbliche Flows nur mit Opt-in (DOI)
    const { data: lead } = await admin.from("leads").select("opt_in_confirmed, unsubscribed_at").eq("email", email).maybeSingle();
    const unsubscribed = !!lead?.unsubscribed_at;
    const optedIn = !!lead?.opt_in_confirmed;
    const needsConsent = MARKETING_TYPES.includes(type);
    if (unsubscribed || (needsConsent && !optedIn)) {
      await admin.from("email_jobs").update({ status: "cancelled", error: unsubscribed ? "unsubscribed" : "no_opt_in" }).eq("id", job.id);
      cancelled++;
      continue;
    }

    try {
      if (type === "abandoned_cart") await sendAbandonedCart({ email, locale });
      else if (type === "cross_sell") await sendCrossSell({ email, locale });
      else if (type === "review_request") await sendReviewRequest({ email, locale, books: (payload.books as { title: string; url: string }[]) ?? [] });
      else if (type === "win_back") await sendWinBack({ email, locale, coupon: (payload.coupon as string) || WINBACK_COUPON });
      await admin.from("email_jobs").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", job.id);
      sent++;
    } catch (e) {
      const attempts = (job.attempts as number) + 1;
      await admin.from("email_jobs").update({ attempts, status: attempts >= 3 ? "failed" : "pending", error: e instanceof Error ? e.message : String(e) }).eq("id", job.id);
      failed++;
    }
  }
  return { sent, cancelled, failed };
}

/** Win-Back-Scan: bestätigte Leads ohne Kauf, älter als WINBACK_WEEKS → Job einreihen (dedupe). */
async function scanWinBack(): Promise<number> {
  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - WINBACK_WEEKS * 7 * 86400_000).toISOString();
  const { data: leads } = await admin
    .from("leads")
    .select("email, locale")
    .eq("opt_in_confirmed", true)
    .is("unsubscribed_at", null)
    .lt("created_at", cutoff)
    .limit(200);
  if (!leads?.length) return 0;
  const { data: paid } = await admin.from("orders").select("customer_email").eq("status", "paid");
  const buyers = new Set((paid ?? []).map((o) => (o.customer_email as string)?.toLowerCase()));
  let queued = 0;
  for (const l of leads) {
    if (buyers.has(l.email.toLowerCase())) continue;
    await enqueueEmail({ type: "win_back", recipient: l.email, locale: l.locale, dedupe: `win_back:${l.email.toLowerCase()}`, payload: WINBACK_COUPON ? { coupon: WINBACK_COUPON } : {} });
    queued++;
  }
  return queued;
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const winBackQueued = await scanWinBack();
  const result = await processDue();
  return NextResponse.json({ ok: true, ...result, winBackQueued });
}
