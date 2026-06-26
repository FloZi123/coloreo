import AdminShell from "@/components/admin/AdminShell";
import CouponsTable from "@/components/admin/CouponsTable";
import { listCoupons } from "@/lib/admin-data";
import { createCoupon } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminCoupons() {
  let coupons;
  try {
    coupons = await listCoupons();
  } catch {
    return (
      <AdminShell>
        <div className="card p-8 text-center text-ink-soft">⚠️ SUPABASE_SERVICE_ROLE_KEY fehlt (siehe SETUP.md).</div>
      </AdminShell>
    );
  }
  return (
    <AdminShell>
      <h1 className="mb-6 font-display text-2xl font-bold">Gutscheine</h1>

      <form action={createCoupon} className="card mb-6 flex flex-wrap items-end gap-3 p-5">
        <label className="text-sm">
          <span className="mb-1 block text-xs text-muted">Code</span>
          <input name="code" required placeholder="SUMMER20" className="rounded-lg border px-3 py-2 uppercase" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-muted">Typ</span>
          <select name="type" className="rounded-lg border px-3 py-2">
            <option value="percent">Prozent %</option>
            <option value="fixed">Fixbetrag €</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-muted">Wert</span>
          <input name="value" type="number" step="0.5" required placeholder="20" className="w-24 rounded-lg border px-3 py-2" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-muted">Min. Bestellwert €</span>
          <input name="min_order" type="number" step="0.5" defaultValue="0" className="w-28 rounded-lg border px-3 py-2" />
        </label>
        <button type="submit" className="btn-primary px-5 py-2.5">+ Anlegen</button>
      </form>

      <CouponsTable coupons={coupons} />
    </AdminShell>
  );
}
