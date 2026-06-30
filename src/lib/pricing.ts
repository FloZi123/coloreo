import type { Locale } from "@/i18n/config";
import { priceFor, convertFx, CURRENCY_CONFIG, type Currency } from "@/lib/currency";

export type PricingTier = { min_quantity: number; discount_percent: number };

export type CartItemKind = "book" | "bundle";

export interface CartLine {
  kind: CartItemKind;
  id: string;
  slug: string;
  title: string;
  coverUrl?: string | null;
  unitPriceCents: number;
  quantity: number;
}

export interface CouponInput {
  code: string;
  type: "percent" | "fixed";
  value: number; // percent (0-100) oder Euro-Betrag
  min_order_cents: number;
}

export interface CartBreakdown {
  bookUnits: number;
  subtotalCents: number;
  quantityDiscountPercent: number;
  quantityDiscountCents: number;
  couponDiscountCents: number;
  totalDiscountCents: number;
  totalCents: number;
  appliedTier: PricingTier | null;
  nextTier: { needed: number; percent: number } | null;
  couponError?: string;
}

/** Höchste passende Mengenrabatt-Stufe für eine Anzahl Bücher. */
export function resolveTier(
  bookUnits: number,
  tiers: PricingTier[]
): { applied: PricingTier | null; next: { needed: number; percent: number } | null } {
  const sorted = [...tiers].sort((a, b) => a.min_quantity - b.min_quantity);
  let applied: PricingTier | null = null;
  let next: { needed: number; percent: number } | null = null;
  for (const t of sorted) {
    if (bookUnits >= t.min_quantity) {
      applied = t;
    } else {
      next = { needed: t.min_quantity - bookUnits, percent: t.discount_percent };
      break;
    }
  }
  return { applied, next };
}

/**
 * Zentrale Preisberechnung.
 * - Mengenrabatt gilt auf die Summe der Einzel-Bücher (kind === "book").
 * - Kuratierte Bundles (kind === "bundle") haben einen Festpreis, kein Mengenrabatt.
 * - Gutschein wird nach dem Mengenrabatt auf die Zwischensumme angewendet.
 */
export function computeCart(
  lines: CartLine[],
  tiers: PricingTier[],
  coupon?: CouponInput | null
): CartBreakdown {
  const bookLines = lines.filter((l) => l.kind === "book");
  const bundleLines = lines.filter((l) => l.kind === "bundle");

  const bookUnits = bookLines.reduce((n, l) => n + l.quantity, 0);
  const bookSubtotal = bookLines.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0);
  const bundleSubtotal = bundleLines.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0);
  const subtotalCents = bookSubtotal + bundleSubtotal;

  const { applied, next } = resolveTier(bookUnits, tiers);
  const quantityDiscountPercent = applied?.discount_percent ?? 0;
  const quantityDiscountCents = Math.round((bookSubtotal * quantityDiscountPercent) / 100);

  const afterQuantity = subtotalCents - quantityDiscountCents;

  let couponDiscountCents = 0;
  let couponError: string | undefined;
  if (coupon) {
    if (afterQuantity < coupon.min_order_cents) {
      couponError = "min_order";
    } else if (coupon.type === "percent") {
      couponDiscountCents = Math.round((afterQuantity * coupon.value) / 100);
    } else {
      couponDiscountCents = Math.min(Math.round(coupon.value * 100), afterQuantity);
    }
  }

  const totalDiscountCents = quantityDiscountCents + couponDiscountCents;
  const totalCents = Math.max(0, subtotalCents - totalDiscountCents);

  return {
    bookUnits,
    subtotalCents,
    quantityDiscountPercent,
    quantityDiscountCents,
    couponDiscountCents,
    totalDiscountCents,
    totalCents,
    appliedTier: applied,
    nextTier: next,
    couponError,
  };
}

/**
 * Formatiert einen Betrag (in kleinster Einheit) in der angegebenen Währung.
 * Das Intl-Format folgt der WÄHRUNG (korrektes Symbol/Trennzeichen je Currency), nicht der UI-Sprache.
 * `currency` default EUR (Referenz) – Storefront übergibt die AKTIVE Währung.
 */
export function formatPrice(cents: number, _locale: Locale = "de", currency: Currency = "EUR"): string {
  const cfg = CURRENCY_CONFIG[currency];
  return new Intl.NumberFormat(cfg.intlLocale, { style: "currency", currency }).format(cents / 100);
}

/** EUR-Cent-Zeilen → Zielwährung (gleiche Umrechnung in Anzeige UND Checkout → konsistente Summen). */
export function linesInCurrency(lines: CartLine[], currency: Currency): CartLine[] {
  return lines.map((l) => ({ ...l, unitPriceCents: priceFor(l.unitPriceCents, currency) }));
}

/**
 * Coupon in die Zielwährung umrechnen: fixer Betrag + Mindestbestellwert via FX;
 * Prozent-Coupons bleiben währungsunabhängig (nur Schwelle wird umgerechnet).
 */
export function couponInCurrency(coupon: CouponInput | null, currency: Currency): CouponInput | null {
  if (!coupon) return null;
  return {
    ...coupon,
    value: coupon.type === "fixed" ? convertFx(Math.round(coupon.value * 100), currency) / 100 : coupon.value,
    min_order_cents: convertFx(coupon.min_order_cents, currency),
  };
}
