import AdminShell from "@/components/admin/AdminShell";
import BooksTable from "@/components/admin/BooksTable";
import { listBooks } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export default async function AdminBooks() {
  let books;
  try {
    books = await listBooks();
  } catch {
    return (
      <AdminShell>
        <div className="card p-8 text-center text-ink-soft">⚠️ SUPABASE_SERVICE_ROLE_KEY fehlt (siehe SETUP.md).</div>
      </AdminShell>
    );
  }
  return (
    <AdminShell>
      <h1 className="mb-6 font-display text-2xl font-bold">Bücher ({books.length})</h1>
      <BooksTable books={books} />
    </AdminShell>
  );
}
