"use client";

interface Lead {
  email: string;
  source: string;
  locale: string;
  created_at: string;
}

export default function LeadsView({ leads }: { leads: Lead[] }) {
  function exportCsv() {
    const header = "email,source,locale,created_at\n";
    const rows = leads.map((l) => `${l.email},${l.source},${l.locale},${l.created_at}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "coloreo-leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <button onClick={exportCsv} className="btn-primary mb-4 px-5 py-2.5 text-sm">⬇ CSV exportieren ({leads.length})</button>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-primary-soft text-left text-xs uppercase text-ink-soft">
            <tr>
              <th className="p-3">E-Mail</th>
              <th className="p-3">Quelle</th>
              <th className="p-3">Sprache</th>
              <th className="p-3">Datum</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted">Noch keine Leads.</td></tr>}
            {leads.map((l, i) => (
              <tr key={i} className="border-t">
                <td className="p-3">{l.email}</td>
                <td className="p-3 text-muted">{l.source}</td>
                <td className="p-3 uppercase text-muted">{l.locale}</td>
                <td className="p-3 text-muted">{new Date(l.created_at).toLocaleDateString("de-DE")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
