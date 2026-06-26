import AdminShell from "@/components/admin/AdminShell";
import { listOrders } from "@/lib/admin-data";
import { formatPrice } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function AdminOrders() {
  let orders;
  try {
    orders = await listOrders();
  } catch {
    return (
      <AdminShell>
        <div className="card p-8 text-center text-ink-soft">⚠️ SUPABASE_SERVICE_ROLE_KEY fehlt (siehe SETUP.md).</div>
      </AdminShell>
    );
  }
  return (
    <AdminShell>
      <h1 className="mb-6 font-display text-2xl font-bold">Bestellungen ({orders.length})</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-primary-soft text-left text-xs uppercase text-ink-soft">
            <tr>
              <th className="p-3">Nummer</th>
              <th className="p-3">E-Mail</th>
              <th className="p-3">Status</th>
              <th className="p-3">Rabatt</th>
              <th className="p-3">Summe</th>
              <th className="p-3">Datum</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-muted">Noch keine Bestellungen.</td></tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="p-3 font-mono text-xs">{o.order_number}</td>
                <td className="p-3">{o.customer_email}</td>
                <td className="p-3">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] ${o.status === "paid" ? "bg-success/15 text-success" : o.status === "refunded" ? "bg-accent-soft text-accent" : "bg-muted/15 text-muted"}`}>{o.status}</span>
                </td>
                <td className="p-3 text-muted">{o.discount_cents > 0 ? "−" + formatPrice(o.discount_cents) : "–"}</td>
                <td className="p-3 font-semibold">{formatPrice(o.total_cents)}</td>
                <td className="p-3 text-muted">{new Date(o.created_at).toLocaleString("de-DE")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
