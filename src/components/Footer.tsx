import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export default function Footer({
  locale,
  dict,
  brand,
}: {
  locale: Locale;
  dict: Dictionary;
  brand: string;
}) {
  const p = (path: string) => `/${locale}${path}`;
  const year = 2026;
  return (
    <footer className="mt-20 border-t bg-surface">
      <div className="container-page grid gap-8 py-12 md:grid-cols-4">
        <div>
          <div className="font-display text-lg font-bold">
            <span className="text-primary">✦</span> {brand}
          </div>
          <p className="mt-2 text-sm text-muted">{dict.home.heroSubtitle}</p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">{dict.nav.categories}</h4>
          <ul className="space-y-2 text-sm text-ink-soft">
            <li><Link href={p("/kategorien")} className="hover:text-primary">{dict.categories.title}</Link></li>
            <li><Link href={p("/bundles")} className="hover:text-primary">{dict.nav.bundles}</Link></li>
            <li><Link href={p("/bundle-builder")} className="hover:text-primary">{dict.nav.bundleBuilder}</Link></li>
            <li><Link href={p("/gratis")} className="hover:text-primary">{dict.nav.freebies}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">{dict.nav.help}</h4>
          <ul className="space-y-2 text-sm text-ink-soft">
            <li><Link href={p("/bibliothek")} className="hover:text-primary">{dict.nav.library}</Link></li>
            <li><Link href={p("/kontakt")} className="hover:text-primary">{dict.footer.contact}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Legal</h4>
          <ul className="space-y-2 text-sm text-ink-soft">
            <li><Link href={p("/impressum")} className="hover:text-primary">{dict.footer.imprint}</Link></li>
            <li><Link href={p("/datenschutz")} className="hover:text-primary">{dict.footer.privacy}</Link></li>
            <li><Link href={p("/agb")} className="hover:text-primary">{dict.footer.terms}</Link></li>
            <li><Link href={p("/widerruf")} className="hover:text-primary">{dict.footer.revocation}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t py-5 text-center text-xs text-muted">
        © {year} {brand}. {dict.footer.rights}
      </div>
    </footer>
  );
}
