"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import type { CartLine } from "@/lib/pricing";

const STORAGE_KEY = "malbuch_cart_v1";

interface CartState {
  lines: CartLine[];
  couponCode: string | null;
  addBook: (line: Omit<CartLine, "kind" | "quantity">) => void;
  addBundle: (line: Omit<CartLine, "kind" | "quantity">) => void;
  addMany: (lines: Array<Omit<CartLine, "kind" | "quantity">>) => void;
  remove: (id: string) => void;
  setQuantity: (id: string, qty: number) => void;
  setCoupon: (code: string | null) => void;
  clear: () => void;
  count: number;
  has: (id: string) => boolean;
  lastAdded: { title: string; at: number } | null;
}

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [lastAdded, setLastAdded] = useState<{ title: string; at: number } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setLines(parsed.lines ?? []);
        setCouponCode(parsed.couponCode ?? null);
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ lines, couponCode }));
  }, [lines, couponCode, hydrated]);

  const addBook = useCallback((line: Omit<CartLine, "kind" | "quantity">) => {
    setLastAdded({ title: line.title, at: Date.now() });
    setLines((prev) => {
      const existing = prev.find((l) => l.id === line.id);
      if (existing) {
        return prev.map((l) => (l.id === line.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...prev, { ...line, kind: "book", quantity: 1 }];
    });
  }, []);

  const addBundle = useCallback((line: Omit<CartLine, "kind" | "quantity">) => {
    setLastAdded({ title: line.title, at: Date.now() });
    setLines((prev) => {
      if (prev.some((l) => l.id === line.id)) return prev;
      return [...prev, { ...line, kind: "bundle", quantity: 1 }];
    });
  }, []);

  const addMany = useCallback((newLines: Array<Omit<CartLine, "kind" | "quantity">>) => {
    if (newLines.length) setLastAdded({ title: `${newLines.length} Bücher`, at: Date.now() });
    setLines((prev) => {
      const map = new Map(prev.map((l) => [l.id, l]));
      for (const line of newLines) {
        const existing = map.get(line.id);
        if (existing) map.set(line.id, { ...existing, quantity: existing.quantity + 1 });
        else map.set(line.id, { ...line, kind: "book", quantity: 1 });
      }
      return Array.from(map.values());
    });
  }, []);

  const remove = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const setQuantity = useCallback((id: string, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.id !== id)
        : prev.map((l) => (l.id === id ? { ...l, quantity: qty } : l))
    );
  }, []);

  const setCoupon = useCallback((code: string | null) => setCouponCode(code), []);
  const clear = useCallback(() => {
    setLines([]);
    setCouponCode(null);
  }, []);

  const count = useMemo(() => lines.reduce((n, l) => n + l.quantity, 0), [lines]);
  const has = useCallback((id: string) => lines.some((l) => l.id === id), [lines]);

  const value: CartState = {
    lines,
    couponCode,
    addBook,
    addBundle,
    addMany,
    remove,
    setQuantity,
    setCoupon,
    clear,
    count,
    has,
    lastAdded,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
