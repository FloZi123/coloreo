import AdminShell from "@/components/admin/AdminShell";
import GeneratorView from "@/components/admin/GeneratorView";
import { listGenerationQueue } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export default async function AdminGenerator() {
  let items;
  try {
    items = await listGenerationQueue();
  } catch {
    return (
      <AdminShell>
        <div className="card p-8 text-center text-ink-soft">⚠️ SUPABASE_SERVICE_ROLE_KEY fehlt (siehe SETUP.md).</div>
      </AdminShell>
    );
  }
  return (
    <AdminShell>
      <h1 className="mb-6 font-display text-2xl font-bold">Auto-Generator</h1>
      <GeneratorView items={items} />
    </AdminShell>
  );
}
