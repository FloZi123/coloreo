import AdminShell from "@/components/admin/AdminShell";
import BundlesManager from "@/components/admin/BundlesManager";
import { listBundlesAdmin, listPublishedBooksLite } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export default async function AdminBundles() {
  let bundles, books;
  try {
    [bundles, books] = await Promise.all([listBundlesAdmin(), listPublishedBooksLite()]);
  } catch {
    return (
      <AdminShell>
        <div className="card p-8 text-center text-ink-soft">⚠️ SUPABASE_SERVICE_ROLE_KEY fehlt (siehe SETUP.md).</div>
      </AdminShell>
    );
  }
  return (
    <AdminShell>
      <h1 className="mb-6 font-display text-2xl font-bold">Bundles</h1>
      <BundlesManager bundles={bundles} books={books} />
    </AdminShell>
  );
}
