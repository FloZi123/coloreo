"use client";

import { useState, useTransition } from "react";
import { createBundle, toggleBundle, deleteBundle } from "@/app/admin/actions";
import { formatPrice } from "@/lib/pricing";

interface Bundle { id: string; title_de: string; price_cents: number | null; is_active: boolean; itemCount: number }
interface Book { id: string; title_de: string }

export default function BundlesManager({ bundles, books }: { bundles: Bundle[]; books: Book[] }) {
  const [pending, start] = useTransition();
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setPicked((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });

  return (
    <div>
      <form action={createBundle} className="card mb-6 p-5">
        <h2 className="mb-3 font-display font-bold">Neues Bundle</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input name="title_de" required placeholder="Titel (DE)" className="rounded-lg border px-3 py-2 text-sm" />
          <input name="title_en" placeholder="Titel (EN)" className="rounded-lg border px-3 py-2 text-sm" />
        </div>
        <textarea name="description_de" rows={2} placeholder="Beschreibung" className="mt-3 w-full rounded-lg border px-3 py-2 text-sm" />
        <input name="price" type="number" step="0.5" required placeholder="Bundle-Preis €" className="mt-3 w-40 rounded-lg border px-3 py-2 text-sm" />
        <div className="mt-3">
          <div className="mb-2 text-xs text-muted">Bücher auswählen ({picked.size}):</div>
          <div className="max-h-48 overflow-auto rounded-lg border p-2">
            {books.map((b) => (
              <label key={b.id} className="flex items-center gap-2 py-1 text-sm">
                <input type="checkbox" name="book_ids" value={b.id} checked={picked.has(b.id)} onChange={() => toggle(b.id)} />
                {b.title_de}
              </label>
            ))}
          </div>
        </div>
        <button type="submit" className="btn-primary mt-3 px-5 py-2.5">+ Bundle anlegen</button>
      </form>

      <div className={`card overflow-hidden ${pending ? "opacity-60" : ""}`}>
        <table className="w-full text-sm">
          <thead className="bg-primary-soft text-left text-xs uppercase text-ink-soft">
            <tr><th className="p-3">Bundle</th><th className="p-3">Bücher</th><th className="p-3">Preis</th><th className="p-3">Aktiv</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {bundles.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted">Noch keine Bundles.</td></tr>}
            {bundles.map((b) => (
              <tr key={b.id} className="border-t">
                <td className="p-3 font-semibold">{b.title_de}</td>
                <td className="p-3 text-muted">{b.itemCount}</td>
                <td className="p-3">{b.price_cents != null ? formatPrice(b.price_cents) : "–"}</td>
                <td className="p-3"><button onClick={() => start(() => toggleBundle(b.id, b.is_active))} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${b.is_active ? "bg-success/15 text-success" : "bg-muted/15 text-muted"}`}>{b.is_active ? "aktiv" : "inaktiv"}</button></td>
                <td className="p-3"><button onClick={() => start(() => deleteBundle(b.id))} className="text-muted hover:text-accent">✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
