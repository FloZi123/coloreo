import type { Locale } from "@/i18n/config";

/**
 * Echte Zahlungslogos – NUR im Stripe-Konto aktive Methoden (Visa, Mastercard, Klarna).
 * PayPal ist auf dem Konto nicht aktiv und wird daher nicht gezeigt. Lokale Inline-SVGs,
 * keine externen Requests. „powered by Stripe" als ehrliches Sicherheits-Signal.
 */

const SECURE: Record<string, string> = {
  de: "Sichere Zahlung",
  en: "Secure payment",
  fr: "Paiement sécurisé",
  es: "Pago seguro",
  it: "Pagamento sicuro",
  nl: "Veilige betaling",
};

function Visa() {
  return (
    <svg viewBox="0 0 48 30" width="40" height="25" role="img" aria-label="Visa" className="rounded-[5px] border border-black/10 bg-white">
      <text x="24" y="20" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="13" fontStyle="italic" fontWeight="700" fill="#1A1F71" letterSpacing="0.5">VISA</text>
    </svg>
  );
}

function Mastercard() {
  return (
    <svg viewBox="0 0 48 30" width="40" height="25" role="img" aria-label="Mastercard" className="rounded-[5px] border border-black/10 bg-white">
      <circle cx="20" cy="15" r="8.5" fill="#EB001B" />
      <circle cx="28" cy="15" r="8.5" fill="#F79E1B" />
      <path d="M24 8.6a8.5 8.5 0 0 0 0 12.8 8.5 8.5 0 0 0 0-12.8Z" fill="#FF5F00" />
    </svg>
  );
}

function Klarna() {
  return (
    <svg viewBox="0 0 48 30" width="40" height="25" role="img" aria-label="Klarna" className="rounded-[5px] border border-black/10" style={{ background: "#FFB3C7" }}>
      <text x="24" y="20" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="700" fill="#0A0B09">Klarna</text>
    </svg>
  );
}

interface Props {
  locale: Locale;
  className?: string;
  /** Sicherheits-Label + „powered by Stripe" anzeigen (Default: true). */
  withLabel?: boolean;
}

export default function PaymentMarks({ locale, className = "", withLabel = true }: Props) {
  const secure = SECURE[locale] ?? SECURE.en;
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 ${className}`}>
      {withLabel && <span className="text-xs font-medium text-ink-soft">{secure}</span>}
      <span className="flex items-center gap-1.5">
        <Visa />
        <Mastercard />
        <Klarna />
      </span>
      {withLabel && <span className="text-[11px] text-muted">powered by Stripe</span>}
    </div>
  );
}
