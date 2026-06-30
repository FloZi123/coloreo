"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CURRENCY_COOKIE, DEFAULT_CURRENCY, isCurrency, type Currency } from "@/lib/currency";

interface CurrencyState {
  currency: Currency;
  setCurrency: (c: Currency) => void;
}
const CurrencyContext = createContext<CurrencyState | null>(null);

/** Hält die aktive Währung clientseitig (Start = serverseitig aufgelöster Wert: Cookie>Geo>EUR). */
export function CurrencyProvider({ initial, children }: { initial: Currency; children: React.ReactNode }) {
  const [currency, setCur] = useState<Currency>(isCurrency(initial) ? initial : DEFAULT_CURRENCY);
  const router = useRouter();
  const setCurrency = useCallback(
    (c: Currency) => {
      if (!isCurrency(c)) return;
      setCur(c);
      // Wahl persistieren (1 Jahr) und Server-Komponenten (Preise) neu rendern.
      document.cookie = `${CURRENCY_COOKIE}=${c}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      router.refresh();
    },
    [router]
  );
  return <CurrencyContext.Provider value={{ currency, setCurrency }}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyState {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
