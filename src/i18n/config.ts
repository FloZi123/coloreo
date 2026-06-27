export const locales = ["de", "en", "fr", "es", "it", "nl"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "de";

/** Anzeigename + Flagge je Sprache (für Sprachumschalter). */
export const localeMeta: Record<Locale, { label: string; flag: string }> = {
  de: { label: "Deutsch", flag: "🇩🇪" },
  en: { label: "English", flag: "🇬🇧" },
  fr: { label: "Français", flag: "🇫🇷" },
  es: { label: "Español", flag: "🇪🇸" },
  it: { label: "Italiano", flag: "🇮🇹" },
  nl: { label: "Nederlands", flag: "🇳🇱" },
};

/** Englischer Name der Sprache (für Übersetzungs-Prompts). */
export const localeEnglishName: Record<Locale, string> = {
  de: "German", en: "English", fr: "French", es: "Spanish", it: "Italian", nl: "Dutch",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
