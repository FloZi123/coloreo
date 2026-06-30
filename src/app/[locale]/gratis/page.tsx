import type { Metadata } from "next";
import { isLocale, locales, defaultLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import FreebieForm from "@/components/FreebieForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "de";
  const dict = getDictionary(locale);
  const languages = Object.fromEntries(locales.map((l) => [l, `/${l}/gratis`]));
  return {
    title: dict.freebie.title,
    description: dict.freebie.text,
    alternates: { canonical: `/${locale}/gratis`, languages: { ...languages, "x-default": `/${defaultLocale}/gratis` } },
  };
}

export default async function FreebiePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "de";
  const dict = getDictionary(locale);

  return (
    <div className="container-page py-16">
      <div className="card mx-auto max-w-2xl p-10 text-center">
        <span className="text-5xl">🎁</span>
        <h1 className="mt-4 font-display text-3xl font-bold">{dict.freebie.title}</h1>
        <p className="mx-auto mt-3 max-w-md text-ink-soft">{dict.freebie.text}</p>
        <div className="mt-8">
          <FreebieForm locale={locale} dict={dict} />
        </div>
        <p className="mt-4 text-xs text-muted">{dict.freebie.privacy}</p>
      </div>
    </div>
  );
}
