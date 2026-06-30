/**
 * Zentrale Multi-Currency-Konfiguration (EUR = Referenz/Anker).
 * - Feste „Schön-Preise" je Währung pro EUR-Preispunkt (Bücher + Bundles).
 * - Dokumentierter FX-Fallback (charm-gerundet) für nicht zugeordnete Beträge.
 * - Geo→Default-Mapping (GB→GBP, US→USD, CH→CHF, Eurozone/Fallback→EUR).
 * Keine Browser-/Server-Only-Imports → in Client UND Server nutzbar.
 */
export const CURRENCIES = ["EUR", "GBP", "USD", "CHF"] as const;
export type Currency = (typeof CURRENCIES)[number];
export const DEFAULT_CURRENCY: Currency = "EUR";
export const CURRENCY_COOKIE = "coloreo_currency";

export function isCurrency(x: unknown): x is Currency {
  return typeof x === "string" && (CURRENCIES as readonly string[]).includes(x);
}

/** Symbol, Intl-Format-Locale und Charm-Rundung (Nachkomma-Cent) je Währung. */
export const CURRENCY_CONFIG: Record<Currency, { symbol: string; intlLocale: string; charm: number }> = {
  EUR: { symbol: "€", intlLocale: "de-DE", charm: 99 },
  GBP: { symbol: "£", intlLocale: "en-GB", charm: 99 },
  USD: { symbol: "$", intlLocale: "en-US", charm: 99 },
  CHF: { symbol: "CHF", intlLocale: "de-CH", charm: 90 },
};

/** EU-Eurozone (ISO-3166-1 alpha-2) → EUR. */
const EUROZONE = new Set([
  "DE", "AT", "FR", "ES", "IT", "NL", "BE", "IE", "PT", "FI", "GR",
  "SK", "SI", "LU", "LV", "LT", "EE", "CY", "MT", "HR",
]);

/** Geo→Default-Währung. GB→GBP, US→USD, CH→CHF, Eurozone→EUR, sonst Fallback EUR. */
export function currencyForCountry(country?: string | null): Currency {
  const c = (country ?? "").trim().toUpperCase();
  if (c === "GB") return "GBP";
  if (c === "US") return "USD";
  if (c === "CH") return "CHF";
  if (EUROZONE.has(c)) return "EUR";
  return DEFAULT_CURRENCY;
}

/**
 * Feste Schön-Preise: EUR-Cent-Preispunkt → {EUR,GBP,USD,CHF} in Cent.
 * Bücher (499/599/699/799) und Bundles (1299/1499) – alle im Shop vorkommenden Punkte.
 */
export const PRICE_TABLE: Record<number, Record<Currency, number>> = {
  // Bücher
  499: { EUR: 499, GBP: 449, USD: 549, CHF: 490 },
  599: { EUR: 599, GBP: 499, USD: 599, CHF: 590 },
  699: { EUR: 699, GBP: 599, USD: 699, CHF: 690 },
  799: { EUR: 799, GBP: 699, USD: 799, CHF: 790 },
  // Bundles
  1299: { EUR: 1299, GBP: 1099, USD: 1399, CHF: 1290 },
  1499: { EUR: 1499, GBP: 1299, USD: 1599, CHF: 1490 },
};

/** Referenz-Wechselkurse (EUR→X) – nur für den dokumentierten Fallback (nicht für gemappte Punkte). */
const FX: Record<Currency, number> = { EUR: 1, GBP: 0.86, USD: 1.08, CHF: 0.97 };

/** Charm-Rundung auf x,99 (bzw. x,90 für CHF). */
function charmRound(cents: number, cur: Currency): number {
  const charm = CURRENCY_CONFIG[cur].charm;
  const whole = Math.max(0, Math.round((cents - charm) / 100));
  return whole * 100 + charm;
}

/**
 * Aktiver Preis eines EUR-Preispunkts in der Zielwährung.
 * Gemappte Punkte → fester Schön-Preis; sonst dokumentierter FX-Fallback (charm-gerundet).
 */
export function priceFor(eurCents: number, currency: Currency): number {
  const mapped = PRICE_TABLE[eurCents]?.[currency];
  if (mapped != null) return mapped;
  return charmRound(eurCents * FX[currency], currency);
}

/** Plain-FX-Umrechnung (ohne Charm-Rundung) – für Beträge wie fixe Coupons. */
export function convertFx(eurCents: number, currency: Currency): number {
  return Math.round(eurCents * FX[currency]);
}
