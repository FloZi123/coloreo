import Link from "next/link";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getWorlds, getBooks, getRatingsForBooks, tName, tDesc, tTitle } from "@/lib/data";
import BookCard from "@/components/BookCard";
import FreebieForm from "@/components/FreebieForm";
import JsonLd from "@/components/JsonLd";
import TrustBadges from "@/components/TrustBadges";
import DownloadCounter from "@/components/DownloadCounter";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "de";
  const dict = getDictionary(locale);
  const [worlds, featured] = await Promise.all([
    getWorlds(),
    getBooks({ featured: true, limit: 8 }),
  ]);
  const books = featured.length ? featured : await getBooks({ limit: 8 });
  const ratings = await getRatingsForBooks(books.map((b) => b.id));
  const p = (path: string) => `/${locale}${path}`;

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const orgLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", name: "Coloreo", url: site, slogan: dict.orgSlogan },
      { "@type": "WebSite", name: "Coloreo", url: site, inLanguage: locale,
        potentialAction: { "@type": "SearchAction", target: `${site}/${locale}/suche?q={search_term_string}`, "query-input": "required name=search_term_string" } },
    ],
  };

  return (
    <div>
      <JsonLd data={orgLd} />
      {/* HERO */}
      <section className="container-page grid items-center gap-10 py-14 md:grid-cols-2 md:py-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border bg-surface px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-primary">
            <span className="h-2 w-2 rounded-full bg-primary" />
            {dict.home.heroAgeBadge}
          </span>
          <h1 className="mt-5 font-display text-5xl font-bold leading-[1.02] md:text-6xl">{dict.home.heroTitle}</h1>
          <p className="mt-5 max-w-[46ch] text-lg text-muted">{dict.home.heroSubtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={p("/welten")} className="btn-primary px-7 py-3.5">{dict.home.heroCta}</Link>
            <Link href={p("/welten/anti-stress")} className="rounded-full border-2 border-ink px-7 py-3.5 font-extrabold text-ink transition hover:bg-ink hover:text-paper">
              {dict.home.forAdults}
            </Link>
          </div>
        </div>
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mood/hero.webp"
            alt={dict.home.heroImgAlt}
            className="aspect-[16/11] w-full rounded-[1.75rem] object-cover shadow-xl"
          />
          <div className="absolute -bottom-4 -left-4 hidden items-center gap-2.5 rounded-2xl bg-paper px-4 py-3 shadow-lg sm:flex">
            <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-white" style={{ background: "var(--color-success)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7" /></svg>
            </span>
            <div className="text-xs font-bold text-ink-soft">{dict.home.heroBadgeLabel}</div>
          </div>
        </div>
      </section>

      {/* TRUST BADGES */}
      <section className="container-page py-6">
        <TrustBadges locale={locale} variant="row" />
        <div className="mt-4 flex justify-center">
          <DownloadCounter locale={locale} />
        </div>
      </section>

      {/* FEATURE STRIP */}
      <section style={{ background: "var(--color-beige)" }}>
        <div className="container-page grid gap-6 py-10 sm:grid-cols-3">
          {[
            { c: "#FF5A4D", t: dict.home.featureBoldLines, d: dict.home.featureBoldLinesDesc },
            { c: "#3FBF87", t: dict.home.featureInstantPdf, d: dict.home.featureInstantPdfDesc },
            { c: "#3B8EEA", t: dict.home.featureAllAges, d: dict.home.featureAllAgesDesc },
          ].map((f) => (
            <div key={f.t} className="flex items-start gap-3.5">
              <span className="h-10 w-10 flex-none rounded-xl" style={{ background: f.c }} />
              <div>
                <div className="font-display text-lg font-semibold">{f.t}</div>
                <div className="mt-0.5 text-sm text-muted">{f.d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SO FUNKTIONIERT'S */}
      <section className="container-page py-14">
        <h2 className="mb-8 text-center font-display text-2xl font-bold md:text-3xl">{dict.home.howTitle}</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { n: 1, t: dict.home.howStep1Title, d: dict.home.howStep1Text },
            { n: 2, t: dict.home.howStep2Title, d: dict.home.howStep2Text },
            { n: 3, t: dict.home.howStep3Title, d: dict.home.howStep3Text },
          ].map((s) => (
            <div key={s.n} className="card flex flex-col items-center p-7 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full font-display text-lg font-extrabold text-white" style={{ background: "var(--color-primary)" }}>{s.n}</span>
              <h3 className="mt-4 font-display text-lg font-semibold">{s.t}</h3>
              <p className="mt-1.5 text-sm text-muted">{s.d}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-6 max-w-xl text-center text-sm text-ink-soft">{dict.home.howNoPrinter}</p>
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
                  difficulty: b.difficulty,
                  rating: ratings.get(b.id) ?? null,
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* MAKRO-TRENNBANNER */}
      <section className="relative my-6 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/mood/macro.webp" alt="" className="h-44 w-full object-cover md:h-56" />
        <div className="absolute inset-0 flex items-center" style={{ background: "linear-gradient(90deg, rgba(34,30,27,0.62), rgba(34,30,27,0.05))" }}>
          <div className="container-page">
            <p className="max-w-md font-display text-2xl font-bold text-paper md:text-3xl">
              {dict.home.macroBanner}
            </p>
          </div>
        </div>
      </section>

      {/* WELTEN */}
      <section className="container-page py-8">
        <h2 className="mb-8 font-display text-2xl font-bold md:text-3xl">{dict.home.exploreWorlds}</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {worlds.map((w) => (
            <Link
              key={w.id}
              href={p(`/welten/${w.slug}`)}
              className="group card overflow-hidden p-6 transition hover:-translate-y-1 hover:shadow-lg"
              style={{ borderColor: w.accent ?? undefined }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl" style={{ background: (w.accent ?? "#7C4DFF") + "22" }}>{w.emoji}</div>
              <h3 className="mt-4 font-display text-xl font-bold">{tName(w, locale)}</h3>
              <p className="mt-1 text-sm text-ink-soft">{tDesc(w, locale)}</p>
              <span className="mt-3 inline-block text-sm font-semibold" style={{ color: w.accent ?? "#7C4DFF" }}>{dict.home.explore} →</span>
            </Link>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link href={p("/kategorien")} className="text-sm font-semibold text-primary hover:underline">{dict.home.browseCategories} →</Link>
        </div>
      </section>

      {/* BUNDLE TEASER */}
      <section className="container-page py-16">
        <div className="flex flex-col items-center gap-4 rounded-3xl p-12 text-center text-white" style={{ background: "var(--color-primary)" }}>
          <h2 className="font-display text-3xl font-bold">{dict.home.bundleTeaser}</h2>
          <p className="max-w-xl" style={{ color: "#ffffffe6" }}>{dict.home.bundleTeaserText}</p>
          <Link href={p("/bundle-builder")} className="mt-2 rounded-full bg-white px-7 py-3 font-extrabold text-primary hover:bg-paper">
            {dict.nav.bundleBuilder} →
          </Link>
        </div>
      </section>

      {/* USP: DIGITAL → DRUCKFERTIG */}
      <section className="container-page py-12">
        <div className="grid items-center gap-8 md:grid-cols-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mood/usp-print.webp"
            alt={dict.home.uspImgAlt}
            className="aspect-[4/3] w-full rounded-3xl object-cover shadow-lg"
          />
          <div>
            <h2 className="font-display text-2xl font-bold md:text-3xl">{dict.home.digitalBuyTitle}</h2>
            <p className="mt-3 max-w-[42ch] text-muted">
              {dict.home.digitalBuyText}
            </p>
            <ul className="mt-5 space-y-2.5 text-sm font-medium text-ink-soft">
              {[
                dict.home.uspItem1,
                dict.home.uspItem2,
                dict.home.uspItem3,
              ].map((t) => (
                <li key={t} className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full text-xs text-white" style={{ background: "var(--color-success)" }}>✓</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FREEBIE */}
      <section className="container-page pb-20">
        <div className="card grid items-stretch gap-0 overflow-hidden p-0 md:grid-cols-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mood/cozy-evening.webp"
            alt={dict.home.freebieImgAlt}
            className="h-full min-h-[260px] w-full object-cover"
          />
          <div className="flex flex-col items-center gap-4 p-10 text-center">
            <span className="text-4xl">🎁</span>
            <h2 className="font-display text-2xl font-bold">{dict.home.freebieTitle}</h2>
            <p className="max-w-md text-ink-soft">{dict.home.freebieText}</p>
            <FreebieForm locale={locale} dict={dict} />
            <p className="text-xs text-muted">{dict.freebie.privacy}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
