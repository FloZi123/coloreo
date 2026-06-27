import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Locale } from "@/i18n/config";

export type EmailJobType = "abandoned_cart" | "cross_sell" | "review_request" | "win_back";

/** Werbliche Flows brauchen Opt-in (DOI); review_request ist transaktionale Kauf-Nachfass. */
export const MARKETING_TYPES: EmailJobType[] = ["abandoned_cart", "cross_sell", "win_back"];

const norm = (e: string) => e.toLowerCase().trim();

/** Job einreihen. `dedupe` verhindert Doppel-Jobs (z. B. `cross_sell:<orderId>`). */
export async function enqueueEmail(opts: {
  type: EmailJobType;
  recipient: string;
  locale: Locale | string;
  payload?: Record<string, unknown>;
  runAfterMinutes?: number;
  dedupe?: string;
}): Promise<void> {
  const admin = createAdminClient();
  const row = {
    type: opts.type,
    recipient: norm(opts.recipient),
    locale: String(opts.locale || "de"),
    payload: (opts.payload ?? {}) as never,
    run_after: new Date(Date.now() + (opts.runAfterMinutes ?? 0) * 60_000).toISOString(),
    status: "pending",
    dedupe: opts.dedupe ?? null,
  };
  if (opts.dedupe) {
    await admin.from("email_jobs").upsert(row, { onConflict: "dedupe", ignoreDuplicates: true });
  } else {
    await admin.from("email_jobs").insert(row);
  }
}

/** Offene Jobs eines Typs für eine Adresse stornieren (z. B. Warenkorbabbruch nach Kauf). */
export async function cancelPendingEmails(type: EmailJobType, recipient: string): Promise<void> {
  const admin = createAdminClient();
  await admin.from("email_jobs").update({ status: "cancelled" }).eq("type", type).eq("recipient", norm(recipient)).eq("status", "pending");
}

const UNSUB_SECRET = process.env.UNSUB_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "dev-secret";

export function unsubToken(email: string): string {
  return crypto.createHmac("sha256", UNSUB_SECRET).update(norm(email)).digest("hex").slice(0, 32);
}
export function verifyUnsubToken(email: string, token: string): boolean {
  const expected = unsubToken(email);
  return token.length === expected.length && crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}
