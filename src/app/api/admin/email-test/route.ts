import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, expectedToken } from "@/lib/admin-auth";
import { smtpDiagnostics, verifySmtp, sendTestEmail } from "@/lib/email";

export const runtime = "nodejs";

/**
 * Admin-Diagnose für den Mailversand.
 *   GET /api/admin/email-test            → Config-Status + transporter.verify()
 *   GET /api/admin/email-test?to=a@b.de  → zusätzlich eine echte Testmail versenden
 * Liefert die echten SMTP-Fehlermeldungen zurück, ohne Geheimnisse offenzulegen.
 */
export async function GET(req: Request) {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (token !== (await expectedToken())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const diagnostics = smtpDiagnostics();
  const verify = await verifySmtp();

  let testSend: { attempted: boolean; ok?: boolean; to?: string; error?: string } = { attempted: false };
  const to = new URL(req.url).searchParams.get("to");
  if (to) {
    try {
      await sendTestEmail(to);
      testSend = { attempted: true, ok: true, to };
    } catch (e) {
      testSend = { attempted: true, ok: false, to, error: e instanceof Error ? `${e.name}: ${e.message}` : String(e) };
    }
  }

  const verdict = !diagnostics.configured
    ? "SMTP nicht konfiguriert – setze SMTP_HOST/USER/PASS (und SMTP_FROM) in Vercel und deploye neu."
    : !verify.ok
      ? "SMTP konfiguriert, aber Verbindung/Login schlägt fehl – siehe verify.error (Host/Port/Passwort/secure prüfen)."
      : testSend.attempted && !testSend.ok
        ? "Login ok, aber Versand schlägt fehl – siehe testSend.error (oft Absenderadresse/Relay-Recht)."
        : "SMTP ist erreichbar und eingeloggt." + (testSend.ok ? " Testmail wurde versendet." : " Hänge ?to=deine@mail.de an, um eine Testmail zu senden.");

  return NextResponse.json({ verdict, diagnostics, verify, testSend }, { status: 200 });
}
