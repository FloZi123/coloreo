"use client";

import { useCart } from "@/lib/cart/store";
import type { Dictionary } from "@/i18n/dictionaries";

export default function AddBundleButton({
  id,
  slug,
  title,
  priceCents,
  dict,
}: {
  id: string;
  slug: string;
  title: string;
  priceCents: number;
  dict: Dictionary;
}) {
  const { addBundle, has } = useCart();
  const inCart = has(id);
  return (
    <button
      onClick={() => addBundle({ id, slug, title, unitPriceCents: priceCents, coverUrl: null })}
      className={`w-full rounded-full py-3.5 font-semibold ${inCart ? "bg-success text-white" : "btn-primary"}`}
    >
      {inCart ? "✓ " + dict.common.inCart : dict.common.addToCart}
    </button>
  );
}
