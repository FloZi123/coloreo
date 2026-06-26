"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/lib/cart/store";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

type Download = { title: string; url: string };

export default function DankeView({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const { clear } = useCart();
  const [status, setStatus] = useState<"loading" | "paid" | "pending">("loading");
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [orderNumber, setOrderNumber] = useState<string>("");
  const cleared = useRef(false);

  useEffect(() => {
    if (!cleared.current) {
      clear();
      cleared.current = true;
    }
    if (!sessionId) {
      setStatus("pending");
      return;
    }
    let tries = 0;
    let active = true;
    const poll = async () => {
      tries++;
      try {
        const res = await fetch(`/api/order/status?session_id=${sessionId}`);
        const data = await res.json();
        if (!active) return;
        if (data.orderNumber) setOrderNumber(data.orderNumber);
        if (data.status === "paid") {
          setStatus("paid");
          setDownloads(data.downloads ?? []);
          return;
        }
      } catch {}
      if (active && tries < 15) setTimeout(poll, 2000);
      else if (active) setStatus("pending");
    };
    poll();
    return () => {
      active = false;
    };
  }, [sessionId, clear]);

  return (
    <div className="container-page py-16">
      <div className="card mx-auto max-w-xl p-10 text-center">
        <span className="text-6xl">🎉</span>
        <h1 className="mt-4 font-display text-3xl font-bold">{dict.checkout.successTitle}</h1>
        {orderNumber && <p className="mt-2 text-sm text-muted">{dict.cart.title} · {orderNumber}</p>}
        <p className="mx-auto mt-3 max-w-md text-ink-soft">{dict.checkout.successText}</p>

        {status === "loading" && <p className="mt-6 animate-pulse text-muted">{dict.common.loading}</p>}

        {status === "paid" && downloads.length > 0 && (
          <div className="mt-8 space-y-3 text-left">
            {downloads.map((d, i) => (
              <a key={i} href={d.url} className="card flex items-center justify-between p-4 hover:border-primary">
                <span className="font-display font-semibold">🎨 {d.title}</span>
                <span className="btn-primary px-4 py-2 text-sm">⬇ {dict.common.download}</span>
              </a>
            ))}
          </div>
        )}

        {status === "pending" && (
          <p className="mt-6 text-sm text-ink-soft">
            {locale === "de"
              ? "Deine Bestätigung ist unterwegs. Du findest deine Downloads jederzeit in deiner Bibliothek."
              : "Your confirmation is on the way. You can find your downloads anytime in your library."}
          </p>
        )}

        <Link href={`/${locale}/bibliothek`} className="mt-8 inline-block text-sm font-semibold text-primary hover:underline">
          {dict.nav.library} →
        </Link>
      </div>
    </div>
  );
}
