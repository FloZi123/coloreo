import { Suspense } from "react";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import DankeView from "@/components/DankeView";

export default async function DankePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "de";
  const dict = getDictionary(locale);
  return (
    <Suspense>
      <DankeView locale={locale} dict={dict} />
    </Suspense>
  );
}
