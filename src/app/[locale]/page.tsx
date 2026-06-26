import Link from "next/link";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getCategories, getBooks, getRatingsForBooks, tName, tTitle } from "@/lib/data";
import BookCard from "@/components/BookCard";
import FreebieForm from "@/components/FreebieForm";
import JsonLd from "@/components/JsonLd";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "de";
  const dict = getDictionary(locale);
  const [categories, featured] = await Promise.all([
    getCategories(),
    getBooks({ featured: true, limit: 8 }),
  ]);
  const books = featured.length ? featured : await getBooks({ limit: 8 });
  const ratings = await getRatingsForBooks(books.map((b) => b.id));
  const p = (path: string) => `/${locale}${path}`;

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const orgLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", name: "Coloreo", url: site, slogan: locale === "de" ? "Mal dir deine Welt." : "Color your world." },
      { "@type": "WebSite", name: "Coloreo", url: site, inLanguage: locale,
        potentialAction: { "@type": "SearchAction", target: `${site}/${locale}/suche?q={search_term_string}`, "query-input": "required name=search_term_string" } },
    ],
  };

  return (
    <div>
      <JsonLd data={orgLd} />
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-soft via-paper to-accent-soft" />
        <div className="container-page grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="inline-block rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary shadow-sm">
              {dict.home.trustInstant} · {dict.home.trustQuality}
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-tight text-ink md:text-5xl">
              {dict.home.heroTitle}
            </h1>
            <p className="mt-4 max-w-lg text-lg text-ink-soft">{dict.home.heroSubtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={p("/kategorien")} className="btn-primary px-7 py-3.5">{dict.home.heroCta}</Link>
              <Link href={p("/bundle-builder")} className="rounded-full border-2 border-primary px-7 py-3.5 font-semibold text-primary hover:bg-primary-soft">
                {dict.home.heroCtaBundles}
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {categories.slice(0, 9).map((c) => (
              <Link
                key={c.id}
                href={p(`/kategorien/${c.slug}`)}
                className="flex aspect-square flex-col items-center justify-center rounded-2xl bg-white/80 p-2 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <span className="text-3xl">{c.emoji}</span>
                <span className="mt-1 text-[11px] font-semibold text-ink-soft">{tName(c, locale)}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-y bg-surface">
        <div className="container-page flex flex-wrap items-center justify-center gap-x-10 gap-y-3 py-5 text-sm font-medium text-ink-soft">
          <span>⚡ {dict.home.trustInstant}</span>
          <span>🖨️ {dict.home.trustQuality}</span>
          <span>🔒 {dict.home.trustSecure}</span>
          <span>💸 {dict.home.bundleTeaser}</span>
        </div>
      </section>

      {/* FEATURED BOOKS */}
      {books.length > 0 && (
        <section className="container-page py-16">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="font-display text-2xl font-bold md:text-3xl">{dict.home.featured}</h2>
            <Link href={p("/kategorien")} className="text-sm font-semibold text-primary hover:underline">
              {dict.common.continueShopping} →
            </Link>
          </div>
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
                  rating: ratings.get(b.id) ?? null,
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* CATEGORIES */}
      <section className="container-page py-8">
        <h2 className="mb-8 font-display text-2xl font-bold md:text-3xl">{dict.home.browseCategories}</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={p(`/kategorien/${c.slug}`)}
              className="card flex flex-col items-center justify-center gap-2 p-5 text-center transition hover:-translate-y-1 hover:border-primary hover:shadow-md"
            >
              <span className="text-4xl">{c.emoji}</span>
              <span className="font-display text-sm font-semibold">{tName(c, locale)}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* BUNDLE TEASER */}
      <section className="container-page py-16">
        <div className="card flex flex-col items-center gap-4 bg-gradient-to-r from-primary to-primary-dark p-10 text-center text-white">
          <h2 className="font-display text-3xl font-bold">{dict.home.bundleTeaser}</h2>
          <p className="max-w-xl text-white/90">{dict.home.bundleTeaserText}</p>
          <Link href={p("/bundle-builder")} className="mt-2 rounded-full bg-white px-7 py-3 font-semibold text-primary hover:bg-paper">
            {dict.nav.bundleBuilder} →
          </Link>
        </div>
      </section>

      {/* FREEBIE */}
      <section className="container-page pb-20">
        <div className="card flex flex-col items-center gap-4 p-10 text-center">
          <span className="text-4xl">🎁</span>
          <h2 className="font-display text-2xl font-bold">{dict.home.freebieTitle}</h2>
          <p className="max-w-md text-ink-soft">{dict.home.freebieText}</p>
          <FreebieForm locale={locale} dict={dict} />
          <p className="text-xs text-muted">{dict.freebie.privacy}</p>
        </div>
      </section>
    </div>
  );
}
