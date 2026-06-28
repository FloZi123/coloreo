import Link from "next/link";
import Logo from "@/components/Logo";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import PaymentMarks from "@/components/PaymentMarks";

export default function Footer({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const p = (path: string) => `/${locale}${path}`;
  const year = 2026;
  return (
    <footer className="mt-20" style={{ background: "#221E1B", color: "#FBF7F0" }}>
      <div className="container-page grid gap-8 py-14 md:grid-cols-4">
        <div>
          <Logo size={30} dark />
          <p className="mt-3 max-w-[30ch] text-sm" style={{ color: "#9a9186" }}>{dict.home.heroSubtitle}</p>
        </div>
        <div>
          <h4 className="mb-3 text-xs font-extrabold uppercase tracking-wider" style={{ color: "#9a9186" }}>{dict.nav.worlds}</h4>
          <ul className="space-y-2.5 text-sm font-semibold">
            <li><Link href={p("/welten")} className="hover:text-primary">{dict.nav.worlds}</Link></li>
            <li><Link href={p("/kategorien")} className="hover:text-primary">{dict.categories.title}</Link></li>
            <li><Link href={p("/bundles")} className="hover:text-primary">{dict.nav.bundles}</Link></li>
            <li><Link href={p("/gratis")} className="hover:text-primary">{dict.nav.freebies}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-xs font-extrabold uppercase tracking-wider" style={{ color: "#9a9186" }}>{dict.nav.help}</h4>
          <ul className="space-y-2.5 text-sm font-semibold">
            <li><Link href={p("/bibliothek")} className="hover:text-primary">{dict.nav.library}</Link></li>
            <li><Link href={p("/kontakt")} className="hover:text-primary">{dict.footer.contact}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-xs font-extrabold uppercase tracking-wider" style={{ color: "#9a9186" }}>Legal</h4>
          <ul className="space-y-2.5 text-sm font-semibold">
            <li><Link href={p("/impressum")} className="hover:text-primary">{dict.footer.imprint}</Link></li>
            <li><Link href={p("/datenschutz")} className="hover:text-primary">{dict.footer.privacy}</Link></li>
            <li><Link href={p("/agb")} className="hover:text-primary">{dict.footer.terms}</Link></li>
            <li><Link href={p("/widerruf")} className="hover:text-primary">{dict.footer.revocation}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t py-6" style={{ borderColor: "#3a352f" }}>
        <div className="container-page mb-4 flex justify-center">
          <PaymentMarks locale={locale} />
        </div>
        <div className="text-center text-xs" style={{ color: "#7a7268" }}>
          © {year} coloreo. {dict.footer.rights}
        </div>
      </div>
    </footer>
  );
}
