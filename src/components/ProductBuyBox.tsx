"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/store";
import { formatPrice } from "@/lib/pricing";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export default function ProductBuyBox({
  id,
  slug,
  title,
  priceCents,
  coverUrl,
  locale,
  dict,
}: {
  id: string;
  slug: string;
  title: string;
  priceCents: number;
  coverUrl: string | null;
  locale: Locale;
  dict: Dictionary;
}) {
  const { addBook, has } = useCart();
  const inCart = has(id);

  return (
    <div className="card p-6">
      <div className="font-display text-3xl font-bold text-primary">{formatPrice(priceCents, locale)}</div>
      <p className="mt-1 text-sm text-muted">{dict.common.instantDownload}</p>
      <button
        onClick={() => addBook({ id, slug, title, coverUrl, unitPriceCents: priceCents })}
        className={`mt-4 w-full rounded-full py-3.5 font-semibold ${inCart ? "bg-success text-white" : "btn-primary"}`}
      >
        {inCart ? "✓ " + dict.common.inCart : dict.common.addToCart}
      </button>
      <Link href={`/${locale}/warenkorb`} className="mt-2 block text-center text-sm font-semibold text-primary hover:underline">
        {dict.cart.proceed} →
      </Link>
      <ul className="mt-5 space-y-2 text-sm text-ink-soft">
        <li>✓ {dict.home.trustInstant}</li>
        <li>✓ {dict.product.formatValue}</li>
        <li>✓ {dict.home.trustSecure}</li>
      </ul>
    </div>
  );
}
