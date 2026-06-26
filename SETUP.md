# Coloreo – Setup & Go-Live

Der Shop ist **voll funktionsfähig im Test-Modus**, sobald die folgenden Keys in `.env.local`
(lokal) bzw. in den **Vercel Environment Variables** (Produktion) eingetragen sind.

## 1. Pflicht-Keys (für funktionierenden Bestell-/Lieferablauf)

| Variable | Wo bekommen | Zweck |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Projekt **malbuch-shop** → Project Settings → API → `service_role` (secret) | Server schreibt Bestellungen, erzeugt Download-PDFs, Admin |
| `STRIPE_SECRET_KEY` | Stripe Dashboard (Test-Modus) → Developers → API keys → `sk_test_…` | Zahlung |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe → `pk_test_…` | Zahlung (Client) |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks → Endpoint anlegen auf `https://DEINE-DOMAIN/api/webhooks/stripe`, Event `checkout.session.completed` → `whsec_…` | Auftragserfüllung nach Zahlung |

> Bereits gesetzt: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## 2. Optionale Keys (Komfortfunktionen)

| Variable | Zweck | Ohne Key |
|---|---|---|
| `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`/`SMTP_FROM` | Kauf-/Freebie-Mails (nodemailer/SMTP, wie im NCO-Projekt – z. B. All-Inkl) | Mails werden geloggt, nicht versendet (Shop funktioniert weiter; Downloads auch auf Danke-Seite/Bibliothek) |
| `ANTHROPIC_API_KEY` | KI-Chatbot + Auto-Buch-Generierung | Chatbot meldet „nicht konfiguriert" |
| `ADMIN_EMAILS` | Komma-Liste der Admin-Logins | Default: florian.zinkl@rolling-space.de |

## 3. PayPal aktivieren
Im Stripe-Dashboard unter **Settings → Payment methods → PayPal** aktivieren (Test-Modus möglich).
Der Checkout bietet Karte + PayPal automatisch an.

## 4. Stripe-Webhook lokal testen
```
stripe login
stripe listen --forward-to localhost:3100/api/webhooks/stripe
```
Den angezeigten `whsec_…` als `STRIPE_WEBHOOK_SECRET` eintragen.

## 5. Vor echtem Go-Live (rechtlich)
- Echte Daten in Impressum / Datenschutz / AGB / Widerruf eintragen (Platzhalter im Admin → Rechtstexte bzw. `src/lib/legalContent.ts`).
- SMTP-Postfach einrichten/verbinden (z. B. dasselbe All-Inkl wie NCO oder ein neues `noreply@coloreo…`), SPF/DKIM der Absenderdomain setzen, `SMTP_FROM` auf eigene Domain.
- Stripe von Test- auf Live-Keys umstellen.
- Domain in Vercel verbinden, `NEXT_PUBLIC_SITE_URL` auf Live-Domain setzen.

## 6. Lokaler Start
```
npm install
npm run dev      # http://localhost:3100
```

## 7. Deployment auf Vercel
1. Repo zu GitHub pushen (oder Vercel direkt mit dem lokalen Repo verbinden).
2. In Vercel „New Project" → dieses Repo importieren (Framework: Next.js, erkannt).
3. **Environment Variables** aus `.env.local` in Vercel eintragen (alle Keys aus Abschnitt 1+2),
   `NEXT_PUBLIC_SITE_URL` auf die Vercel-/Live-Domain setzen.
4. Stripe-Webhook-Endpoint auf `https://DEINE-DOMAIN/api/webhooks/stripe` setzen und `whsec_…` eintragen.
5. Deploy. Danach Test-Kauf mit Stripe-Testkarte `4242 4242 4242 4242` durchführen.

## 7b. Magic-Link-Login (sichere Bibliothek)
- Supabase Dashboard → Authentication → URL Configuration: **Redirect URLs** ergänzen:
  `http://localhost:3100/auth/callback` und `https://DEINE-DOMAIN/auth/callback`.
- Supabase versendet die Login-Mails über seinen eigenen Dienst (im Free-Tier limitiert);
  für Produktion eigenes SMTP in Supabase → Auth → Emails hinterlegen.
- Newsletter ist **Double-Opt-in** (Bestätigungsmail). Rate-Limiting der öffentlichen APIs ist
  In-Memory (pro Instanz) – für harte Limits zentralen Store (Upstash/Supabase) andocken.
- Willkommens-Gutschein **WILLKOMMEN10** (10 %) ist angelegt und wird im Erstkäufer-Popup beworben.

## 8. Admin-Zugang
- URL: `/admin` · Passwort = `ADMIN_PASSWORD` (in `.env.local`, bitte ändern!).
- Bereiche: Dashboard, Bücher (voll editierbar + Cover-Upload + Durchblättern), Kategorien,
  Bundles, Bestellungen (mit Refund), Gutscheine, Leads & Newsletter, Support-Posteingang,
  Auto-Generator (inkl. **Buch aus Brief**: Thema/Stichpunkte/Kategorie → vollautomatisch).

## 9. Content nachproduzieren
- `npm run gen:covers` – Cover für alle Bücher (public/covers).
- `npm run gen:masters` – Mal-PDFs für Muster-Kategorien (public/masters).
- Repräsentative Motive (Tiere etc.): Bild-Provider in `src/lib/generator` andocken (siehe CONTENT.md).
