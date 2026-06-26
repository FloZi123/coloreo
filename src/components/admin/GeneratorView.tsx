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

export default function GeneratorView({ items }: { items: Item[] }) {
  const [pending, start] = useTransition();
  const [scanning, setScanning] = useState(false);
  const [msg, setMsg] = useState("");
  const router = useRouter();

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
