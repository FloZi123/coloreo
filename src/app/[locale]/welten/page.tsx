import Link from "next/link";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getWorlds, tName, tDesc } from "@/lib/data";
import { Emoji } from "@/components/Emoji";

export default async function WorldsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "de";
  const dict = getDictionary(locale);
  const worlds = await getWorlds();

  return (
    <div className="container-page py-12">
      <h1 className="font-display text-3xl font-bold">{dict.nav.worlds}</h1>
      <p className="mb-8 mt-2 text-ink-soft">{dict.worlds.subtitle}</p>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {worlds.map((w) => (
          <Link key={w.id} href={`/${locale}/welten/${w.slug}`} className="card p-6 transition hover:-translate-y-1 hover:shadow-lg" style={{ borderColor: w.accent ?? undefined }}>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl" style={{ background: (w.accent ?? "#7C4DFF") + "22" }}><Emoji emoji={w.emoji} label={tName(w, locale)} /></div>
            <h3 className="mt-4 font-display text-xl font-bold">{tName(w, locale)}</h3>
            <p className="mt-1 text-sm text-ink-soft">{tDesc(w, locale)}</p>
            <span className="mt-3 inline-block text-sm font-semibold" style={{ color: w.accent ?? "#7C4DFF" }}>{dict.worlds.explore} →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
