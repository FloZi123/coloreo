import Link from "next/link";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getWorlds, getBooks, getRatingsForBooks, tName, tDesc, tTitle } from "@/lib/data";
import BookCard from "@/components/BookCard";
import FreebieForm from "@/components/FreebieForm";
import JsonLd from "@/components/JsonLd";

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
      { "@type": "Organization", name: "Coloreo", url: site, slogan: locale === "de" ? "Mal dir deine Welt." : "Color your world." },
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
            {locale === "de" ? "Malbücher für jedes Alter" : "Coloring books for every age"}
          </span>
          <h1 className="mt-5 font-display text-5xl font-bold leading-[1.02] md:text-6xl">{dict.home.heroTitle}</h1>
          <p className="mt-5 max-w-[46ch] text-lg text-muted">{dict.home.heroSubtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={p("/welten")} className="btn-primary px-7 py-3.5">{dict.home.heroCta}</Link>
            <Link href={p("/welten/anti-stress")} className="rounded-full border-2 border-ink px-7 py-3.5 font-extrabold text-ink transition hover:bg-ink hover:text-paper">
              {locale === "de" ? "Für Erwachsene" : "For adults"}
            </Link>
          </div>
        </div>
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mood/hero.webp"
            alt={locale === "de" ? "Hände malen ein Mandala in einem Malbuch aus" : "Hands coloring a mandala in a coloring book"}
            className="aspect-[16/11] w-full rounded-[1.75rem] object-cover shadow-xl"
          />
          <div className="absolute -bottom-4 -left-4 hidden rounded-2xl bg-paper px-4 py-3 shadow-lg sm:block">
            <div className="font-display text-sm font-bold" style={{ color: "#FFC23C" }}>★★★★★</div>
            <div className="text-xs text-muted">{locale === "de" ? "Sofort-PDF · druckfertig" : "Instant PDF · print-ready"}</div>
          </div>
        </div>
      </section>

      {/* FEATURE STRIP */}
      <section style={{ background: "var(--color-beige)" }}>
        <div className="container-page grid gap-6 py-10 sm:grid-cols-3">
          {[
            { c: "#FF5A4D", t: locale === "de" ? "Dicke, klare Linien" : "Bold, clear lines", d: locale === "de" ? "Gemacht zum Ausmalen, nicht zum Verzweifeln." : "Made for coloring, not despairing." },
            { c: "#3FBF87", t: locale === "de" ? "Sofort als PDF" : "Instant PDF", d: locale === "de" ? "Direkt nach dem Kauf herunterladen & drucken." : "Download & print right after purchase." },
            { c: "#3B8EEA", t: locale === "de" ? "Für jedes Alter" : "For every age", d: locale === "de" ? "Von ab 3 bis Anti-Stress für Erwachsene." : "From age 3 to adult anti-stress." },
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

      {/* MAKRO-TRENNBANNER */}
      <section className="relative my-6 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/mood/macro.webp" alt="" className="h-44 w-full object-cover md:h-56" />
        <div className="absolute inset-0 flex items-center" style={{ background: "linear-gradient(90deg, rgba(34,30,27,0.62), rgba(34,30,27,0.05))" }}>
          <div className="container-page">
            <p className="max-w-md font-display text-2xl font-bold text-paper md:text-3xl">
              {locale === "de" ? "Ein Stift. Eine Linie. Deine Auszeit." : "One pencil. One line. Your time out."}
            </p>
          </div>
        </div>
      </section>

      {/* WELTEN */}
      <section className="container-page py-8">
        <h2 className="mb-8 font-display text-2xl font-bold md:text-3xl">{locale === "de" ? "Entdecke unsere Welten" : "Explore our worlds"}</h2>
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
              <span className="mt-3 inline-block text-sm font-semibold" style={{ color: w.accent ?? "#7C4DFF" }}>{locale === "de" ? "Entdecken" : "Explore"} →</span>
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
            alt={locale === "de" ? "Frisch gedruckte Malbuchseite neben einem Drucker" : "Freshly printed coloring page next to a printer"}
            className="aspect-[4/3] w-full rounded-3xl object-cover shadow-lg"
          />
          <div>
            <h2 className="font-display text-2xl font-bold md:text-3xl">{locale === "de" ? "Digital kaufen, zu Hause drucken" : "Buy digital, print at home"}</h2>
            <p className="mt-3 max-w-[42ch] text-muted">
              {locale === "de"
                ? "Nach dem Kauf bekommst du sofort eine druckfertige PDF. So oft ausdrucken, wie du magst – für die ganze Familie, ganz ohne Warten und Versand."
                : "Right after purchase you get a print-ready PDF. Print it as often as you like – for the whole family, with no waiting and no shipping."}
            </p>
            <ul className="mt-5 space-y-2.5 text-sm font-medium text-ink-soft">
              {[
                locale === "de" ? "Sofort-Download direkt nach dem Kauf" : "Instant download right after purchase",
                locale === "de" ? "Druckfertiges PDF in A4 – beliebig oft drucken" : "Print-ready A4 PDF – print as often as you like",
                locale === "de" ? "Dicke, klare Linien für sauberes Ausmalen" : "Bold, clear lines for clean coloring",
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
            alt={locale === "de" ? "Gemütlicher Abend mit Malbuch auf dem Sofa" : "Cozy evening coloring on the sofa"}
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
