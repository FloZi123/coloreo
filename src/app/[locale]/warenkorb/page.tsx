import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getPricingTiers } from "@/lib/data";
import CartView from "@/components/CartView";

export default async function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "de";
  const dict = getDictionary(locale);
  const tiers = await getPricingTiers();

  return (
    <div className="container-page py-12">
      <h1 className="mb-8 font-display text-3xl font-bold">{dict.cart.title}</h1>
      <CartView tiers={tiers} locale={locale} dict={dict} />
    </div>
  );
}
