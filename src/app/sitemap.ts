import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { getCategories, getBooks, getBundles, getWorlds } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const [categories, books, bundles, worlds] = await Promise.all([getCategories(), getBooks({ limit: 500 }), getBundles(), getWorlds()]);

  // hreflang-Alternates je Pfad über alle Locales.
  const langs = (path: string) => Object.fromEntries(locales.map((l) => [l, `${base}/${l}${path}`]));
  const entries: MetadataRoute.Sitemap = [];
  const push = (path: string, priority: number) => {
    for (const locale of locales) {
      entries.push({ url: `${base}/${locale}${path}`, changeFrequency: "weekly", priority, alternates: { languages: langs(path) } });
    }
  };

  for (const p of ["", "/welten", "/kategorien", "/bundles", "/bundle-builder", "/gratis", "/bibliothek"]) push(p, p === "" ? 1 : 0.7);
  for (const w of worlds) push(`/welten/${w.slug}`, 0.7);
  for (const c of categories) push(`/kategorien/${c.slug}`, 0.6);
  for (const b of books) {
    push(`/buch/${b.slug}`, 0.8);
    push(`/gratis/${b.slug}`, 0.6); // Free-Printable-Landingpage je Buch
  }
  for (const bu of bundles) push(`/bundles/${bu.slug}`, 0.7);
  return entries;
}
