import type { Locale } from "../../i18n/config";

/** Lokalisierte Texte für Social-Assets (Pins/Videos). */
export interface SocialStrings {
  hookSub: string;     // Untertitel im Hook (Flip)
  pinSub: string;      // Pin-Untertitel
  revealSub: string;   // Reveal-Untertitel
  ctaEndcard: string;  // Endcard-CTA
  disclosure: string;  // sichtbare KI-Kennzeichnung (EU-AI-Act Art. 50 / Plattform-Pflicht)
}

export const SOCIAL_I18N: Record<Locale, SocialStrings> = {
  de: { hookSub: "Sofort ausdrucken & losmalen", pinSub: "Vorlage & ausgemalt", revealSub: "Aus Linie wird Farbe", ctaEndcard: "Sofort-Download · druckfertig", disclosure: "KI-generiert" },
  en: { hookSub: "Print instantly & start coloring", pinSub: "Before & after", revealSub: "From line to color", ctaEndcard: "Instant download · print-ready", disclosure: "AI-generated" },
  fr: { hookSub: "Imprimez et coloriez aussitôt", pinSub: "Avant & après", revealSub: "De la ligne à la couleur", ctaEndcard: "Téléchargement immédiat · prêt à imprimer", disclosure: "Généré par IA" },
  es: { hookSub: "Imprime y colorea al instante", pinSub: "Antes y después", revealSub: "De la línea al color", ctaEndcard: "Descarga inmediata · listo para imprimir", disclosure: "Generado por IA" },
  it: { hookSub: "Stampa e colora subito", pinSub: "Prima e dopo", revealSub: "Dalla linea al colore", ctaEndcard: "Download immediato · pronto da stampare", disclosure: "Generato con IA" },
  nl: { hookSub: "Direct printen & kleuren", pinSub: "Voor & na", revealSub: "Van lijn naar kleur", ctaEndcard: "Direct downloaden · printklaar", disclosure: "AI-gegenereerd" },
};
