import AdminShell from "@/components/admin/AdminShell";
import GeneratorView from "@/components/admin/GeneratorView";
import { listGenerationQueue, listCategoriesAdmin } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export default async function AdminGenerator() {
  let items, categories;
  try {
    [items, categories] = await Promise.all([listGenerationQueue(), listCategoriesAdmin()]);
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
      <GeneratorView items={items} categories={categories} />
    </AdminShell>
  );
}
