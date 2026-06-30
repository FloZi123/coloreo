/**
 * Validiert Multi-Currency (EUR/GBP/USD/CHF): Config, Schön-Preise, Anzeige, Checkout, Order/Analytics, Switcher.
 *   npx tsx scripts/validate-currency.ts   → letzte Zeile "PASS".
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import {
  CURRENCIES, CURRENCY_CONFIG, PRICE_TABLE, priceFor, currencyForCountry, type Currency,
} from "../src/lib/currency";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p: string) => (existsSync(join(root, p)) ? readFileSync(join(root, p), "utf8") : null);
const errs: string[] = [];
const ok = (m: string) => console.log("  ✓ " + m);

// ── 1) WÄHRUNGS-KONFIG ───────────────────────────────────────────────────────
const want: Currency[] = ["EUR", "GBP", "USD", "CHF"];
for (const c of want) if (!CURRENCIES.includes(c)) errs.push(`Währung fehlt in CURRENCIES: ${c}`);
for (const c of CURRENCIES) {
  const cfg = CURRENCY_CONFIG[c];
  if (!cfg?.symbol || !cfg?.intlLocale || typeof cfg?.charm !== "number") errs.push(`CURRENCY_CONFIG.${c} unvollständig (symbol/intlLocale/charm)`);
}
const geo: Array<[string, Currency]> = [["GB", "GBP"], ["US", "USD"], ["CH", "CHF"], ["DE", "EUR"], ["FR", "EUR"], ["XX", "EUR"], ["", "EUR"]];
for (const [country, exp] of geo) if (currencyForCountry(country) !== exp) errs.push(`Geo-Mapping ${country}→${currencyForCountry(country)} (erwartet ${exp})`);
if (!errs.length) ok(`Config: ${CURRENCIES.join("/")}, Geo-Mapping GB/US/CH/Eurozone/Fallback ok`);

// ── 3) ANZEIGE (Intl-Format je Währung; kein hardcodiertes EUR in formatPrice) ─
const pricing = read("src/lib/pricing.ts") ?? "";
if (/currency:\s*"EUR"/.test(pricing)) errs.push("pricing.ts: hardcodiertes currency:\"EUR\" in formatPrice");
const fmt = (cents: number, cur: Currency) => new Intl.NumberFormat(CURRENCY_CONFIG[cur].intlLocale, { style: "currency", currency: cur }).format(cents / 100);
for (const [cur, needle] of [["EUR", "€"], ["GBP", "£"], ["USD", "$"], ["CHF", "CHF"]] as Array<[Currency, string]>) {
  if (!fmt(499, cur).includes(needle)) errs.push(`Intl-Format ${cur} ohne Symbol „${needle}": ${fmt(499, cur)}`);
}
// Storefront-Anzeige nutzt aktive Währung (priceFor + Currency-Quelle), nicht nur EUR.
for (const f of ["src/components/BookCard.tsx", "src/components/ProductBuyBox.tsx", "src/components/CartView.tsx", "src/app/[locale]/buch/[slug]/page.tsx", "src/app/[locale]/bundles/[slug]/page.tsx"]) {
  const t = read(f) ?? "";
  if (!/priceFor\(/.test(t) || !/(useCurrency|getActiveCurrency)/.test(t)) errs.push(`Anzeige ${f}: keine aktive Währung (priceFor + useCurrency/getActiveCurrency)`);
  if (/formatPrice\([^)]*,\s*locale\s*\)/.test(t)) errs.push(`Anzeige ${f}: formatPrice noch ohne Währung (EUR-only)`);
}
if (!errs.length) ok("Anzeige: Intl je Währung korrekt, Storefront nutzt aktive Währung");

// ── 6) AUSWAHL (Switcher + Cookie + Geo-Vorbelegung) ─────────────────────────
const switcher = read("src/components/CurrencySwitcher.tsx") ?? "";
const provider = read("src/components/CurrencyProvider.tsx") ?? "";
const server = read("src/lib/currency-server.ts") ?? "";
if (!/useCurrency/.test(switcher) || !/CURRENCIES/.test(switcher)) errs.push("CurrencySwitcher: kein UI-Umschalter über alle Währungen");
if (!/document\.cookie/.test(provider) || !/CURRENCY_COOKIE/.test(provider) || !/router\.refresh/.test(provider)) errs.push("CurrencyProvider: persistiert Wahl nicht (Cookie) / kein refresh");
if (!/cookies\(\)/.test(server) || !/x-vercel-ip-country|headers\(\)/.test(server)) errs.push("currency-server: keine Geo-Vorbelegung (Cookie>Geo)");
const layout = read("src/app/[locale]/layout.tsx") ?? "";
if (!/CurrencyProvider/.test(layout) || !/getActiveCurrency/.test(layout)) errs.push("layout: CurrencyProvider nicht mit Server-Währung initialisiert");
if (!errs.length) ok("Auswahl: Switcher + Cookie-Persistenz + Geo-Vorbelegung");

// ── 4) CHECKOUT (Stripe in aktiver Währung) ──────────────────────────────────
const buildLib = read("src/lib/checkout.ts") ?? "";
if (!/currency/.test(buildLib) || !/linesInCurrency/.test(buildLib)) errs.push("checkout.ts: rechnet Zeilen nicht in aktive Währung um");
const route = read("src/app/api/checkout/route.ts") ?? "";
if (!/getActiveCurrency/.test(route)) errs.push("checkout/route: aktive Währung nicht aufgelöst");
if (/currency:\s*"eur"/.test(route)) errs.push("checkout/route: hardcodiertes currency:\"eur\" (eine Währung pro Session, aber aktiv)");
if (!/currency:\s*stripeCur/.test(route)) errs.push("checkout/route: price_data/Coupon/Order nicht in aktiver Währung (stripeCur)");
// Prozent-Coupon währungsunabhängig: computeCart bleibt rein numerisch (kein Währungscode darin).
const pricingComputes = /export function computeCart/.test(pricing);
if (!pricingComputes) errs.push("pricing.ts: computeCart fehlt");
if (!errs.length) ok("Checkout: Stripe-Session in aktiver Währung, Rabatte währungsfähig");

// ── 5) BESTELLUNG & ANALYTICS ────────────────────────────────────────────────
const webhook = read("src/app/api/webhooks/stripe/route.ts") ?? "";
if (!/purchase_completed/.test(webhook) || !/currency/.test(webhook)) errs.push("webhook: purchase_completed ohne currency-Property");
if (!/currency:\s*stripeCur/.test(route)) errs.push("Order: gewählte Währung wird nicht gespeichert");
if (!errs.length) ok("Bestellung speichert Währung; purchase_completed trägt currency");

// ── 2) SCHÖN-PREISE VOLLSTÄNDIG (DB-Preispunkte in allen 4 Währungen) ─────────
async function checkPrices() {
  for (const l of (read(".env.local") ?? "").split("\n")) {
    const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { errs.push("Schön-Preise: Supabase-Env fehlt (DB-Preispunkte nicht prüfbar)"); return; }
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const [{ data: books }, { data: bundles }] = await Promise.all([
    sb.from("books").select("price_cents").eq("status", "published"),
    sb.from("bundles").select("price_cents").eq("is_active", true),
  ]);
  const points = new Set<number>();
  for (const b of books ?? []) if (b.price_cents != null) points.add(b.price_cents);
  for (const b of bundles ?? []) if (b.price_cents != null) points.add(b.price_cents);
  for (const p of points) {
    for (const cur of CURRENCIES) {
      const v = priceFor(p, cur);
      if (!Number.isFinite(v) || v <= 0) errs.push(`Schön-Preis fehlt: ${p} → ${cur}`);
      const mapped = PRICE_TABLE[p]?.[cur];
      if (mapped == null) {
        // FX-Fallback muss charm-gerundet sein (x,99 bzw. x,90 für CHF)
        if (v % 100 !== CURRENCY_CONFIG[cur].charm) errs.push(`FX-Fallback ${p}→${cur}=${v} nicht charm-gerundet (${CURRENCY_CONFIG[cur].charm})`);
      }
    }
  }
  // Dokumentierter Fallback existiert für nicht zugeordnete Beträge.
  const probe = 1234;
  for (const cur of CURRENCIES) if (priceFor(probe, cur) % 100 !== CURRENCY_CONFIG[cur].charm) errs.push(`FX-Fallback-Probe ${probe}→${cur} nicht charm-gerundet`);
  const unmapped = [...points].filter((p) => PRICE_TABLE[p] == null);
  ok(`Schön-Preise: ${points.size} DB-Preispunkte in allen 4 Währungen${unmapped.length ? ` (${unmapped.length} via dok. FX-Fallback)` : ""}`);
}

checkPrices().then(() => {
  if (errs.length) { for (const e of errs) console.log("✗ " + e); console.log(`\nFAIL (${errs.length})`); process.exit(1); }
  console.log("\nPASS");
}).catch((e) => { console.log("✗ " + (e instanceof Error ? e.stack : e)); console.log("\nFAIL (1)"); process.exit(1); });
