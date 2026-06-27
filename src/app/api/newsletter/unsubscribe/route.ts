import { createAdminClient } from "@/lib/supabase/admin";
import { verifyUnsubToken } from "@/lib/emailJobs";

export const runtime = "nodejs";

function page(msg: string): Response {
  return new Response(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
     <div style="font-family:Segoe UI,Arial,sans-serif;max-width:480px;margin:80px auto;text-align:center;color:#221E1B">
       <div style="font-size:30px;font-weight:bold;letter-spacing:-1px">c<span style="color:#FF5A4D">o</span>l<span style="color:#3B8EEA">o</span>re<span style="color:#3FBF87">o</span></div>
       <p style="margin-top:24px;font-size:17px">${msg}</p>
     </div>`,
    { headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = (url.searchParams.get("e") || "").toLowerCase().trim();
  const token = url.searchParams.get("t") || "";
  if (!email || !token || !verifyUnsubToken(email, token)) {
    return page("Dieser Abmelde-Link ist ungültig. / This unsubscribe link is invalid.");
  }
  const admin = createAdminClient();
  await admin.from("leads").update({ unsubscribed_at: new Date().toISOString(), opt_in_confirmed: false }).eq("email", email);
  await admin.from("email_jobs").update({ status: "cancelled", error: "unsubscribed" }).eq("recipient", email).eq("status", "pending");
  return page("Du bist abgemeldet. Schade, dass du gehst! 🎨<br/>You've been unsubscribed.");
}
