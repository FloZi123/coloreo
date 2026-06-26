import { createPublicClient } from "@/lib/supabase/public";
import { computeCart, type CartLine, type CouponInput, type PricingTier } from "@/lib/pricing";
import { tTitle } from "@/lib/data";
import type { Locale } from "@/i18n/config";

export interface RawLine {
  kind: "book" | "bundle";
  id: string;
  quantity: number;
}

export interface BuiltOrder {
  lines: CartLine[];
  breakdown: ReturnType<typeof computeCart>;
  coupon: CouponInput | null;
}

/**
 * Baut eine vertrauenswürdige Bestellung aus rohen Warenkorb-Zeilen:
 * Preise/Titel kommen ausschließlich aus der DB, nie vom Client.
 */
export async function buildOrderFromCart(
  rawLines: RawLine[],
  couponCode: string | null,
  locale: Locale
): Promise<BuiltOrder> {
  const sb = createPublicClient();

  const bookIds = rawLines.filter((l) => l.kind === "book").map((l) => l.id);
  const bundleIds = rawLines.filter((l) => l.kind === "bundle").map((l) => l.id);

  const [{ data: books }, { data: bundles }, { data: tierRows }] = await Promise.all([
    bookIds.length
      ? sb.from("books").select("id, slug, title_de, title_en, price_cents").eq("status", "published").in("id", bookIds)
      : Promise.resolve({ data: [] as never[] }),
    bundleIds.length
      ? sb.from("bundles").select("id, slug, title_de, title_en, price_cents").eq("is_active", true).in("id", bundleIds)
      : Promise.resolve({ data: [] as never[] }),
    sb.from("pricing_tiers").select("min_quantity, discount_percent").eq("is_active", true).order("min_quantity"),
  ]);

  const bookMap = new Map((books ?? []).map((b) => [b.id, b]));
  const bundleMap = new Map((bundles ?? []).map((b) => [b.id, b]));

  const lines: CartLine[] = [];
  for (const raw of rawLines) {
    const qty = Math.max(1, Math.min(99, Math.floor(raw.quantity || 1)));
    if (raw.kind === "book") {
      const b = bookMap.get(raw.id);
      if (!b) continue;
      lines.push({ kind: "book", id: b.id, slug: b.slug, title: tTitle(b, locale), unitPriceCents: b.price_cents, quantity: qty });
    } else {
      const b = bundleMap.get(raw.id);
      if (!b || b.price_cents == null) continue;
      lines.push({ kind: "bundle", id: b.id, slug: b.slug, title: tTitle(b, locale), unitPriceCents: b.price_cents, quantity: 1 });
    }
  }

  // Coupon serverseitig validieren
  let coupon: CouponInput | null = null;
  if (couponCode) {
    const { data } = await sb.rpc("validate_coupon", { p_code: couponCode });
    if (data && data.length > 0) {
      coupon = {
        code: data[0].code,
        type: data[0].type,
        value: Number(data[0].value),
        min_order_cents: data[0].min_order_cents,
      };
    }
  }

  const tiers: PricingTier[] = tierRows ?? [];
  const breakdown = computeCart(lines, tiers, coupon);
  return { lines, breakdown, coupon: breakdown.couponError ? null : coupon };
}

export function generateOrderNumber(): string {
  // CLR-XXXXXX (zeitbasiert, ohne Date.now im Workflow-Kontext – hier API-Route, daher Date erlaubt)
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.floor(Math.random() * 46656).toString(36).toUpperCase().padStart(3, "0");
  return `CLR-${t}-${r}`;
}
