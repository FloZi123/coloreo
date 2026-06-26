# Coloreo – Build-Status

**Marke:** Coloreo · „Mal dir deine Welt." / „Color your world."
**Stack:** Next.js 16 · Tailwind v4 · Supabase (Projekt `malbuch-shop`) · Stripe · Resend · Claude
**Sprachen:** DE (Default) + EN · **Live-URL:** lokal `http://localhost:3100`

## ✅ Fertig & verifiziert (ohne weitere Keys lauffähig)
- **Storefront** komplett: Startseite, 24 Kategorien, 48 Produktseiten, Warenkorb mit
  **Dynamic Pricing** (2→10 %, 3→20 %, 5→30 %, 10→40 %), **Bundle-Builder**, 3 kuratierte Bundles,
  Gutschein-Einlösung, Freebie-Funnel, Rechtstexte (Platzhalter), Sprachumschalter.
- **Content:** 48 gebrandete Cover (prozedurale Linienkunst) + 10 echte Mal-PDFs (24 Seiten, A4).
- **Admin** (`/admin`, Passwort-Login): Dashboard-KPIs, Bücher (Status/Preis/Featured),
  Bestellungen, Gutscheine anlegen/verwalten, Leads + CSV-Export, Auto-Generator-Queue.
- **KI-Chatbot** (Fallback aktiv ohne Key), **Auto-Gen-Engine** (Trend-Scan + Buch-Entwurf).
- **SEO:** i18n-Sitemap, robots, OpenGraph-Metadaten.

## 🔑 Aktiv, sobald Keys gesetzt (siehe SETUP.md)
- **Checkout & Auslieferung** (Stripe Karte/PayPal → Webhook → personalisiertes Wasserzeichen-PDF →
  signierter Download + Bibliothek + Resend-Mail): braucht `STRIPE_*` + `SUPABASE_SERVICE_ROLE_KEY`.
- **Admin-Daten** (Dashboard/Tabellen): brauchen `SUPABASE_SERVICE_ROLE_KEY` (zeigen sonst sauberen Hinweis).
- **Chatbot & Auto-Gen**: brauchen `ANTHROPIC_API_KEY`.
- **E-Mails**: brauchen `RESEND_API_KEY` (sonst werden sie geloggt).

## 📋 Vor echtem Go-Live (durch Florian)
- Stripe Test→Live, PayPal in Stripe aktivieren, Webhook-Endpoint anlegen.
- Echte Rechtstexte (Impressum/USt/AGB/Widerruf/Datenschutz) eintragen.
- Resend-Domain verifizieren, `EMAIL_FROM` + `NEXT_PUBLIC_SITE_URL` auf Domain.
- Admin-Passwort ändern. Domain in Vercel verbinden.
- Optional: Bild-Provider für repräsentative Motive (Tiere etc.) andocken (CONTENT.md).
