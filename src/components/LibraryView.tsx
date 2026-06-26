"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

type Item = { title_de: string; title_en: string; url: string; downloadsLeft: number; expired: boolean };
type Order = { orderNumber: string; date: string; items: Item[] };

export default function LibraryView({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [email, setEmail] = useState("");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setOrders(data.orders ?? []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={lookup} className="mx-auto flex max-w-md gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={dict.freebie.emailPlaceholder}
          className="flex-1 rounded-full border bg-white px-5 py-3 text-sm outline-none focus:border-primary"
        />
        <button type="submit" disabled={loading} className="btn-primary px-6 py-3 text-sm">
          {loading ? dict.common.loading : dict.common.download}
        </button>
      </form>

      {orders !== null && (
        <div className="mx-auto mt-10 max-w-2xl space-y-6">
          {orders.length === 0 ? (
            <p className="text-center text-muted">{dict.library.noPurchases}</p>
          ) : (
            orders.map((o) => (
              <div key={o.orderNumber} className="card p-5">
                <div className="mb-3 flex justify-between text-sm text-muted">
                  <span>{o.orderNumber}</span>
                  <span>{new Date(o.date).toLocaleDateString(locale === "de" ? "de-DE" : "en-IE")}</span>
                </div>
                <div className="space-y-2">
                  {o.items.map((it, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl border px-4 py-3">
                      <span className="font-display text-sm font-semibold">🎨 {locale === "en" ? it.title_en : it.title_de}</span>
                      {it.expired ? (
                        <span className="text-xs text-muted">{locale === "de" ? "abgelaufen" : "expired"}</span>
                      ) : (
                        <a href={it.url} className="btn-primary px-4 py-1.5 text-xs">
                          ⬇ {dict.common.download} ({it.downloadsLeft})
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
