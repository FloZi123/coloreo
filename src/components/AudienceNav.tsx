import Link from "next/link";
import type { Locale } from "@/i18n/config";

/** Zielgruppen-Navigation (ersetzt die 6-Welten-Taxonomie als Primär-Browse). */
export const AUDIENCE_LABELS: Record<Locale, { adults: string; kids: string; adultsSub: string; kidsSub: string; collection: string }> = {
  de: { adults: "Für Erwachsene", kids: "Für Kinder", adultsSub: "Anti-Stress · filigran & entspannend", kidsSub: "Bold & Easy · große Formen", collection: "Anti-Stress-Kollektion" },
  en: { adults: "For adults", kids: "For kids", adultsSub: "Anti-stress · intricate & calming", kidsSub: "Bold & easy · big shapes", collection: "Anti-stress collection" },
  fr: { adults: "Pour adultes", kids: "Pour enfants", adultsSub: "Anti-stress · fin & apaisant", kidsSub: "Simple · grandes formes", collection: "Collection anti-stress" },
  es: { adults: "Para adultos", kids: "Para niños", adultsSub: "Antiestrés · fino y relajante", kidsSub: "Fácil · formas grandes", collection: "Colección antiestrés" },
  it: { adults: "Per adulti", kids: "Per bambini", adultsSub: "Antistress · fine e rilassante", kidsSub: "Semplice · forme grandi", collection: "Collezione antistress" },
  nl: { adults: "Voor volwassenen", kids: "Voor kinderen", adultsSub: "Anti-stress · fijn & rustgevend", kidsSub: "Simpel · grote vormen", collection: "Anti-stress-collectie" },
};

/** Ziel-URLs (Welt-URLs bleiben bestehen, hier nur audience-Filter der Suche). */
export const AUDIENCE_HREF = { adults: "/suche?audience=adult", kids: "/suche?audience=kids" };
/** Held-/Anti-Stress-Kollektion (bestehende Kategorie, nicht gelöscht). */
export const COLLECTION_HREF = "/kategorien/cottagecore";

export default function AudienceNav({ locale }: { locale: Locale }) {
  const t = AUDIENCE_LABELS[locale] ?? AUDIENCE_LABELS.de;
  const cards = [
    { href: `/${locale}${AUDIENCE_HREF.adults}`, title: t.adults, sub: t.adultsSub },
    { href: `/${locale}${AUDIENCE_HREF.kids}`, title: t.kids, sub: t.kidsSub },
  ];
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {cards.map((c) => (
        <Link
          key={c.href}
          href={c.href}
          className="card flex flex-col gap-1 p-8 transition hover:-translate-y-1 hover:shadow-lg"
        >
          <span className="font-display text-2xl font-bold">{c.title}</span>
          <span className="text-sm text-muted">{c.sub}</span>
          <span className="mt-3 text-sm font-semibold text-primary">→</span>
        </Link>
      ))}
    </div>
  );
}
