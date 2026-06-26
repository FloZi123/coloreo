import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getBundleWithBooks, tTitle, tDesc } from "@/lib/data";
import { formatPrice } from "@/lib/pricing";
import AddBundleButton from "@/components/AddBundleButton";

export default async function BundleDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale: Locale = isLocale(raw) ? raw : "de";
  const dict = getDictionary(locale);
  const result = await getBundleWithBooks(slug);
  if (!result) notFound();
  const { bundle, books } = result;
  const regular = books.reduce((s, b) => s + b.price_cents, 0);
  const price = bundle.price_cents ?? regular;
  const saved = Math.max(0, regular - price);

  return (
    <div className="container-page py-12">
      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="card flex aspect-video items-center justify-center bg-gradient-to-br from-primary to-primary-dark text-7xl text-white">📦</div>
          <h2 className="mb-4 mt-8 font-display text-xl font-bold">{books.length} {dict.common.books}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {books.map((b) => (
              <div key={b.id} className="card flex flex-col items-center gap-1 p-3 text-center">
                <span className="text-3xl">🎨</span>
                <span className="line-clamp-2 text-[11px] font-semibold text-ink-soft">{tTitle(b, locale)}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h1 className="font-display text-3xl font-bold">{tTitle(bundle, locale)}</h1>
          <p className="mt-3 text-ink-soft">{tDesc(bundle, locale)}</p>
          <div className="card mt-6 p-6">
            <div className="flex items-baseline gap-3">
              <span className="font-display text-3xl font-bold text-primary">{formatPrice(price, locale)}</span>
              {saved > 0 && <span className="text-sm text-muted line-through">{formatPrice(regular, locale)}</span>}
            </div>
            {saved > 0 && (
              <p className="mt-1 text-sm font-semibold text-success">
                {dict.cart.youSave} {formatPrice(saved, locale)}
              </p>
            )}
            <div className="mt-4">
              <AddBundleButton id={bundle.id} slug={bundle.slug} title={tTitle(bundle, locale)} priceCents={price} dict={dict} />
            </div>
            <ul className="mt-5 space-y-2 text-sm text-ink-soft">
              <li>✓ {dict.home.trustInstant}</li>
              <li>✓ {dict.product.formatValue}</li>
              <li>✓ {dict.home.trustSecure}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
