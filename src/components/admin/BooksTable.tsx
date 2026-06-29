"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setBookStatus, toggleFeatured, updateBook } from "@/app/admin/actions";
import { Emoji } from "@/components/Emoji";

interface Row {
  id: string;
  slug: string;
  title_de: string;
  title_en: string;
  description_de: string | null;
  description_en: string | null;
  page_count: number;
  price_cents: number;
  status: string;
  is_featured: boolean;
  sales_count: number;
  source: string;
  cover_url: string | null;
  category_id: string | null;
  category: { name_de: string; emoji: string | null } | null;
}

interface Cat {
  id: string;
  name_de: string;
  emoji: string | null;
}

export default function BooksTable({ books, categories }: { books: Row[]; categories: Cat[] }) {
  const [pending, start] = useTransition();
  const [filter, setFilter] = useState("");
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const router = useRouter();
  const previewBook = books.find((b) => b.slug === previewSlug);
  const editBook = books.find((b) => b.id === editId);

  const rows = books.filter(
    (b) => b.title_de.toLowerCase().includes(filter.toLowerCase()) || (b.category?.name_de ?? "").toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Suchen …" className="mb-4 w-64 rounded-full border px-4 py-2 text-sm outline-none focus:border-primary" />
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-primary-soft text-left text-xs uppercase text-ink-soft">
            <tr>
              <th className="p-3">Buch</th>
              <th className="p-3">Kategorie</th>
              <th className="p-3">Preis</th>
              <th className="p-3">Status</th>
              <th className="p-3">Featured</th>
              <th className="p-3">Verk.</th>
              <th className="p-3"></th>
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
                <td className="p-3 text-muted"><Emoji emoji={b.category?.emoji} label={b.category?.name_de} /> {b.category?.name_de}</td>
                <td className="p-3 font-semibold">{(b.price_cents / 100).toFixed(2)} €</td>
                <td className="p-3">
                  <button onClick={() => start(() => setBookStatus(b.id, b.status === "published" ? "draft" : "published"))} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${b.status === "published" ? "bg-success/15 text-success" : "bg-muted/15 text-muted"}`}>{b.status}</button>
                </td>
                <td className="p-3"><button onClick={() => start(() => toggleFeatured(b.id, b.is_featured))} className="text-lg">{b.is_featured ? "⭐" : "☆"}</button></td>
                <td className="p-3 font-semibold">{b.sales_count}</td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <button onClick={() => setEditId(b.id)} className="rounded-full border px-3 py-1 text-xs font-semibold hover:border-primary hover:text-primary">✏️ Edit</button>
                    <button onClick={() => setPreviewSlug(b.slug)} className="rounded-full border px-3 py-1 text-xs font-semibold hover:border-primary hover:text-primary">📖</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {previewBook && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/60 p-4 md:p-8" onClick={() => setPreviewSlug(null)}>
          <div className="mx-auto flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-surface" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b px-5 py-3">
              <span className="font-display font-semibold">📖 {previewBook.title_de}</span>
              <button onClick={() => setPreviewSlug(null)} className="rounded-full px-3 py-1 text-sm hover:bg-primary-soft">✕ Schließen</button>
            </div>
            <iframe src={`/api/admin/book-pdf?slug=${previewBook.slug}`} className="h-full w-full flex-1" title="Buch-Vorschau" />
          </div>
        </div>
      )}

      {editBook && (
        <EditModal book={editBook} categories={categories} onClose={() => setEditId(null)} onSaved={() => { setEditId(null); router.refresh(); }} />
      )}
    </div>
  );
}

function EditModal({ book, categories, onClose, onSaved }: { book: Row; categories: Cat[]; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    title_de: book.title_de, title_en: book.title_en,
    description_de: book.description_de ?? "", description_en: book.description_en ?? "",
    category_id: book.category_id ?? "", price: (book.price_cents / 100).toFixed(2), page_count: String(book.page_count),
  });
  const [saving, setSaving] = useState(false);
  const [cover, setCover] = useState(book.cover_url);
  const [uploading, setUploading] = useState(false);

  async function save() {
    setSaving(true);
    await updateBook(book.id, {
      title_de: f.title_de, title_en: f.title_en,
      description_de: f.description_de, description_en: f.description_en,
      category_id: f.category_id, price_cents: Math.round(parseFloat(f.price) * 100), page_count: parseInt(f.page_count, 10),
    });
    onSaved();
  }

  async function uploadCover(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("book_id", book.id);
    const res = await fetch("/api/admin/upload-cover", { method: "POST", body: fd });
    const data = await res.json();
    if (data.coverUrl) setCover(data.coverUrl);
    setUploading(false);
  }

  const field = "w-full rounded-lg border px-3 py-2 text-sm";
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/60 p-4" onClick={onClose}>
      <div className="my-8 w-full max-w-2xl rounded-2xl bg-surface p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Buch bearbeiten</h2>
          <button onClick={onClose} className="rounded-full px-3 py-1 text-sm hover:bg-primary-soft">✕</button>
        </div>
        <div className="grid gap-3">
          <div className="flex items-center gap-4">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt="" className="h-24 w-18 rounded-lg object-cover" />
            ) : <div className="flex h-24 w-18 items-center justify-center rounded-lg bg-primary-soft text-2xl">🎨</div>}
            <label className="cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold hover:border-primary">
              {uploading ? "Lädt …" : "Cover hochladen"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm"><span className="mb-1 block text-xs text-muted">Titel (DE)</span><input className={field} value={f.title_de} onChange={(e) => setF({ ...f, title_de: e.target.value })} /></label>
            <label className="text-sm"><span className="mb-1 block text-xs text-muted">Titel (EN)</span><input className={field} value={f.title_en} onChange={(e) => setF({ ...f, title_en: e.target.value })} /></label>
          </div>
          <label className="text-sm"><span className="mb-1 block text-xs text-muted">Beschreibung (DE)</span><textarea rows={2} className={field} value={f.description_de} onChange={(e) => setF({ ...f, description_de: e.target.value })} /></label>
          <label className="text-sm"><span className="mb-1 block text-xs text-muted">Beschreibung (EN)</span><textarea rows={2} className={field} value={f.description_en} onChange={(e) => setF({ ...f, description_en: e.target.value })} /></label>
          <div className="grid grid-cols-3 gap-3">
            <label className="text-sm"><span className="mb-1 block text-xs text-muted">Kategorie</span>
              <select className={field} value={f.category_id} onChange={(e) => setF({ ...f, category_id: e.target.value })}>
                <option value="">—</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name_de}</option>)}
              </select>
            </label>
            <label className="text-sm"><span className="mb-1 block text-xs text-muted">Preis €</span><input type="number" step="0.5" className={field} value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></label>
            <label className="text-sm"><span className="mb-1 block text-xs text-muted">Seiten</span><input type="number" className={field} value={f.page_count} onChange={(e) => setF({ ...f, page_count: e.target.value })} /></label>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-full border px-5 py-2 text-sm">Abbrechen</button>
          <button onClick={save} disabled={saving} className="btn-primary px-5 py-2 text-sm">{saving ? "Speichert …" : "Speichern"}</button>
        </div>
      </div>
    </div>
  );
}
