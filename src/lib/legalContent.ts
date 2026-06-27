import type { Locale } from "@/i18n/config";

type LegalKey = "impressum" | "datenschutz" | "agb" | "widerruf" | "kontakt";

const PH = "【 PLATZHALTER – vor Go-Live durch echte Angaben ersetzen 】";

const content: Record<LegalKey, Partial<Record<Locale, { title: string; html: string }>>> = {
  impressum: {
    de: {
      title: "Impressum",
      html: `<p>Angaben gemäß § 5 TMG:</p>
<p>${PH}<br/>Firmenname / Inhaber<br/>Straße &amp; Hausnummer<br/>PLZ Ort, Deutschland</p>
<p><strong>Vertreten durch:</strong> ${PH}</p>
<p><strong>Kontakt:</strong><br/>E-Mail: ${PH}<br/>Telefon: ${PH}</p>
<p><strong>Umsatzsteuer-ID:</strong> ${PH}</p>
<p><strong>Verantwortlich i.S.d. § 18 Abs. 2 MStV:</strong> ${PH}</p>
<p>Plattform der EU-Kommission zur Online-Streitbeilegung: https://ec.europa.eu/consumers/odr</p>`,
    },
    en: {
      title: "Imprint",
      html: `<p>Information pursuant to § 5 TMG (German Telemedia Act):</p>
<p>${PH}<br/>Company / Owner<br/>Street &amp; No.<br/>Postal code, City, Germany</p>
<p><strong>Contact:</strong> Email: ${PH} · Phone: ${PH}</p>
<p><strong>VAT ID:</strong> ${PH}</p>`,
    },
  },
  datenschutz: {
    de: {
      title: "Datenschutzerklärung",
      html: `<p>Diese Datenschutzerklärung informiert über die Verarbeitung personenbezogener Daten gemäß DSGVO.</p>
<h3>1. Verantwortlicher</h3><p>${PH}</p>
<h3>2. Erhobene Daten</h3><p>Beim Kauf: E-Mail-Adresse, Zahlungsdaten (über Stripe), Bestelldaten. Beim Newsletter: E-Mail-Adresse.</p>
<h3>3. Zahlungsabwicklung</h3><p>Die Zahlung erfolgt über Stripe Payments Europe Ltd. Es gelten deren Datenschutzbestimmungen.</p>
<h3>4. Hosting &amp; Speicherung</h3><p>Hosting über Vercel; Datenbank/Storage über Supabase (EU-Region).</p>
<h3>5. Reichweitenmessung</h3><p>Nur mit Ihrer Einwilligung (Cookie-Banner) nutzen wir PostHog (EU-Hosting) zur anonymen Statistik. Ohne Zustimmung findet keine Analyse statt; Sie können die Einwilligung jederzeit widerrufen. Keine Session-Recordings.</p>
<h3>6. Ihre Rechte</h3><p>Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch, Datenübertragbarkeit. Kontakt: ${PH}</p>`,
    },
    en: {
      title: "Privacy Policy",
      html: `<p>This privacy policy informs about the processing of personal data under the GDPR.</p>
<h3>1. Controller</h3><p>${PH}</p>
<h3>2. Data collected</h3><p>On purchase: email, payment data (via Stripe), order data. Newsletter: email.</p>
<h3>3. Payments</h3><p>Processed via Stripe Payments Europe Ltd.</p>
<h3>4. Hosting</h3><p>Vercel (hosting) and Supabase (database/storage, EU region).</p>
<h3>5. Analytics</h3><p>Only with your consent (cookie banner) we use PostHog (EU hosting) for anonymous analytics. No tracking without consent; you can withdraw anytime. No session recordings.</p>
<h3>6. Your rights</h3><p>Access, rectification, erasure, restriction, objection, portability. Contact: ${PH}</p>`,
    },
  },
  agb: {
    de: {
      title: "Allgemeine Geschäftsbedingungen",
      html: `<h3>§ 1 Geltungsbereich</h3><p>Diese AGB gelten für alle Käufe digitaler Malbücher (PDF-Dateien) über diesen Shop.</p>
<h3>§ 2 Vertragsschluss</h3><p>Mit Abschluss des Bezahlvorgangs kommt ein Kaufvertrag über die ausgewählten digitalen Produkte zustande.</p>
<h3>§ 3 Preise &amp; Zahlung</h3><p>Alle Preise verstehen sich inkl. gesetzlicher USt. Zahlung per Kreditkarte oder PayPal über Stripe.</p>
<h3>§ 4 Lieferung</h3><p>Die Lieferung erfolgt digital als Download-Link unmittelbar nach Zahlungseingang sowie per E-Mail.</p>
<h3>§ 5 Nutzungsrechte</h3><p>Der Käufer erhält ein einfaches, nicht übertragbares Nutzungsrecht zum privaten Gebrauch. Weiterverkauf und Weitergabe sind untersagt.</p>
<h3>§ 6 Widerrufsrecht</h3><p>Siehe Widerrufsbelehrung. ${PH}</p>`,
    },
    en: {
      title: "Terms & Conditions",
      html: `<h3>§ 1 Scope</h3><p>These terms apply to all purchases of digital coloring books (PDF) via this shop.</p>
<h3>§ 2 Contract</h3><p>A purchase contract is concluded upon completion of payment.</p>
<h3>§ 3 Prices &amp; payment</h3><p>All prices include statutory VAT. Payment via card or PayPal through Stripe.</p>
<h3>§ 4 Delivery</h3><p>Digital delivery via download link immediately after payment and by email.</p>
<h3>§ 5 License</h3><p>A simple, non-transferable license for private use. Resale and redistribution are prohibited.</p>`,
    },
  },
  widerruf: {
    de: {
      title: "Widerrufsbelehrung",
      html: `<p><strong>Digitale Inhalte:</strong> Bei Verträgen über die Lieferung digitaler Inhalte, die nicht auf einem körperlichen Datenträger geliefert werden, erlischt das Widerrufsrecht, wenn der Verbraucher ausdrücklich zugestimmt hat, dass mit der Ausführung vor Ablauf der Widerrufsfrist begonnen wird, und seine Kenntnis vom Verlust des Widerrufsrechts bestätigt hat.</p>
<p>Beim Kauf bestätigen Sie: „Ich stimme zu, dass die Ausführung sofort beginnt und mir bekannt ist, dass ich mein Widerrufsrecht mit Beginn des Downloads verliere."</p>
<p>${PH} (Anschrift für Widerruf, Muster-Widerrufsformular)</p>`,
    },
    en: {
      title: "Right of Withdrawal",
      html: `<p><strong>Digital content:</strong> For contracts on the supply of digital content not on a physical medium, the right of withdrawal expires once the consumer has expressly consented to the immediate performance and acknowledged the loss of the withdrawal right.</p>
<p>At checkout you confirm: "I agree that performance begins immediately and that I lose my right of withdrawal once the download starts."</p>`,
    },
  },
  kontakt: {
    de: {
      title: "Kontakt",
      html: `<p>Du erreichst uns per E-Mail: ${PH}</p><p>Oder nutze den Chat-Assistenten unten rechts – er hilft dir rund um die Uhr bei Fragen zu Bestellungen, Downloads und Produkten.</p>`,
    },
    en: {
      title: "Contact",
      html: `<p>Reach us by email: ${PH}</p><p>Or use the chat assistant in the bottom right – available around the clock for orders, downloads and products.</p>`,
    },
  },
};

export function getLegal(key: LegalKey, locale: Locale) {
  // Rechtstexte gibt es vorerst nur DE/EN → Fallback auf EN, dann DE.
  return content[key][locale] ?? content[key].en ?? content[key].de!;
}
export type { LegalKey };
