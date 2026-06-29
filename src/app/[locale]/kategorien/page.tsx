import Link from "next/link";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getWorlds, getCategories, tName, tDesc } from "@/lib/data";
import { Emoji } from "@/components/Emoji";

export const revalidate = 600; // ISR: Katalog-Änderungen erscheinen ohne Redeploy (alle 10 Min)

export default async function CategoriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "de";
  const dict = getDictionary(locale);
  const [worlds, categories] = await Promise.all([getWorlds(), getCategories()]);

  const Card = (c: (typeof categories)[number], accent?: string | null) => (
    <Link
      key={c.id}
      href={`/${locale}/kategorien/${c.slug}`}
      className="card flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderColor: accent ? accent + "40" : undefined }}
    >
      <span className="text-4xl"><Emoji emoji={c.emoji} label={tName(c, locale)} /></span>
      <span>
        <span className="block font-display font-semibold">{tName(c, locale)}</span>
        <span className="block text-xs text-muted">{tDesc(c, locale)}</span>
      </span>
    </Link>
  );

  return (
    <div className="container-page py-12">
      <h1 className="font-display text-3xl font-bold">{dict.categories.title}</h1>
      <p className="mt-2 text-ink-soft">{dict.categories.subtitle}</p>

      {worlds.map((w) => {
        const cats = categories.filter((c) => c.world_id === w.id);
        if (!cats.length) return null;
        return (
          <section key={w.id} className="mt-10">
            <Link href={`/${locale}/welten/${w.slug}`} className="mb-4 flex items-center gap-2 font-display text-xl font-bold hover:text-primary">
              <span><Emoji emoji={w.emoji} label={tName(w, locale)} /></span> {tName(w, locale)} <span className="text-sm font-normal text-muted">→</span>
            </Link>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cats.map((c) => Card(c, w.accent))}</div>
          </section>
        );
      })}
    </div>
  );
}
