"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart/store";
import { capture } from "@/lib/analytics";
import { computeCart, formatPrice, linesInCurrency, couponInCurrency, type CouponInput, type PricingTier } from "@/lib/pricing";
import { priceFor } from "@/lib/currency";
import { useCurrency } from "@/components/CurrencyProvider";
import PaymentMarks from "@/components/PaymentMarks";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export default function CartView({
  tiers,
  locale,
  dict,
}: {
  tiers: PricingTier[];
  locale: Locale;
  dict: Dictionary;
}) {
  const { lines, setQuantity, remove, couponCode, setCoupon } = useCart();
  const { currency } = useCurrency();
  const [coupon, setCouponInput] = useState<CouponInput | null>(null);
  const [code, setCode] = useState(couponCode ?? "");
  const [couponMsg, setCouponMsg] = useState<string>("");
  const [checkingOut, setCheckingOut] = useState(false);

  // In aktive Währung umrechnen (gleiche Logik wie der Checkout-Server → konsistente Summen).
  const breakdown = useMemo(
    () => computeCart(linesInCurrency(lines, currency), tiers, couponInCurrency(coupon, currency)),
    [lines, tiers, coupon, currency]
  );

  async function applyCoupon() {
    if (!code.trim()) return;
    setCouponMsg("");
    const res = await fetch("/api/coupon/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (data.valid) {
      setCouponInput(data.coupon);
      setCoupon(data.coupon.code);
      setCouponMsg("✓");
    } else {
      setCouponInput(null);
      setCouponMsg("✕");
    }
  }

  async function checkout() {
    setCheckingOut(true);
    capture("checkout_started", { value: breakdown.totalCents / 100, currency, items: lines.length });
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines, couponCode: coupon?.code ?? null, locale }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else {
        setCheckingOut(false);
        alert(data.error ?? "Checkout error");
      }
    } catch {
      setCheckingOut(false);
    }
  }

  if (lines.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="text-lg text-muted">{dict.cart.empty}</p>
        <Link href={`/${locale}/kategorien`} className="btn-primary mt-5 inline-block px-6 py-3">
          {dict.common.continueShopping}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
      {/* LINES */}
      <div className="space-y-3">
        {lines.map((l) => (
          <div key={l.id} className="card flex items-center gap-4 p-4">
            <div className="flex h-16 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary-soft text-2xl">
              {l.kind === "bundle" ? "📦" : "🎨"}
            </div>
            <div className="flex-1">
              <p className="font-display text-sm font-semibold">{l.title}</p>
              <p className="text-xs text-muted">
                {formatPrice(priceFor(l.unitPriceCents, currency), locale, currency)}
                {l.kind === "bundle" ? "" : ` · ${dict.common.book}`}
              </p>
            </div>
            {l.kind === "book" ? (
              <div className="flex items-center gap-2">
                <button onClick={() => setQuantity(l.id, l.quantity - 1)} className="h-7 w-7 rounded-full border">−</button>
                <span className="w-6 text-center text-sm font-semibold">{l.quantity}</span>
                <button onClick={() => setQuantity(l.id, l.quantity + 1)} className="h-7 w-7 rounded-full border">+</button>
              </div>
            ) : (
              <span className="text-xs text-muted">×1</span>
            )}
            <div className="w-20 text-right font-semibold">{formatPrice(priceFor(l.unitPriceCents, currency) * l.quantity, locale, currency)}</div>
            <button onClick={() => remove(l.id)} className="text-muted hover:text-accent" aria-label={dict.common.remove}>✕</button>
          </div>
        ))}
      </div>

      {/* SUMMARY */}
      <div className="card h-fit space-y-4 p-6">
        <h2 className="font-display text-lg font-bold">{dict.cart.title}</h2>

        {breakdown.nextTier && (
          <div className="rounded-xl bg-accent-soft px-3 py-2 text-sm font-medium text-accent">
            🎉 {dict.cart.addMoreSave.replace("{n}", String(breakdown.nextTier.needed)).replace("{pct}", String(breakdown.nextTier.percent))}
          </div>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">{dict.common.subtotal}</span>
            <span>{formatPrice(breakdown.subtotalCents, locale, currency)}</span>
          </div>
          {breakdown.quantityDiscountCents > 0 && (
            <div className="flex justify-between text-success">
              <span>{dict.cart.quantityDiscount} (−{breakdown.quantityDiscountPercent}%)</span>
              <span>−{formatPrice(breakdown.quantityDiscountCents, locale, currency)}</span>
            </div>
          )}
          {breakdown.couponDiscountCents > 0 && (
            <div className="flex justify-between text-success">
              <span>{dict.common.discount} ({coupon?.code})</span>
              <span>−{formatPrice(breakdown.couponDiscountCents, locale, currency)}</span>
            </div>
          )}
        </div>

        {/* COUPON */}
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={dict.cart.couponPlaceholder}
            className="flex-1 rounded-full border px-4 py-2 text-sm outline-none focus:border-primary"
          />
          <button onClick={applyCoupon} className="rounded-full border px-4 text-sm font-semibold hover:border-primary">
            {dict.cart.apply} {couponMsg}
          </button>
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <span className="font-display font-bold">{dict.common.total}</span>
          <span className="font-display text-xl font-bold text-primary">{formatPrice(breakdown.totalCents, locale, currency)}</span>
        </div>
        {breakdown.totalDiscountCents > 0 && (
          <p className="text-center text-sm font-semibold text-success">
            {dict.cart.youSave} {formatPrice(breakdown.totalDiscountCents, locale, currency)}
          </p>
        )}

        <button onClick={checkout} disabled={checkingOut} className="btn-primary w-full py-3.5">
          {checkingOut ? dict.common.loading : "🔒 " + dict.cart.proceed}
        </button>
        <p className="text-center text-xs text-muted">{dict.common.instantDownload} · {dict.common.securePayment}</p>
        <PaymentMarks locale={locale} withLabel={false} className="justify-center" />
      </div>
    </div>
  );
}
