import AdminShell from "@/components/admin/AdminShell";
import { createAdminClient } from "@/lib/supabase/admin";
import { approveReview, rejectReview } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

type ReviewRow = {
  id: string;
  author_name: string;
  rating: number;
  body: string | null;
  source: string;
  created_at: string;
  book_id: string;
};

export default async function AdminReviews() {
  let reviews: ReviewRow[] = [];
  const bookTitles: Map<string, string> = new Map();

  try {
    const admin = createAdminClient();

    const { data } = await admin
      .from("reviews")
      .select("id, author_name, rating, body, source, created_at, book_id")
      .eq("is_approved", false)
      .order("created_at", { ascending: true });

    reviews = (data ?? []) as ReviewRow[];

    // Fetch book titles separately
    const bookIds = [...new Set(reviews.map((r) => r.book_id).filter(Boolean))];
    if (bookIds.length > 0) {
      const { data: books } = await admin
        .from("books")
        .select("id, title_de")
        .in("id", bookIds);
      for (const b of books ?? []) {
        bookTitles.set(b.id, b.title_de);
      }
    }
  } catch {
    return (
      <AdminShell>
        <div className="card p-8 text-center text-ink-soft">
          Fehler beim Laden (SUPABASE_SERVICE_ROLE_KEY prüfen).
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <h1 className="mb-6 font-display text-2xl font-bold">
        Bewertungen moderieren ({reviews.length})
      </h1>

      {reviews.length === 0 ? (
        <div className="card p-10 text-center text-muted">
          Keine offenen Bewertungen.
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Book title */}
                  <div className="text-xs text-muted mb-1 font-semibold uppercase tracking-wide">
                    {bookTitles.get(r.book_id) ?? "Unbekanntes Buch"}
                  </div>

                  {/* Author + stars */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-display font-semibold">{r.author_name}</span>
                    <span className="text-sm" style={{ color: "#FFC857" }}>
                      {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                    </span>
                    {/* Source badge */}
                    {r.source === "review_copy" ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                        Rezensionsexemplar
                      </span>
                    ) : (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-800">
                        Verifizierter Kauf
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  {r.body && (
                    <p className="mt-2 text-sm text-ink-soft">{r.body}</p>
                  )}

                  {/* Date */}
                  <div className="mt-2 text-xs text-muted">
                    {new Date(r.created_at).toLocaleString("de-DE")}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  <form action={approveReview.bind(null, r.id)}>
                    <button
                      type="submit"
                      className="rounded-xl bg-success px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                    >
                      Freischalten
                    </button>
                  </form>
                  <form action={rejectReview.bind(null, r.id)}>
                    <button
                      type="submit"
                      className="rounded-xl border border-accent px-4 py-2 text-sm font-semibold text-accent hover:bg-accent-soft"
                    >
                      Ablehnen
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
