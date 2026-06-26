"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart/store";
import Logo from "@/components/Logo";
import type { Locale } from "@/i18n/config";
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

  const otherLocale: Locale = locale === "de" ? "en" : "de";
  const switchHref = pathname.replace(/^\/(de|en)/, `/${otherLocale}`);

  const links = [
    { href: p("/kategorien"), label: dict.nav.categories },
    { href: p("/bundles"), label: dict.nav.bundles },
    { href: p("/bundle-builder"), label: dict.nav.bundleBuilder },
    { href: p("/gratis"), label: dict.nav.freebies },
    { href: p("/bibliothek"), label: dict.nav.library },
  ];
  const searchLabel = locale === "de" ? "Suche" : "Search";

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
          <Link
            href={switchHref}
            className="rounded-full border px-2.5 py-1 text-xs font-semibold uppercase text-ink-soft hover:border-primary hover:text-primary"
          >
            {otherLocale}
          </Link>
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
