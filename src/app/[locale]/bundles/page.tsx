import Link from "next/link";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getBundles, tTitle, tDesc } from "@/lib/data";
import { formatPrice } from "@/lib/pricing";

export default async function BundlesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "de";
  const dict = getDictionary(locale);
  const bundles = await getBundles();

  return (
    <div className="container-page py-12">
      <h1 className="font-display text-3xl font-bold">{dict.nav.bundles}</h1>
      <p className="mb-8 mt-2 text-ink-soft">{dict.home.bundleTeaserText}</p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {bundles.map((b) => (
          <Link
            key={b.id}
            href={`/${locale}/bundles/${b.slug}`}
            className="card overflow-hidden transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-primary to-primary-dark text-5xl text-white">📦</div>
            <div className="p-5">
              <h3 className="font-display text-lg font-bold">{tTitle(b, locale)}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{tDesc(b, locale)}</p>
              <div className="mt-3 font-display text-xl font-bold text-primary">
                {b.price_cents != null ? formatPrice(b.price_cents, locale) : ""}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
