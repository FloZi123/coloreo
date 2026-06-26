import AdminShell from "@/components/admin/AdminShell";
import { getDashboard } from "@/lib/admin-data";
import { formatPrice } from "@/lib/pricing";

export const dynamic = "force-dynamic";

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-muted">{sub}</div>}
    </div>
  );
}

export default async function AdminDashboard() {
  let d;
  try {
    d = await getDashboard();
  } catch {
    return (
      <AdminShell>
        <div className="card p-8 text-center text-ink-soft">
          ⚠️ <strong>SUPABASE_SERVICE_ROLE_KEY</strong> fehlt. Bitte in <code>.env.local</code> eintragen (siehe SETUP.md), dann lädt das Dashboard.
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <h1 className="mb-6 font-display text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Kpi label="Umsatz" value={formatPrice(d.revenueCents)} sub={`${d.ordersPaid} bezahlte Bestellungen`} />
        <Kpi label="Ø Bestellwert" value={formatPrice(d.aovCents)} />
        <Kpi label="Offene Bestellungen" value={String(d.ordersPending)} />
        <Kpi label="Kunden" value={String(d.customersCount)} />
        <Kpi label="Leads / Newsletter" value={String(d.leadsCount)} />
        <Kpi label="Bezahlte Bestellungen" value={String(d.ordersPaid)} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 font-display font-bold">🔥 Top-Seller</h2>
          {d.topBooks.length === 0 ? (
            <p className="text-sm text-muted">Noch keine Verkäufe.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {d.topBooks.map((b, i) => (
                <li key={i} className="flex justify-between border-b py-1.5">
                  <span>{b.title_de}</span>
                  <span className="font-semibold">{b.sales_count}×</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <h2 className="mb-3 font-display font-bold">🧾 Letzte Bestellungen</h2>
          {d.recent.length === 0 ? (
            <p className="text-sm text-muted">Noch keine Bestellungen.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {d.recent.map((o, i) => (
                <li key={i} className="flex items-center justify-between border-b py-1.5">
                  <span className="text-muted">{o.order_number}</span>
                  <span className="flex-1 truncate px-2">{o.customer_email}</span>
                  <span className={`mr-2 rounded-full px-2 py-0.5 text-[11px] ${o.status === "paid" ? "bg-success/15 text-success" : "bg-muted/15 text-muted"}`}>{o.status}</span>
                  <span className="font-semibold">{formatPrice(o.total_cents)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
