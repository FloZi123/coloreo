import { isLocale, type Locale } from "@/i18n/config";
import { getLegal, type LegalKey } from "@/lib/legalContent";

export default async function LegalPage({
  params,
  legalKey,
}: {
  params: Promise<{ locale: string }>;
  legalKey: LegalKey;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "de";
  const { title, html } = getLegal(legalKey, locale);

  return (
    <div className="container-page py-12">
      <article className="mx-auto max-w-3xl">
        <h1 className="mb-6 font-display text-3xl font-bold">{title}</h1>
        <div
          className="prose-legal space-y-3 text-ink-soft [&_h3]:mt-6 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-ink"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
    </div>
  );
}
