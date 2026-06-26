import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getBookBySlug, getBooks, getCategoryBySlug, tTitle, tDesc, tName } from "@/lib/data";
import { createPublicClient } from "@/lib/supabase/public";
import ProductBuyBox from "@/components/ProductBuyBox";
import BookCard from "@/components/BookCard";
import BookPreviewViewer from "@/components/BookPreviewViewer";

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
  return {
    title,
    description,
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

  return (
    <div className="container-page py-12">
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
              <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-primary-soft to-accent-soft">
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
          <h1 className="font-display text-3xl font-bold">{tTitle(book, locale)}</h1>
          <p className="mt-4 text-ink-soft">{tDesc(book, locale)}</p>

          <dl className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between border-b py-2"><dt className="text-muted">{dict.product.pageCount}</dt><dd className="font-semibold">{book.page_count}</dd></div>
            <div className="flex justify-between border-b py-2"><dt className="text-muted">{dict.product.format}</dt><dd className="font-semibold">{dict.product.formatValue}</dd></div>
            {category && <div className="flex justify-between border-b py-2"><dt className="text-muted">{dict.product.category}</dt><dd className="font-semibold">{tName(category, locale)}</dd></div>}
          </dl>

          <div className="mt-6">
            <ProductBuyBox id={book.id} slug={book.slug} title={tTitle(book, locale)} priceCents={book.price_cents} coverUrl={book.cover_url} locale={locale} dict={dict} />
          </div>
          <p className="mt-4 text-xs text-muted">{dict.product.watermarkNote}</p>
        </div>
      </div>

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
