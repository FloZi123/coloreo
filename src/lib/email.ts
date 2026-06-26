import nodemailer from "nodemailer";
import type { Locale } from "@/i18n/config";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function smtpConfig() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass || host.includes("PLACEHOLDER") || pass.includes("PLACEHOLDER")) {
    return null;
  }
  const port = Number(process.env.SMTP_PORT ?? 587);
  const from = process.env.SMTP_FROM || process.env.EMAIL_FROM || "Coloreo <noreply@example.com>";
  return { host, port, user, pass, from, secure: port === 465 };
}

async function send(to: string, subject: string, html: string): Promise<void> {
  const cfg = smtpConfig();
  if (!cfg) {
    console.warn("[email] SMTP nicht konfiguriert – Mail übersprungen für", to);
    return;
  }
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
  });
  await transporter.sendMail({ from: cfg.from, to, subject, html });
  console.log(`[email] ✓ gesendet (SMTP ${cfg.host}): ${subject} → ${to}`);
}

function layout(title: string, inner: string): string {
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#2b2540">
    <div style="background:#7c4dff;color:#fff;padding:20px 24px;border-radius:16px 16px 0 0;font-size:22px;font-weight:bold">✦ Coloreo</div>
    <div style="border:1px solid #ece5db;border-top:none;padding:24px;border-radius:0 0 16px 16px">
      <h2 style="margin-top:0">${title}</h2>${inner}
    </div>
    <p style="text-align:center;color:#8b8499;font-size:12px;margin-top:16px">© 2026 Coloreo · <a href="${SITE}" style="color:#7c4dff">coloreo</a></p>
  </div>`;
}

export async function sendOrderConfirmation(opts: {
  email: string;
  orderNumber: string;
  locale: Locale;
  downloads: { title: string; url: string }[];
}): Promise<void> {
  const de = opts.locale === "de";
  const links = opts.downloads
    .map(
      (d) =>
        `<li style="margin:8px 0"><a href="${d.url}" style="color:#7c4dff;font-weight:bold">${d.title}</a> – ${de ? "PDF herunterladen" : "Download PDF"}</li>`
    )
    .join("");
  const html = layout(
    de ? "Vielen Dank für deinen Kauf! 🎨" : "Thank you for your purchase! 🎨",
    `<p>${de ? "Bestellnummer" : "Order number"}: <strong>${opts.orderNumber}</strong></p>
     <p>${de ? "Deine Malbücher stehen sofort bereit:" : "Your coloring books are ready:"}</p>
     <ul>${links}</ul>
     <p style="color:#8b8499;font-size:13px">${de ? "Die Links sind 30 Tage gültig. Jede PDF ist personalisiert – nur für deinen privaten Gebrauch." : "Links valid for 30 days. Each PDF is personalized – for your private use only."}</p>`
  );
  await send(
    opts.email,
    de ? `Deine Coloreo-Bestellung ${opts.orderNumber}` : `Your Coloreo order ${opts.orderNumber}`,
    html
  );
}

export async function sendFreebieEmail(opts: { email: string; locale: Locale; downloadUrl?: string; confirmUrl?: string }): Promise<void> {
  const de = opts.locale === "de";
  const cta = opts.confirmUrl
    ? `<p>${de ? "Bitte bestätige deine Anmeldung – dann erhältst du die Gratis-Vorlagen und Angebote:" : "Please confirm your sign-up to receive the free pages and offers:"}</p>
       <p><a href="${opts.confirmUrl}" style="background:#7c4dff;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:bold">${de ? "Anmeldung bestätigen" : "Confirm sign-up"}</a></p>`
    : opts.downloadUrl
    ? `<p><a href="${opts.downloadUrl}" style="background:#7c4dff;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:bold">${de ? "Gratis-Vorlagen herunterladen" : "Download free pages"}</a></p>`
    : `<p>${de ? "Deine Gratis-Vorlagen sind unterwegs." : "Your free pages are on the way."}</p>`;
  const html = layout(
    de ? "Fast geschafft! 🎁" : "Almost there! 🎁",
    `${cta}<p style="color:#8b8499;font-size:13px">${de ? "Du hast dich auf Coloreo angemeldet. Falls nicht, ignoriere diese E-Mail einfach." : "You signed up on Coloreo. If this wasn't you, just ignore this email."}</p>`
  );
  await send(
    opts.email,
    de ? "Bitte bestätige deine Anmeldung – Coloreo" : "Please confirm your sign-up – Coloreo",
    html
  );
}
