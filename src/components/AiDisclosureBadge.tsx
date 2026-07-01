import type { Locale } from "@/i18n/config";

/**
 * Ehrliche, dezente KI-Kennzeichnung (EU-AI-Act Art. 50 – bleibt bestehen, wird nur wärmer formuliert
 * statt „KI-generiert"). Bewusst unaufdringlich (Footer/Produkt-Fuß), NICHT im Hero.
 */
export const AI_DISCLOSURE: Record<Locale, string> = {
  de: "Mit KI erstellt · von Hand kuratiert",
  en: "Made with AI · hand-curated",
  fr: "Créé avec l'IA · sélectionné à la main",
  es: "Creado con IA · seleccionado a mano",
  it: "Creato con IA · curato a mano",
  nl: "Gemaakt met AI · met de hand samengesteld",
};

export default function AiDisclosureBadge({ locale, className = "" }: { locale: Locale; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted ${className}`}
      title={AI_DISCLOSURE[locale]}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--color-accent)" }} />
      {AI_DISCLOSURE[locale]}
    </span>
  );
}
