"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@/i18n/config";

interface Cat { slug: string; name: string }

export default function SearchControls({ locale, categories }: { locale: Locale; categories: Cat[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const de = locale === "de";

  function update(next: Record<string, string>) {
    const p = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) p.set(k, v); else p.delete(k);
    }
    router.push(`${pathname}?${p.toString()}`);
  }

  const sel = "rounded-full border px-4 py-2 text-sm outline-none focus:border-primary";
  return (
    <div className="mb-8 flex flex-wrap items-center gap-3">
      <form
        onSubmit={(e) => { e.preventDefault(); update({ q }); }}
        className="flex flex-1 gap-2"
      >
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={de ? "Suchen …" : "Search …"} className="flex-1 rounded-full border px-5 py-2 text-sm outline-none focus:border-primary" />
        <button type="submit" className="btn-primary px-5 text-sm">🔍</button>
      </form>
      <select className={sel} value={params.get("audience") ?? ""} onChange={(e) => update({ audience: e.target.value })}>
        <option value="">{de ? "Alle Zielgruppen" : "All audiences"}</option>
        <option value="adult">{de ? "Erwachsene" : "Adults"}</option>
        <option value="kids">{de ? "Kinder" : "Kids"}</option>
      </select>
      <select className={sel} value={params.get("category") ?? ""} onChange={(e) => update({ category: e.target.value })}>
        <option value="">{de ? "Alle Kategorien" : "All categories"}</option>
        {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
      </select>
      <select className={sel} value={params.get("sort") ?? "popular"} onChange={(e) => update({ sort: e.target.value })}>
        <option value="popular">{de ? "Beliebt" : "Popular"}</option>
        <option value="new">{de ? "Neu" : "New"}</option>
        <option value="price_asc">{de ? "Preis ↑" : "Price ↑"}</option>
        <option value="price_desc">{de ? "Preis ↓" : "Price ↓"}</option>
      </select>
    </div>
  );
}
