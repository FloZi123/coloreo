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
    <div>
      <button
        onClick={() => addBook({ id, slug, title, coverUrl, unitPriceCents: priceCents })}
        className={`w-full rounded-full py-4 text-lg font-extrabold ${inCart ? "bg-success text-white" : "btn-primary"}`}
      >
        {inCart ? "✓ " + dict.common.inCart : `${dict.common.addToCart} · ${formatPrice(priceCents, locale)}`}
      </button>
      <Link href={`/${locale}/warenkorb`} className="mt-2 block text-center text-sm font-extrabold text-ink hover:text-primary">
        {dict.cart.proceed} →
      </Link>
      {process.env.NEXT_PUBLIC_PRICES_INCLUSIVE_TAX === "true" && (
        <p className="mt-2 text-center text-xs text-muted">{locale === "de" ? "inkl. gesetzl. USt." : "incl. VAT"}</p>
      )}
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-muted">
        <span>✓ {dict.home.trustInstant}</span>
        <span>✓ {dict.product.formatValue}</span>
        <span>✓ {dict.home.trustSecure}</span>
      </div>
    </div>
  );
}
