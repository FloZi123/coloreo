import Link from "next/link";
import { isLocale, type Locale } from "@/i18n/config";

export default async function NewsletterConfirmed({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "de";
  const de = locale === "de";
  return (
    <div className="container-page py-20">
      <div className="card mx-auto max-w-md p-10 text-center">
        <span className="text-5xl">✅</span>
        <h1 className="mt-4 font-display text-2xl font-bold">{de ? "Anmeldung bestätigt!" : "Sign-up confirmed!"}</h1>
        <p className="mt-3 text-ink-soft">
          {de ? "Danke! Du erhältst ab jetzt unsere Gratis-Vorlagen und Angebote. Dein Willkommens-Code: " : "Thank you! You'll now receive our free pages and offers. Your welcome code: "}
          <strong className="text-primary">WILLKOMMEN10</strong>
        </p>
        <Link href={`/${locale}/kategorien`} className="btn-primary mt-6 inline-block px-6 py-3">
          {de ? "Jetzt stöbern" : "Start browsing"}
        </Link>
      </div>
    </div>
  );
}
