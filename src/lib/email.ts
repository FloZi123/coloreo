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

/** coloreo-Wortmarke (farbige o's) als Mail-Kopf. */
function layout(title: string, inner: string): string {
  const wm = `<span style="color:#FAF7F0">c</span><span style="color:#FF5A4D">o</span><span style="color:#FAF7F0">l</span><span style="color:#3B8EEA">o</span><span style="color:#FAF7F0">re</span><span style="color:#3FBF87">o</span>`;
  return `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;color:#221E1B">
    <div style="background:#221E1B;padding:18px 24px;border-radius:16px 16px 0 0;font-size:26px;font-weight:bold;letter-spacing:-1px">${wm}</div>
    <div style="border:1px solid #e3dacb;border-top:none;padding:24px;border-radius:0 0 16px 16px;background:#faf7f0">
      <h2 style="margin-top:0;font-weight:700">${title}</h2>${inner}
    </div>
    <p style="text-align:center;color:#9a9388;font-size:12px;margin-top:16px">© 2026 Coloreo · <a href="${SITE}" style="color:#FF5A4D;text-decoration:none">coloreo.shop</a></p>
  </div>`;
}

interface Msg {
  orderTitle: string; orderNumber: string; ready: string; downloadPdf: string; orderNote: string; orderSubject: (n: string) => string;
  freebieTitle: string; freebieConfirmText: string; freebieConfirmBtn: string; freebieDownloadBtn: string; freebieOnWay: string; freebieNote: string; freebieSubject: string;
}

const M: Record<Locale, Msg> = {
  de: {
    orderTitle: "Vielen Dank für deinen Kauf! 🎨", orderNumber: "Bestellnummer", ready: "Deine Malbücher stehen sofort bereit:", downloadPdf: "PDF herunterladen",
    orderNote: "Die Links sind 30 Tage gültig. Jede PDF ist personalisiert – nur für deinen privaten Gebrauch.", orderSubject: (n) => `Deine Coloreo-Bestellung ${n}`,
    freebieTitle: "Fast geschafft! 🎁", freebieConfirmText: "Bitte bestätige deine Anmeldung – dann erhältst du die Gratis-Vorlagen und Angebote:", freebieConfirmBtn: "Anmeldung bestätigen", freebieDownloadBtn: "Gratis-Vorlagen herunterladen", freebieOnWay: "Deine Gratis-Vorlagen sind unterwegs.", freebieNote: "Du hast dich auf Coloreo angemeldet. Falls nicht, ignoriere diese E-Mail einfach.", freebieSubject: "Bitte bestätige deine Anmeldung – Coloreo",
  },
  en: {
    orderTitle: "Thank you for your purchase! 🎨", orderNumber: "Order number", ready: "Your coloring books are ready:", downloadPdf: "Download PDF",
    orderNote: "Links valid for 30 days. Each PDF is personalized – for your private use only.", orderSubject: (n) => `Your Coloreo order ${n}`,
    freebieTitle: "Almost there! 🎁", freebieConfirmText: "Please confirm your sign-up to receive the free pages and offers:", freebieConfirmBtn: "Confirm sign-up", freebieDownloadBtn: "Download free pages", freebieOnWay: "Your free pages are on the way.", freebieNote: "You signed up on Coloreo. If this wasn't you, just ignore this email.", freebieSubject: "Please confirm your sign-up – Coloreo",
  },
  fr: {
    orderTitle: "Merci pour votre achat ! 🎨", orderNumber: "Numéro de commande", ready: "Vos livres de coloriage sont prêts :", downloadPdf: "Télécharger le PDF",
    orderNote: "Liens valables 30 jours. Chaque PDF est personnalisé – pour votre usage privé uniquement.", orderSubject: (n) => `Votre commande Coloreo ${n}`,
    freebieTitle: "Presque terminé ! 🎁", freebieConfirmText: "Confirmez votre inscription pour recevoir les pages gratuites et les offres :", freebieConfirmBtn: "Confirmer l'inscription", freebieDownloadBtn: "Télécharger les pages gratuites", freebieOnWay: "Vos pages gratuites arrivent.", freebieNote: "Vous vous êtes inscrit sur Coloreo. Si ce n'est pas vous, ignorez cet e-mail.", freebieSubject: "Confirmez votre inscription – Coloreo",
  },
  es: {
    orderTitle: "¡Gracias por tu compra! 🎨", orderNumber: "Número de pedido", ready: "Tus libros para colorear están listos:", downloadPdf: "Descargar PDF",
    orderNote: "Enlaces válidos 30 días. Cada PDF está personalizado, solo para uso privado.", orderSubject: (n) => `Tu pedido de Coloreo ${n}`,
    freebieTitle: "¡Casi listo! 🎁", freebieConfirmText: "Confirma tu suscripción para recibir las páginas gratis y las ofertas:", freebieConfirmBtn: "Confirmar suscripción", freebieDownloadBtn: "Descargar páginas gratis", freebieOnWay: "Tus páginas gratis están en camino.", freebieNote: "Te has suscrito en Coloreo. Si no fuiste tú, ignora este correo.", freebieSubject: "Confirma tu suscripción – Coloreo",
  },
  it: {
    orderTitle: "Grazie per il tuo acquisto! 🎨", orderNumber: "Numero d'ordine", ready: "I tuoi libri da colorare sono pronti:", downloadPdf: "Scarica il PDF",
    orderNote: "Link validi 30 giorni. Ogni PDF è personalizzato, solo per uso privato.", orderSubject: (n) => `Il tuo ordine Coloreo ${n}`,
    freebieTitle: "Ci siamo quasi! 🎁", freebieConfirmText: "Conferma l'iscrizione per ricevere le pagine gratuite e le offerte:", freebieConfirmBtn: "Conferma iscrizione", freebieDownloadBtn: "Scarica le pagine gratuite", freebieOnWay: "Le tue pagine gratuite sono in arrivo.", freebieNote: "Ti sei iscritto su Coloreo. Se non sei stato tu, ignora questa email.", freebieSubject: "Conferma la tua iscrizione – Coloreo",
  },
  nl: {
    orderTitle: "Bedankt voor je aankoop! 🎨", orderNumber: "Bestelnummer", ready: "Je kleurboeken staan klaar:", downloadPdf: "PDF downloaden",
    orderNote: "Links 30 dagen geldig. Elke PDF is gepersonaliseerd, alleen voor privégebruik.", orderSubject: (n) => `Je Coloreo-bestelling ${n}`,
    freebieTitle: "Bijna klaar! 🎁", freebieConfirmText: "Bevestig je aanmelding om de gratis pagina's en aanbiedingen te ontvangen:", freebieConfirmBtn: "Aanmelding bevestigen", freebieDownloadBtn: "Gratis pagina's downloaden", freebieOnWay: "Je gratis pagina's zijn onderweg.", freebieNote: "Je hebt je aangemeld op Coloreo. Was jij dit niet, negeer dan deze e-mail.", freebieSubject: "Bevestig je aanmelding – Coloreo",
  },
};

const BTN = "background:#FF5A4D;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:bold;display:inline-block";

export async function sendOrderConfirmation(opts: {
  email: string;
  orderNumber: string;
  locale: Locale;
  downloads: { title: string; url: string }[];
}): Promise<void> {
  const t = M[opts.locale] ?? M.en;
  const links = opts.downloads
    .map((d) => `<li style="margin:8px 0"><a href="${d.url}" style="color:#FF5A4D;font-weight:bold">${d.title}</a> – ${t.downloadPdf}</li>`)
    .join("");
  const html = layout(
    t.orderTitle,
    `<p>${t.orderNumber}: <strong>${opts.orderNumber}</strong></p>
     <p>${t.ready}</p>
     <ul>${links}</ul>
     <p style="color:#9a9388;font-size:13px">${t.orderNote}</p>`,
  );
  await send(opts.email, t.orderSubject(opts.orderNumber), html);
}

export async function sendFreebieEmail(opts: { email: string; locale: Locale; downloadUrl?: string; confirmUrl?: string }): Promise<void> {
  const t = M[opts.locale] ?? M.en;
  const cta = opts.confirmUrl
    ? `<p>${t.freebieConfirmText}</p><p><a href="${opts.confirmUrl}" style="${BTN}">${t.freebieConfirmBtn}</a></p>`
    : opts.downloadUrl
      ? `<p><a href="${opts.downloadUrl}" style="${BTN}">${t.freebieDownloadBtn}</a></p>`
      : `<p>${t.freebieOnWay}</p>`;
  const html = layout(t.freebieTitle, `${cta}<p style="color:#9a9388;font-size:13px">${t.freebieNote}</p>`);
  await send(opts.email, t.freebieSubject, html);
}
