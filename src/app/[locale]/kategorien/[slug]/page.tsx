import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, locales, defaultLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getCategoryBySlug, getBooks, getRatingsForBooks, tName, tDesc, tTitle } from "@/lib/data";
import BookCard from "@/components/BookCard";
import JsonLd from "@/components/JsonLd";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale: Locale = isLocale(raw) ? raw : "de";
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  const name = tName(category, locale);
  const desc = tDesc(category, locale) || (locale === "de" ? `${name} Malbücher als PDF zum Ausdrucken – Sofort-Download.` : `${name} coloring books as printable PDF – instant download.`);
  const languages = Object.fromEntries(locales.map((l) => [l, `/${l}/kategorien/${slug}`]));
  return {
    title: locale === "de" ? `${name} Malbücher zum Ausdrucken` : `${name} coloring books to print`,
    description: desc.slice(0, 160),
    alternates: { canonical: `/${locale}/kategorien/${slug}`, languages: { ...languages, "x-default": `/${defaultLocale}/kategorien/${slug}` } },
    openGraph: { title: name, description: desc.slice(0, 160), type: "website" },
  };
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

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: dict.nav.home, item: `${site}/${locale}` },
        { "@type": "ListItem", position: 2, name: dict.categories.title, item: `${site}/${locale}/kategorien` },
        { "@type": "ListItem", position: 3, name: tName(category, locale), item: `${site}/${locale}/kategorien/${slug}` },
      ] },
      { "@type": "ItemList", itemListElement: books.map((b, i) => ({ "@type": "ListItem", position: i + 1, url: `${site}/${locale}/buch/${b.slug}`, name: tTitle(b, locale) })) },
    ],
  };

  return (
    <div className="container-page py-12">
      <JsonLd data={ld} />
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
