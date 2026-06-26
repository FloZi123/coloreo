import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import LibraryView from "@/components/LibraryView";

export default async function LibraryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "de";
  const dict = getDictionary(locale);
  return (
    <div className="container-page py-16">
      <h1 className="text-center font-display text-3xl font-bold">{dict.library.title}</h1>
      <p className="mx-auto mt-2 mb-8 max-w-md text-center text-ink-soft">{dict.library.enterEmail}</p>
      <LibraryView locale={locale} dict={dict} />
    </div>
  );
}
