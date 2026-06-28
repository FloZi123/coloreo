import type { Locale } from "@/i18n/config";
import type { ReactNode } from "react";

/**
 * Drei ehrliche, nutzenorientierte Aussagen – KEINE Emojis, kein Selbstlob, kein
 * Zahlungs-Claim (dafür gibt es PaymentMarks) und kein Wasserzeichen (das steht als
 * Fußnote auf der Produktseite). Dezente Inline-Linien-Icons, ruhige Optik.
 */

const labelsByLocale: Record<string, string[]> = {
  de: ["Sofort-Download", "Druckfertiges A4-PDF", "Beliebig oft drucken"],
  en: ["Instant download", "Print-ready A4 PDF", "Print as often as you like"],
  fr: ["Téléchargement immédiat", "PDF A4 prêt à imprimer", "Imprimez autant que vous voulez"],
  es: ["Descarga instantánea", "PDF A4 listo para imprimir", "Imprime las veces que quieras"],
  it: ["Download immediato", "PDF A4 pronto per la stampa", "Stampa quante volte vuoi"],
  nl: ["Directe download", "Drukklare A4-PDF", "Print zo vaak je wilt"],
};

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const icons: ReactNode[] = [
  // Download
  <svg key="dl" {...iconProps}><path d="M12 3v12" /><path d="m7 11 5 4 5-4" /><path d="M5 21h14" /></svg>,
  // Printer
  <svg key="pr" {...iconProps}><path d="M6 9V3h12v6" /><rect x="4" y="9" width="16" height="8" rx="2" /><path d="M8 17h8v4H8z" /></svg>,
  // Repeat / unlimited
  <svg key="rp" {...iconProps}><path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>,
];

interface Props {
  locale: Locale;
  /** "row" = horizontale Leiste (Hero), "grid" = gestapelt (z. B. Sidebar). */
  variant?: "row" | "grid";
}

export default function TrustBadges({ locale, variant = "row" }: Props) {
  const labels = labelsByLocale[locale] ?? labelsByLocale.en;
  const items = labels.map((label, i) => (
    <div key={label} className="flex items-center gap-2 text-sm text-ink-soft">
      <span className="text-muted">{icons[i]}</span>
      <span>{label}</span>
    </div>
  ));

  if (variant === "grid") {
    return <div className="flex flex-col gap-2">{items}</div>;
  }
  return <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3">{items}</div>;
}
