"use client";

import { useState, useTransition } from "react";
import { setBookStatus, toggleFeatured, updateBookPrice } from "@/app/admin/actions";
import { formatPrice } from "@/lib/pricing";

interface Row {
  id: string;
  slug: string;
  title_de: string;
  price_cents: number;
  status: string;
  is_featured: boolean;
  sales_count: number;
  source: string;
  cover_url: string | null;
  category: { name_de: string; emoji: string | null } | null;
}

export default function BooksTable({ books }: { books: Row[] }) {
  const [pending, start] = useTransition();
  const [filter, setFilter] = useState("");

  const rows = books.filter(
    (b) => b.title_de.toLowerCase().includes(filter.toLowerCase()) || (b.category?.name_de ?? "").toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Suchen …"
        className="mb-4 w-64 rounded-full border px-4 py-2 text-sm outline-none focus:border-primary"
      />
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-primary-soft text-left text-xs uppercase text-ink-soft">
            <tr>
              <th className="p-3">Buch</th>
              <th className="p-3">Kategorie</th>
              <th className="p-3">Preis</th>
              <th className="p-3">Status</th>
              <th className="p-3">Featured</th>
              <th className="p-3">Verkäufe</th>
            </tr>
          </thead>
          <tbody className={pending ? "opacity-60" : ""}>
            {rows.map((b) => (
              <tr key={b.id} className="border-t">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    {b.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.cover_url} alt="" className="h-10 w-8 rounded object-cover" />
                    ) : (
                      <span className="text-xl">🎨</span>
                    )}
                    <div>
                      <div className="font-semibold">{b.title_de}</div>
                      {b.source === "ai_generated" && <span className="text-[10px] text-primary">🤖 KI</span>}
                    </div>
                  </div>
                </td>
                <td className="p-3 text-muted">{b.category?.emoji} {b.category?.name_de}</td>
                <td className="p-3">
                  <input
                    type="number"
                    step="0.5"
                    defaultValue={(b.price_cents / 100).toFixed(2)}
                    onBlur={(e) => {
                      const v = Math.round(parseFloat(e.target.value) * 100);
                      if (v !== b.price_cents) start(() => updateBookPrice(b.id, v));
                    }}
                    className="w-20 rounded border px-2 py-1"
                  />
                </td>
                <td className="p-3">
                  <button
                    onClick={() => start(() => setBookStatus(b.id, b.status === "published" ? "draft" : "published"))}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      b.status === "published" ? "bg-success/15 text-success" : "bg-muted/15 text-muted"
                    }`}
                  >
                    {b.status}
                  </button>
                </td>
                <td className="p-3">
                  <button onClick={() => start(() => toggleFeatured(b.id, b.is_featured))} className="text-lg">
                    {b.is_featured ? "⭐" : "☆"}
                  </button>
                </td>
                <td className="p-3 font-semibold">{b.sales_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted">Preis ändern: Wert anpassen und Feld verlassen. {formatPrice(599)} = Standard.</p>
    </div>
  );
}
