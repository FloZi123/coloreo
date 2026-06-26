import Link from "next/link";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getCategories, tName, tDesc } from "@/lib/data";

export default async function CategoriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "de";
  const dict = getDictionary(locale);
  const categories = await getCategories();
  const adult = categories.filter((c) => c.audience !== "kids");
  const kids = categories.filter((c) => c.audience === "kids");

  const Card = (c: (typeof categories)[number]) => (
    <Link
      key={c.id}
      href={`/${locale}/kategorien/${c.slug}`}
      className="card flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
    >
      <span className="text-4xl">{c.emoji}</span>
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

      <h2 className="mb-4 mt-10 font-display text-xl font-bold">🎨 {dict.common.adults}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{adult.map(Card)}</div>

      {kids.length > 0 && (
        <>
          <h2 className="mb-4 mt-12 font-display text-xl font-bold">🧸 {dict.common.kids}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{kids.map(Card)}</div>
        </>
      )}
    </div>
  );
}
