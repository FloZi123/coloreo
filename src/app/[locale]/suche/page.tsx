import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { searchBooks, getCategories, getRatingsForBooks, tName, tTitle } from "@/lib/data";
import BookCard from "@/components/BookCard";
import SearchControls from "@/components/SearchControls";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; audience?: string; category?: string; sort?: string }>;
}) {
  const { locale: raw } = await params;
  const sp = await searchParams;
  const locale: Locale = isLocale(raw) ? raw : "de";
  const dict = getDictionary(locale);

  const audience = sp.audience === "adult" || sp.audience === "kids" ? sp.audience : undefined;
  const sort = (["popular", "price_asc", "price_desc", "new"] as const).find((s) => s === sp.sort);

  const [books, categories] = await Promise.all([
    searchBooks({ q: sp.q, audience, categorySlug: sp.category, sort }),
    getCategories(),
  ]);
  const ratings = await getRatingsForBooks(books.map((b) => b.id));

  return (
    <div className="container-page py-12">
      <h1 className="mb-6 font-display text-3xl font-bold">
        {sp.q ? `${dict.search.prefix}: „${sp.q}"` : dict.search.allBooks}
      </h1>
      <SearchControls locale={locale} categories={categories.map((c) => ({ slug: c.slug, name: tName(c, locale) }))} />

      {books.length === 0 ? (
        <div className="card p-10 text-center text-muted">{dict.search.noResults}</div>
      ) : (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {books.map((b) => (
            <BookCard
              key={b.id}
              locale={locale}
              dict={dict}
              book={{ id: b.id, slug: b.slug, title: tTitle(b, locale), priceCents: b.price_cents, pageCount: b.page_count, coverUrl: b.cover_url, rating: ratings.get(b.id) ?? null }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
