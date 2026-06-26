import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getBooks, getCategories, getPricingTiers, tTitle } from "@/lib/data";
import BundleBuilder, { type BuilderBook } from "@/components/BundleBuilder";

export default async function BundleBuilderPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "de";
  const dict = getDictionary(locale);
  const [books, categories, tiers] = await Promise.all([getBooks({ limit: 200 }), getCategories(), getPricingTiers()]);
  const emojiByCat = new Map(categories.map((c) => [c.id, c.emoji ?? "🎨"]));

  const builderBooks: BuilderBook[] = books.map((b) => ({
    id: b.id,
    slug: b.slug,
    title: tTitle(b, locale),
    priceCents: b.price_cents,
    emoji: emojiByCat.get(b.category_id ?? "") ?? "🎨",
  }));

  return (
    <div className="container-page py-12">
      <h1 className="font-display text-3xl font-bold">{dict.bundleBuilder.title}</h1>
      <p className="mb-8 mt-2 max-w-2xl text-ink-soft">{dict.bundleBuilder.subtitle}</p>
      <BundleBuilder books={builderBooks} tiers={tiers} locale={locale} dict={dict} />
    </div>
  );
}
