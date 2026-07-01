"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart/store";
import Logo from "@/components/Logo";
import CurrencySwitcher from "@/components/CurrencySwitcher";
import { AUDIENCE_LABELS, AUDIENCE_HREF } from "@/components/AudienceNav";
import { locales, localeMeta, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export default function Header({
  locale,
  dict,
  brand,
}: {
  locale: Locale;
  dict: Dictionary;
  brand: string;
}) {
  const { count } = useCart();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const p = (path: string) => `/${locale}${path}`;

  const restPath = pathname.replace(/^\/(de|en|fr|es|it|nl)(?=\/|$)/, "") || "";
  const hrefFor = (l: Locale) => `/${l}${restPath}`;

  // IA-Fokus: Welten NICHT mehr im Hauptmenü (URLs bleiben bestehen). Führung über Zielgruppen.
  const aud = AUDIENCE_LABELS[locale] ?? AUDIENCE_LABELS.de;
  const links = [
    { href: p(AUDIENCE_HREF.adults), label: aud.adults },
    { href: p(AUDIENCE_HREF.kids), label: aud.kids },
    { href: p("/kategorien"), label: dict.nav.categories },
    { href: p("/bundles"), label: dict.nav.bundles },
    { href: p("/gratis"), label: dict.nav.freebies },
    { href: p("/bibliothek"), label: dict.nav.library },
  ];
  const searchLabel = dict.account.searchLabel;

  return (
    <header className="sticky top-0 z-40 border-b bg-paper/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href={p("")} aria-label={brand}>
          <Logo size={32} />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium text-ink-soft hover:text-primary">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href={p("/suche")} aria-label={searchLabel} className="rounded-full px-2 py-2 text-ink-soft hover:text-primary" title={searchLabel}>
            🔍
          </Link>
          <CurrencySwitcher className="hidden sm:block" />
          <div className="group relative">
            <button
              type="button"
              className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase text-ink-soft hover:border-primary hover:text-primary"
              aria-label="Sprache / Language"
            >
              {localeMeta[locale].flag} {locale}
            </button>
            <div className="invisible absolute right-0 z-50 mt-1 w-44 rounded-xl border bg-paper p-1 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
              {locales.map((l) => (
                <Link
                  key={l}
                  href={hrefFor(l)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${l === locale ? "font-semibold text-primary" : "text-ink-soft hover:bg-primary-soft"}`}
                >
                  <span>{localeMeta[l].flag}</span> {localeMeta[l].label}
                </Link>
              ))}
            </div>
          </div>
          <Link href={p("/warenkorb")} className="relative rounded-full bg-primary-soft px-3 py-2 text-sm font-semibold text-primary hover:bg-primary hover:text-white">
            🛒
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
          <button
            className="md:hidden rounded-full border px-3 py-2 text-sm"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menü"
          >
            ☰
          </button>
        </div>
      </div>

      {open && (
        <nav className="md:hidden border-t bg-surface px-5 py-3">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block py-2 text-ink-soft">
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
