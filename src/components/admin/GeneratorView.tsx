"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveGeneration, rejectGeneration } from "@/app/admin/actions";

interface Item {
  id: string;
  suggested_title_de: string;
  suggested_title_en: string;
  rationale: string | null;
  status: string;
  generated_book_id: string | null;
  category: { name_de: string; emoji: string | null } | null;
}

const STATUS_LABEL: Record<string, string> = {
  suggested: "Vorschlag",
  generating: "wird erzeugt…",
  draft_ready: "Entwurf bereit",
  approved: "freigegeben",
  rejected: "abgelehnt",
};

interface Category {
  id: string;
  name_de: string;
  emoji: string | null;
  audience: string;
}

export default function GeneratorView({ items, categories }: { items: Item[]; categories: Category[] }) {
  const [pending, start] = useTransition();
  const [scanning, setScanning] = useState(false);
  const [msg, setMsg] = useState("");
  const router = useRouter();

  const [theme, setTheme] = useState("");
  const [bullets, setBullets] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [briefBusy, setBriefBusy] = useState(false);
  const [briefMsg, setBriefMsg] = useState("");

  async function generateFromBrief() {
    if (!theme.trim() || !categoryId) {
      setBriefMsg("⚠️ Thema und Kategorie sind nötig.");
      return;
    }
    setBriefBusy(true);
    setBriefMsg("Generiere Buch (Cover + 24 Seiten) – das dauert 1–3 Minuten …");
    try {
      const res = await fetch("/api/admin/generate/from-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme, bullets, categoryId }),
      });
      const data = await res.json();
      if (data.ok) {
        setBriefMsg("✓ Buch-Entwurf erstellt – unten in der Liste prüfen & freigeben.");
        setTheme("");
        setBullets("");
        router.refresh();
      } else {
        setBriefMsg(`⚠️ ${data.error ?? "Fehler"}`);
      }
    } catch {
      setBriefMsg("⚠️ Fehler bei der Generierung.");
    } finally {
      setBriefBusy(false);
    }
  }

  async function runScan() {
    setScanning(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/generate/scan", { method: "POST" });
      const data = await res.json();
      setMsg(data.error ? `⚠️ ${data.error}` : `✓ ${data.created ?? 0} neue Vorschläge erzeugt.`);
      router.refresh();
    } catch {
      setMsg("⚠️ Fehler beim Scan.");
    } finally {
      setScanning(false);
    }
  }

  async function generate(id: string) {
    setMsg("");
    try {
      const res = await fetch("/api/admin/generate/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      setMsg(data.error ? `⚠️ ${data.error}` : "✓ Entwurf erzeugt.");
      router.refresh();
    } catch {
      setMsg("⚠️ Fehler bei Generierung.");
    }
  }

  return (
    <div>
      <div className="card mb-6 p-5">
        <h2 className="font-display font-bold">✨ Neues Buch aus Brief erstellen</h2>
        <p className="mb-4 text-sm text-muted">Thema, Stichpunkte (ein Motiv pro Zeile) und Kategorie eingeben – Coloreo erzeugt vollautomatisch Cover (Stil B) + 24 Seiten, Schwierigkeit passend zur Zielgruppe.</p>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-xs text-muted">Thema *</span>
            <input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="z. B. Niedliche Waldtiere im Herbst" className="w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs text-muted">Kategorie *</span>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full rounded-lg border px-3 py-2">
              <option value="">— wählen —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.emoji} {c.name_de} ({c.audience === "kids" ? "Kinder" : c.audience === "adult" ? "Erwachsene" : "alle"})</option>
              ))}
            </select>
          </label>
        </div>
        <label className="mt-3 block text-sm">
          <span className="mb-1 block text-xs text-muted">Stichpunkte / Motive (ein Motiv pro Zeile, optional)</span>
          <textarea value={bullets} onChange={(e) => setBullets(e.target.value)} rows={4} placeholder={"Fuchs mit Blättern\nEichhörnchen mit Nuss\nIgel unter Pilzen\nEule auf Ast"} className="w-full rounded-lg border px-3 py-2 font-mono text-xs" />
        </label>
        <div className="mt-3 flex items-center gap-3">
          <button onClick={generateFromBrief} disabled={briefBusy} className="btn-primary px-5 py-2.5 disabled:opacity-50">
            {briefBusy ? "Generiere …" : "🎨 Buch generieren"}
          </button>
          {briefMsg && <span className="text-sm">{briefMsg}</span>}
        </div>
      </div>

      <div className="card mb-6 flex items-center justify-between p-5">
        <div>
          <h2 className="font-display font-bold">🤖 Trend-Analyse</h2>
          <p className="text-sm text-muted">Erkennt gut laufende Themen anhand des Kaufverhaltens und schlägt neue Bücher vor.</p>
        </div>
        <button onClick={runScan} disabled={scanning} className="btn-primary px-5 py-2.5">
          {scanning ? "Analysiere…" : "Trend-Scan starten"}
        </button>
      </div>
      {msg && <p className="mb-4 text-sm font-medium">{msg}</p>}

      <div className={`space-y-3 ${pending ? "opacity-60" : ""}`}>
        {items.length === 0 && <div className="card p-8 text-center text-muted">Noch keine Vorschläge. Starte einen Trend-Scan.</div>}
        {items.map((it) => (
          <div key={it.id} className="card flex items-center justify-between p-4">
            <div>
              <div className="font-display font-semibold">{it.category?.emoji} {it.suggested_title_de}</div>
              <div className="text-sm text-muted">{it.rationale}</div>
              <span className="mt-1 inline-block rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">{STATUS_LABEL[it.status] ?? it.status}</span>
            </div>
            <div className="flex gap-2">
              {(it.status === "suggested") && (
                <button onClick={() => generate(it.id)} className="rounded-full border px-4 py-2 text-sm font-semibold hover:border-primary">Entwurf erzeugen</button>
              )}
              {it.status === "draft_ready" && (
                <button onClick={() => start(() => approveGeneration(it.id))} className="btn-primary px-4 py-2 text-sm">✓ Freigeben</button>
              )}
              {(it.status === "suggested" || it.status === "draft_ready") && (
                <button onClick={() => start(() => rejectGeneration(it.id))} className="rounded-full border px-4 py-2 text-sm text-accent hover:bg-accent-soft">Ablehnen</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
