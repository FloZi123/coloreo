"use client";

import { useTransition } from "react";
import { createCategory, toggleCategory } from "@/app/admin/actions";

interface Cat { id: string; name_de: string; emoji: string | null; audience: string; is_active: boolean; bookCount: number }

export default function CategoriesManager({ categories }: { categories: Cat[] }) {
  const [pending, start] = useTransition();
  return (
    <div>
      <form action={createCategory} className="card mb-6 flex flex-wrap items-end gap-3 p-5">
        <label className="text-sm"><span className="mb-1 block text-xs text-muted">Emoji</span><input name="emoji" defaultValue="🎨" className="w-16 rounded-lg border px-3 py-2 text-center" /></label>
        <label className="text-sm"><span className="mb-1 block text-xs text-muted">Name (DE)</span><input name="name_de" required placeholder="z. B. Vögel" className="rounded-lg border px-3 py-2" /></label>
        <label className="text-sm"><span className="mb-1 block text-xs text-muted">Name (EN)</span><input name="name_en" placeholder="Birds" className="rounded-lg border px-3 py-2" /></label>
        <label className="text-sm"><span className="mb-1 block text-xs text-muted">Zielgruppe</span>
          <select name="audience" className="rounded-lg border px-3 py-2">
            <option value="adult">Erwachsene</option><option value="kids">Kinder</option><option value="all">Alle</option>
          </select>
        </label>
        <button type="submit" className="btn-primary px-5 py-2.5">+ Anlegen</button>
      </form>

      <div className={`card overflow-hidden ${pending ? "opacity-60" : ""}`}>
        <table className="w-full text-sm">
          <thead className="bg-primary-soft text-left text-xs uppercase text-ink-soft">
            <tr><th className="p-3">Kategorie</th><th className="p-3">Zielgruppe</th><th className="p-3">Bücher</th><th className="p-3">Aktiv</th></tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3 font-semibold">{c.emoji} {c.name_de}</td>
                <td className="p-3 text-muted">{c.audience === "kids" ? "Kinder" : c.audience === "adult" ? "Erwachsene" : "Alle"}</td>
                <td className="p-3 text-muted">{c.bookCount}</td>
                <td className="p-3"><button onClick={() => start(() => toggleCategory(c.id, c.is_active))} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${c.is_active ? "bg-success/15 text-success" : "bg-muted/15 text-muted"}`}>{c.is_active ? "aktiv" : "inaktiv"}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
