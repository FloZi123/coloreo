import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { isLocale, locales, defaultLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getBookBySlug, getBooks, getCategoryBySlug, getBookRating, getReviews, tTitle, tDesc, tName } from "@/lib/data";
import { createPublicClient } from "@/lib/supabase/public";
import { formatPrice } from "@/lib/pricing";
import { showRating } from "@/lib/reviews";
import ProductBuyBox from "@/components/ProductBuyBox";
import BookCard from "@/components/BookCard";
import BookPreviewViewer from "@/components/BookPreviewViewer";
import JsonLd from "@/components/JsonLd";
import Stars from "@/components/Stars";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale: Locale = isLocale(raw) ? raw : "de";
  const book = await getBookBySlug(slug);
  if (!book) return {};
  const title = tTitle(book, locale);
  const description = tDesc(book, locale).slice(0, 160);
  const languages = Object.fromEntries(locales.map((l) => [l, `/${l}/buch/${slug}`]));
  return {
    title,
    description,
    alternates: { canonical: `/${locale}/buch/${slug}`, languages: { ...languages, "x-default": `/${defaultLocale}/buch/${slug}` } },
    openGraph: { title, description, images: book.cover_url ? [book.cover_url] : [], type: "website" },
  };
}

async function categoryOf(categoryId: string | null) {
  if (!categoryId) return null;
  const sb = createPublicClient();
  const { data } = await sb.from("categories").select("*").eq("id", categoryId).maybeSingle();
  return data;
}

export default async function BookPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale: Locale = isLocale(raw) ? raw : "de";
  const dict = getDictionary(locale);
  const book = await getBookBySlug(slug);
  if (!book) notFound();
  const category = await categoryOf(book.category_id);
  const related = category ? (await getBooks({ categoryId: category.id, limit: 5 })).filter((b) => b.id !== book.id).slice(0, 4) : [];
  const previews = Array.isArray(book.preview_urls) ? (book.preview_urls as string[]) : [];
  const [rating, reviews] = await Promise.all([getBookRating(book.id), getReviews(book.id)]);
  const audienceLabel = book.audience === "kids" ? dict.product.audienceKids : book.audience === "adult" ? dict.product.audienceAdult : dict.product.audienceAll;

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const absImage = book.cover_url ? (book.cover_url.startsWith("http") ? book.cover_url : `${site}${book.cover_url}`) : undefined;
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: tTitle(book, locale),
    description: tDesc(book, locale),
    image: absImage ? [absImage] : undefined,
    brand: { "@type": "Brand", name: "Coloreo" },
    category: category ? tName(category, locale) : undefined,
    offers: {
      "@type": "Offer",
      price: (book.price_cents / 100).toFixed(2),
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: `${site}/${locale}/buch/${book.slug}`,
    },
    ...(rating && showRating(rating.count)
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: rating.avg, reviewCount: rating.count } }
      : {}),
  };

  return (
    <div className="container-page py-12">
      <JsonLd data={productLd} />
      <nav className="mb-6 text-sm text-muted">
        <Link href={`/${locale}/kategorien`} className="hover:text-primary">{dict.categories.title}</Link>
        {category && (
          <>
            {" / "}
            <Link href={`/${locale}/kategorien/${category.slug}`} className="hover:text-primary">{tName(category, locale)}</Link>
          </>
        )}
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        {/* GALLERY */}
        <div>
          <div className="card aspect-[3/4] max-w-md overflow-hidden">
            {book.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={book.cover_url} alt={tTitle(book, locale)} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-primary-soft">
                <span className="text-7xl">{category?.emoji ?? "🎨"}</span>
                <span className="mt-4 px-6 text-center font-display text-lg font-semibold text-ink-soft">{tTitle(book, locale)}</span>
              </div>
            )}
          </div>
          {previews.length > 0 && (
            <div className="mt-8">
              <BookPreviewViewer images={previews} totalPages={book.page_count} locale={locale} dict={dict} />
            </div>
          )}
        </div>

        {/* INFO + BUY */}
        <div>
          {category && (
            <span className="inline-flex items-center rounded-full border bg-surface px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-muted">
              {category.emoji} {tName(category, locale)}
            </span>
          )}
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight">{tTitle(book, locale)}</h1>
          {rating && showRating(rating.count) && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <Stars value={rating.avg} />
              <span className="font-semibold">{rating.avg.toFixed(1)}</span>
              <span className="text-muted">({rating.count})</span>
            </div>
          )}
          <div className="mt-3 font-display text-3xl font-bold">{formatPrice(book.price_cents, locale)}</div>
          <p className="mt-4 max-w-[46ch] text-ink-soft">{tDesc(book, locale)}</p>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-2xl p-4" style={{ background: "var(--color-beige)" }}>
              <div className="font-display text-xl font-bold">{book.page_count}</div>
              <div className="text-xs text-muted">{dict.product.pageCount}</div>
            </div>
            <div className="rounded-2xl p-4" style={{ background: "var(--color-beige)" }}>
              <div className="font-display text-xl font-bold">{audienceLabel}</div>
              <div className="text-xs text-muted">{dict.product.audience}</div>
            </div>
            <div className="rounded-2xl p-4" style={{ background: "var(--color-beige)" }}>
              <div className="font-display text-xl font-bold">PDF</div>
              <div className="text-xs text-muted">A4 · {dict.product.printReady}</div>
            </div>
          </div>

          <div className="mt-6">
            <ProductBuyBox id={book.id} slug={book.slug} title={tTitle(book, locale)} priceCents={book.price_cents} coverUrl={book.cover_url} locale={locale} dict={dict} />
          </div>
          <p className="mt-4 text-xs text-muted">{dict.product.watermarkNote}</p>
        </div>
      </div>

      {reviews.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 font-display text-2xl font-bold">{dict.product.reviews}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {reviews.map((r, i) => (
              <div key={i} className="card p-5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-display font-semibold">{r.author_name}</span>
                  <Stars value={r.rating} size={14} />
                </div>
                {r.source === "review_copy" && (
                  <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                    {locale === "de" ? "Rezensionsexemplar" : "Review copy"}
                  </span>
                )}
                {r.body && <p className="mt-2 text-sm text-ink-soft">{r.body}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 font-display text-2xl font-bold">{dict.product.related}</h2>
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {related.map((b) => (
              <BookCard key={b.id} locale={locale} dict={dict} book={{ id: b.id, slug: b.slug, title: tTitle(b, locale), priceCents: b.price_cents, pageCount: b.page_count, coverUrl: b.cover_url, emoji: category?.emoji }} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
