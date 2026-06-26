import AdminShell from "@/components/admin/AdminShell";
import LeadsView from "@/components/admin/LeadsView";
import { listLeads } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export default async function AdminLeads() {
  let leads;
  try {
    leads = await listLeads();
  } catch {
    return (
      <AdminShell>
        <div className="card p-8 text-center text-ink-soft">⚠️ SUPABASE_SERVICE_ROLE_KEY fehlt (siehe SETUP.md).</div>
      </AdminShell>
    );
  }
  return (
    <AdminShell>
      <h1 className="mb-6 font-display text-2xl font-bold">Leads & Newsletter</h1>
      <LeadsView leads={leads} />
    </AdminShell>
  );
}
