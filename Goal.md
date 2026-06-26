# Goal — Malbuch-Webshop

> Stand: 2026-06-26 · Vollständige Spezifikation als Grundlage für den Bau.
> Eigentümer: Florian Zinkl

## Vision / Ziel

Ein **sehr gut verkaufender, zweisprachiger Webshop für digitale Malbücher** mit
breiter Trend-Kategorienauswahl (20+), komplettem Bestell- und Zahlungsablauf,
automatischem PDF-Versand, ausgeklügelter Bundle-/Dynamic-Pricing-Logik,
KI-Support-Chatbot und vollständigem Admin-Backend.

**Output-Ziele:** Fertiger Webshop · fertige (KI-generierte) Malbücher · Umsatz.

---

## 1. Markt & Produkt

- **Sprachen:** Zweisprachig **DE (Default) + EN**
- **Währung:** EUR
- **Zielgruppe:** Kern **Erwachsene / Anti-Stress**; zweite Säule **Kinder / Familie**
- **Format:** **Nur digital (PDF-Download)**; Print-on-Demand architektonisch vorbereitet (später nachrüstbar)
- **Content-Quelle:** **KI-generiert** (Line-Art via Bild-KI, automatisch zu PDFs montiert)
- **Launch-Umfang:** **20+ Kategorien × je 2–3 Bücher** (~50–60 Bücher) → wirkt sofort wie ein großer Shop

## 2. Pricing & Umsatzhebel

- **Einzelpreis:** 4,99–7,99 € (Impulskauf-Zone)
- **Bundle-Logik (3 Mechaniken kombiniert):**
  - **Mengenrabatt-Staffel** (z. B. 3 Bücher −20 %, 5 −30 %) — dynamisch
  - **Kuratierte Themen-Bundles** (z. B. „Tier-Kollektion", „Mandala-Megapack")
  - **Build-your-own-Bundle** mit Live-Preisanzeige
- **Abo:** Kein Abo
- **Freebie-Funnel (zentral):** Gratis-Probeseiten gegen E-Mail → Newsletter-Automation (stärkster organischer Wachstumshebel)

## 3. Checkout & Lieferung

- **Zahlung (Stripe):** Kartenzahlung + PayPal
- **Konten:** **Gast-Checkout** + optionales Konto (Magic-Link, Supabase Auth) für „Meine Bibliothek"
- **PDF-Schutz:** **Personalisiertes Wasserzeichen** (Käufer-E-Mail + Bestellnr.) je PDF
- **Download:** Signierte, ablaufende Download-Links (Supabase Storage)
- **E-Mail (Resend):** Kaufbestätigung, Download-Link, Freebie- & Newsletter-Mails

## 4. KI-Features

- **Support-Chatbot (Claude):**
  - FAQ & Hilfe (Download, Formate, Drucken, Zahlung, Widerruf)
  - Produktberatung / Empfehlung (aktiver Verkaufshelfer)
  - Bestell- / Download-Hilfe (Bestellung finden, Link erneut senden)
  - Eskalation an Florian (Ticket/E-Mail bei kniffligen Fällen)
- **Auto-Generierung neuer Bücher anhand Kaufverhalten:**
  - System erkennt gut laufende Themen → erzeugt automatisch neue Buch-**Entwürfe**
  - **Freigabe-Workflow:** Entwurf (Buch + Cover + Texte) → **Florians Freigabe per Klick** im Backend

## 5. Admin-Backend

- **Produkt- & Content-Verwaltung:** Bücher/Kategorien anlegen, PDFs & Cover hochladen, Previews, Preise pflegen
- **Bestellungen & Umsatz-Dashboard:** alle Bestellungen, KPIs, Top-Seller, Stripe-Abgleich, Refunds auslösen
- **Bundle- & Rabatt-Steuerung:** Mengenstaffeln, Themen-Bundles, Gutscheincodes/Aktionen ohne Code
- **Kunden & Newsletter:** Kundenliste, Newsletter-Abonnenten, Freebie-Leads, Export
- **Auto-Gen-Freigabe-Queue:** generierte Buch-Entwürfe prüfen & veröffentlichen

## 6. Infrastruktur & Recht

- **Supabase:** Neues, **getrenntes** Projekt (DB / Auth / Storage)
- **Hosting:** Eigenes **Vercel**-Deployment nur für den Shop
- **Stripe:** **Test-Modus**, voll funktionsfähig; Live-Schaltung später mit Live-Keys
- **Recht:** Platzhalter für Impressum / USt / AGB / Widerruf — echte Daten vor Go-Live durch Florian
  - Rechtsträger/Steuerstatus: später final geklärt

## 7. Tech-Stack

| Bereich        | Wahl                                             |
|----------------|--------------------------------------------------|
| Framework      | Next.js 15 (App Router)                          |
| Styling        | Tailwind CSS                                      |
| i18n           | next-intl (DE/EN)                                |
| Datenbank/Auth | Supabase (Postgres, Auth, Storage)               |
| Zahlung        | Stripe (Checkout/Payment Element, Webhooks)      |
| E-Mail         | Resend                                           |
| KI             | Claude API (Chatbot + Auto-Gen-Engine)           |
| PDF            | Serverseitige Erzeugung + Wasserzeichen          |
| Hosting        | Vercel                                            |

---

## 8. Bauplan (Phasen)

1. **Fundament** — Repo, Next.js-Grundgerüst, i18n, Branding (3 Namens-/Design-Vorschläge), Supabase-Projekt + Vercel anlegen, Datenmodell (Kategorien, Bücher, Bundles, Bestellungen, Kunden, Leads)
2. **Storefront** — Startseite, Kategorie-/Produktseiten, Previews, Warenkorb mit Live-Bundle-Pricing, Build-your-own-Bundle, Freebie-Funnel
3. **Checkout & Lieferung** — Stripe (Karte/PayPal), Webhooks, PDF-Wasserzeichen, signierte Downloads, „Meine Bibliothek", Resend-Mails
4. **Content-Produktion** — KI-Pipeline für Line-Art → PDF; 20+ Kategorien × 2–3 Bücher inkl. Cover & Texte (DE/EN)
5. **Admin-Backend** — alle Module + Auto-Gen-Freigabe-Queue
6. **KI-Support-Chatbot** + **Auto-Gen-Engine** (Kaufverhalten → Buchentwürfe)
7. **Politur & Übergabe** — SEO, Performance, Go-Live-Checkliste

---

## 9. Offene Punkte vor Go-Live (durch Florian beizubringen)

- [ ] Stripe-Live-Keys (Live-Account verifiziert, PayPal aktiviert)
- [ ] Impressum-, USt-/Steuer- und Firmendaten (Rechtsträger final)
- [ ] AGB, Widerrufsbelehrung (digitale Güter), Datenschutzerklärung
- [ ] Domain
- [ ] Finaler Markenname & Design (aus 3 Vorschlägen wählen)
- [ ] Resend-Domain-Verifizierung (SPF/DKIM)
