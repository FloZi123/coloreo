"use client";

import { useTransition } from "react";
import { resolveTicket } from "@/app/admin/actions";

interface Ticket {
  id: string;
  customer_email: string | null;
  subject: string | null;
  summary: string | null;
  status: string;
  created_at: string;
}

export default function SupportInbox({ tickets }: { tickets: Ticket[] }) {
  const [pending, start] = useTransition();
  const open = tickets.filter((t) => t.status === "open");
  const resolved = tickets.filter((t) => t.status !== "open");

  const Card = (t: Ticket) => (
    <div key={t.id} className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-display font-semibold">{t.subject ?? "Support-Anfrage"}</div>
          <div className="text-sm text-muted">{t.customer_email ?? "ohne E-Mail"} · {new Date(t.created_at).toLocaleString("de-DE")}</div>
          <p className="mt-2 text-sm text-ink-soft">{t.summary}</p>
        </div>
        <button
          onClick={() => start(() => resolveTicket(t.id, t.status === "open"))}
          className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${t.status === "open" ? "btn-primary" : "border"}`}
        >
          {t.status === "open" ? "✓ Erledigt" : "Wieder öffnen"}
        </button>
      </div>
    </div>
  );

  return (
    <div className={pending ? "opacity-60" : ""}>
      <h2 className="mb-3 font-display font-bold">Offen ({open.length})</h2>
      <div className="space-y-3">{open.length ? open.map(Card) : <p className="text-sm text-muted">Keine offenen Tickets. 🎉</p>}</div>
      {resolved.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 font-display font-bold text-muted">Erledigt ({resolved.length})</h2>
          <div className="space-y-3 opacity-70">{resolved.map(Card)}</div>
        </>
      )}
    </div>
  );
}
