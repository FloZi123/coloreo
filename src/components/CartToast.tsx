"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart/store";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export default function CartToast({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const { lastAdded } = useCart();
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (!lastAdded) return;
    setTitle(lastAdded.title);
    setShow(true);
    const t = setTimeout(() => setShow(false), 3500);
    return () => clearTimeout(t);
  }, [lastAdded]);

  if (!show) return null;
  return (
    <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 animate-[fadeIn_.2s_ease]">
      <div className="flex items-center gap-3 rounded-full border bg-surface px-5 py-3 shadow-lg">
        <span className="text-success">✓</span>
        <span className="text-sm font-medium">
          <span className="font-semibold">{title}</span> {dict.cartToast.added}
        </span>
        <Link href={`/${locale}/warenkorb`} className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark">
          {dict.cartToast.cartLabel} →
        </Link>
      </div>
    </div>
  );
}
