import AdminShell from "@/components/admin/AdminShell";
import CategoriesManager from "@/components/admin/CategoriesManager";
import { listCategoriesFull } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export default async function AdminCategories() {
  let categories;
  try {
    categories = await listCategoriesFull();
  } catch {
    return (
      <AdminShell>
        <div className="card p-8 text-center text-ink-soft">⚠️ SUPABASE_SERVICE_ROLE_KEY fehlt (siehe SETUP.md).</div>
      </AdminShell>
    );
  }
  return (
    <AdminShell>
      <h1 className="mb-6 font-display text-2xl font-bold">Kategorien</h1>
      <CategoriesManager categories={categories} />
    </AdminShell>
  );
}
