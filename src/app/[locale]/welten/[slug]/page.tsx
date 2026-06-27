import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getWorldBySlug, getCategoriesByWorld, getRatingsForBooks, tName, tDesc, tTitle, type Book } from "@/lib/data";
import { createPublicClient } from "@/lib/supabase/public";
import BookCard from "@/components/BookCard";

export default async function WorldPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: raw, slug } = await params;
  const locale: Locale = isLocale(raw) ? raw : "de";
  const dict = getDictionary(locale);
  const world = await getWorldBySlug(slug);
  if (!world) notFound();
  const categories = await getCategoriesByWorld(world.id);
  const accent = world.accent ?? "#7C4DFF";
  // Mood-Bild je Welt
  const WORLD_IMG: Record<string, string> = {
    kinderwelt: "family", "natur-botanik": "cafe", "vintage-lifestyle": "gift", "anti-stress": "flatlay",
  };
  const moodImg = WORLD_IMG[slug];

  let books: Book[] = [];
  if (categories.length) {
    const sb = createPublicClient();
    const { data } = await sb.from("books").select("*").eq("status", "published").in("category_id", categories.map((c) => c.id)).order("sales_count", { ascending: false }).limit(8);
    books = data ?? [];
  }
  const ratings = await getRatingsForBooks(books.map((b) => b.id));

  return (
    <div>
      <section style={{ background: accent + "18" }}>
        <div className="container-page grid items-center gap-8 py-12 md:grid-cols-[1.3fr_1fr]">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 flex-none items-center justify-center rounded-2xl text-4xl" style={{ background: accent + "30" }}>{world.emoji}</div>
            <div>
              <h1 className="font-display text-3xl font-bold">{tName(world, locale)}</h1>
              <p className="text-ink-soft">{tDesc(world, locale)}</p>
            </div>
          </div>
          {moodImg && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/mood/${moodImg}.webp`} alt="" className="hidden aspect-[3/2] w-full rounded-2xl object-cover shadow-md md:block" />
          )}
        </div>
      </section>

      <div className="container-page py-10">
        <h2 className="mb-4 font-display text-xl font-bold">{dict.categories.title}</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((c) => (
            <Link key={c.id} href={`/${locale}/kategorien/${c.slug}`} className="card flex flex-col items-center gap-2 p-5 text-center transition hover:-translate-y-1 hover:shadow-md" style={{ borderColor: accent + "40" }}>
              <span className="text-4xl">{c.emoji}</span>
              <span className="font-display text-sm font-semibold">{tName(c, locale)}</span>
            </Link>
          ))}
        </div>

        {books.length > 0 && (
          <>
            <h2 className="mb-6 mt-12 font-display text-xl font-bold">{dict.home.featured}</h2>
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
              {books.map((b) => (
                <BookCard key={b.id} locale={locale} dict={dict} book={{ id: b.id, slug: b.slug, title: tTitle(b, locale), priceCents: b.price_cents, pageCount: b.page_count, coverUrl: b.cover_url, rating: ratings.get(b.id) ?? null }} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
