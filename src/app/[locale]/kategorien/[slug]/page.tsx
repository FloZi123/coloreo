import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getCategoryBySlug, getBooks, getRatingsForBooks, tName, tDesc, tTitle } from "@/lib/data";
import BookCard from "@/components/BookCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale: Locale = isLocale(raw) ? raw : "de";
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return { title: tName(category, locale), description: tDesc(category, locale) };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale: Locale = isLocale(raw) ? raw : "de";
  const dict = getDictionary(locale);
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();
  const books = await getBooks({ categoryId: category.id });
  const ratings = await getRatingsForBooks(books.map((b) => b.id));

  return (
    <div className="container-page py-12">
      <div className="mb-8 flex items-center gap-4">
        <span className="text-5xl">{category.emoji}</span>
        <div>
          <h1 className="font-display text-3xl font-bold">{tName(category, locale)}</h1>
          <p className="text-ink-soft">{tDesc(category, locale)}</p>
        </div>
      </div>

      {books.length === 0 ? (
        <div className="card p-10 text-center text-muted">{dict.categories.noBooks}</div>
      ) : (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {books.map((b) => (
            <BookCard
              key={b.id}
              locale={locale}
              dict={dict}
              book={{
                id: b.id,
                slug: b.slug,
                title: tTitle(b, locale),
                priceCents: b.price_cents,
                pageCount: b.page_count,
                coverUrl: b.cover_url,
                emoji: category.emoji,
                difficulty: b.difficulty,
                rating: ratings.get(b.id) ?? null,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
