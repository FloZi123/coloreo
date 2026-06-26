import AdminShell from "@/components/admin/AdminShell";
import SupportInbox from "@/components/admin/SupportInbox";
import { listSupportTickets } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export default async function AdminSupport() {
  let tickets;
  try {
    tickets = await listSupportTickets();
  } catch {
    return (
      <AdminShell>
        <div className="card p-8 text-center text-ink-soft">⚠️ SUPABASE_SERVICE_ROLE_KEY fehlt (siehe SETUP.md).</div>
      </AdminShell>
    );
  }
  return (
    <AdminShell>
      <h1 className="mb-6 font-display text-2xl font-bold">Support-Posteingang</h1>
      <SupportInbox tickets={tickets} />
    </AdminShell>
  );
}
