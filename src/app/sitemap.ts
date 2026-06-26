import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { getCategories, getBooks, getBundles, getWorlds } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const [categories, books, bundles, worlds] = await Promise.all([getCategories(), getBooks({ limit: 500 }), getBundles(), getWorlds()]);

  const entries: MetadataRoute.Sitemap = [];
  const staticPaths = ["", "/welten", "/kategorien", "/bundles", "/bundle-builder", "/gratis", "/bibliothek"];

  for (const locale of locales) {
    for (const p of staticPaths) {
      entries.push({ url: `${base}/${locale}${p}`, changeFrequency: "weekly", priority: p === "" ? 1 : 0.7 });
    }
    for (const w of worlds) entries.push({ url: `${base}/${locale}/welten/${w.slug}`, changeFrequency: "weekly", priority: 0.7 });
    for (const c of categories) entries.push({ url: `${base}/${locale}/kategorien/${c.slug}`, changeFrequency: "weekly", priority: 0.6 });
    for (const b of books) entries.push({ url: `${base}/${locale}/buch/${b.slug}`, changeFrequency: "weekly", priority: 0.8 });
    for (const bu of bundles) entries.push({ url: `${base}/${locale}/bundles/${bu.slug}`, changeFrequency: "weekly", priority: 0.7 });
  }
  return entries;
}
