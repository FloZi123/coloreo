import type { Locale } from "@/i18n/config";

interface Badge {
  icon: string;
  label: string;
}

const badgesByLocale: Record<string, Badge[]> = {
  de: [
    { icon: "⚡", label: "Sofort-Download" },
    { icon: "🖨️", label: "Druckfertiges A4-PDF" },
    { icon: "🔒", label: "Sichere Zahlung" },
    { icon: "💧", label: "Personalisiertes Wasserzeichen" },
  ],
  en: [
    { icon: "⚡", label: "Instant download" },
    { icon: "🖨️", label: "Print-ready A4 PDF" },
    { icon: "🔒", label: "Secure payment" },
    { icon: "💧", label: "Personalised watermark" },
  ],
  fr: [
    { icon: "⚡", label: "Téléchargement immédiat" },
    { icon: "🖨️", label: "PDF A4 prêt à imprimer" },
    { icon: "🔒", label: "Paiement sécurisé" },
    { icon: "💧", label: "Filigrane personnalisé" },
  ],
  es: [
    { icon: "⚡", label: "Descarga instantánea" },
    { icon: "🖨️", label: "PDF A4 listo para imprimir" },
    { icon: "🔒", label: "Pago seguro" },
    { icon: "💧", label: "Marca de agua personalizada" },
  ],
  it: [
    { icon: "⚡", label: "Download immediato" },
    { icon: "🖨️", label: "PDF A4 pronto per la stampa" },
    { icon: "🔒", label: "Pagamento sicuro" },
    { icon: "💧", label: "Filigrana personalizzata" },
  ],
  nl: [
    { icon: "⚡", label: "Directe download" },
    { icon: "🖨️", label: "Drukklare A4-PDF" },
    { icon: "🔒", label: "Veilige betaling" },
    { icon: "💧", label: "Gepersonaliseerd watermerk" },
  ],
};

interface Props {
  locale: Locale;
  /** "row" = horizontal strip (default), "grid" = 2x2 grid for footer */
  variant?: "row" | "grid";
}

export default function TrustBadges({ locale, variant = "row" }: Props) {
  const badges = badgesByLocale[locale] ?? badgesByLocale["en"];

  if (variant === "grid") {
    return (
      <div className="grid grid-cols-2 gap-2">
        {badges.map((b) => (
          <div key={b.label} className="flex items-center gap-2 text-xs" style={{ color: "#9a9186" }}>
            <span>{b.icon}</span>
            <span>{b.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
      {badges.map((b) => (
        <div
          key={b.label}
          className="flex items-center gap-2 rounded-2xl border bg-surface px-4 py-2 text-sm font-medium text-ink-soft"
        >
          <span className="text-base">{b.icon}</span>
          <span>{b.label}</span>
        </div>
      ))}
    </div>
  );
}
