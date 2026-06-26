"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart/store";
import { resolveTier, formatPrice, type PricingTier } from "@/lib/pricing";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export interface BuilderBook {
  id: string;
  slug: string;
  title: string;
  priceCents: number;
  emoji: string;
}

export default function BundleBuilder({
  books,
  tiers,
  locale,
  dict,
}: {
  books: BuilderBook[];
  tiers: PricingTier[];
  locale: Locale;
  dict: Dictionary;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { addMany } = useCart();
  const router = useRouter();

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const chosen = books.filter((b) => selected.has(b.id));
  const count = chosen.length;
  const gross = chosen.reduce((s, b) => s + b.priceCents, 0);
  const { applied, next } = useMemo(() => resolveTier(count, tiers), [count, tiers]);
  const discountPct = applied?.discount_percent ?? 0;
  const total = Math.round(gross * (1 - discountPct / 100));
  const saved = gross - total;

  function addBundleToCart() {
    if (count === 0) return;
    addMany(chosen.map((b) => ({ id: b.id, slug: b.slug, title: b.title, unitPriceCents: b.priceCents, coverUrl: null })));
    router.push(`/${locale}/warenkorb`);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.7fr_1fr]">
      {/* PICKER */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {books.map((b) => {
          const isSel = selected.has(b.id);
          return (
            <button
              key={b.id}
              onClick={() => toggle(b.id)}
              className={`card relative flex flex-col items-center gap-1 p-3 text-center transition ${
                isSel ? "ring-2 ring-primary" : "hover:-translate-y-0.5"
              }`}
            >
              {isSel && <span className="absolute right-2 top-2 text-primary">✓</span>}
              <span className="text-3xl">{b.emoji}</span>
              <span className="line-clamp-2 text-[11px] font-semibold text-ink-soft">{b.title}</span>
              <span className="text-xs font-bold text-primary">{formatPrice(b.priceCents, locale)}</span>
            </button>
          );
        })}
      </div>

      {/* SUMMARY */}
      <div className="card sticky top-20 h-fit space-y-4 p-6">
        <h2 className="font-display text-lg font-bold">{dict.bundleBuilder.title}</h2>
        <div className="text-sm text-muted">
          <span className="text-2xl font-bold text-ink">{count}</span> {dict.common.books} {dict.bundleBuilder.selected}
        </div>

        {next ? (
          <div className="rounded-xl bg-accent-soft px-3 py-2 text-sm font-medium text-accent">
            🎉 {dict.bundleBuilder.nextTier.replace("{n}", String(next.needed)).replace("{pct}", String(next.percent))}
          </div>
        ) : applied ? (
          <div className="rounded-xl bg-success/10 px-3 py-2 text-sm font-medium text-success">
            ⭐ {dict.bundleBuilder.maxTier.replace("{pct}", String(discountPct))}
          </div>
        ) : null}

        <div className="space-y-2 border-t pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">{dict.common.subtotal}</span>
            <span>{formatPrice(gross, locale)}</span>
          </div>
          {discountPct > 0 && (
            <div className="flex justify-between text-success">
              <span>{dict.cart.quantityDiscount} (−{discountPct}%)</span>
              <span>−{formatPrice(saved, locale)}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-2 font-display font-bold">
            <span>{dict.bundleBuilder.yourPrice}</span>
            <span className="text-xl text-primary">{formatPrice(total, locale)}</span>
          </div>
        </div>

        <button onClick={addBundleToCart} disabled={count === 0} className="btn-primary w-full py-3.5 disabled:opacity-40">
          {dict.bundleBuilder.addBundle}
        </button>
      </div>
    </div>
  );
}
