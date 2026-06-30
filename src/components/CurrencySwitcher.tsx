"use client";

import { CURRENCIES, type Currency } from "@/lib/currency";
import { useCurrency } from "@/components/CurrencyProvider";

/** Manueller Währungs-Umschalter (überschreibt die Geo-Vorbelegung, persistiert per Cookie). */
export default function CurrencySwitcher({ className = "" }: { className?: string }) {
  const { currency, setCurrency } = useCurrency();
  return (
    <select
      aria-label="Währung / Currency"
      value={currency}
      onChange={(e) => setCurrency(e.target.value as Currency)}
      className={`rounded-full border bg-paper px-2 py-1 text-sm font-semibold outline-none focus:border-primary ${className}`}
    >
      {CURRENCIES.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
