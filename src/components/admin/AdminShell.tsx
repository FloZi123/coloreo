"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/buecher", label: "Bücher", icon: "📚" },
  { href: "/admin/kategorien", label: "Kategorien", icon: "🗂️" },
  { href: "/admin/bundles", label: "Bundles", icon: "📦" },
  { href: "/admin/bestellungen", label: "Bestellungen", icon: "🧾" },
  { href: "/admin/gutscheine", label: "Gutscheine", icon: "🏷️" },
  { href: "/admin/leads", label: "Leads & Newsletter", icon: "✉️" },
  { href: "/admin/support", label: "Support", icon: "💬" },
  { href: "/admin/generator", label: "Auto-Generator", icon: "🤖" },
  { href: "/admin/reviews", label: "Bewertungen", icon: "⭐" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 flex-col border-r bg-surface p-4">
        <div className="mb-6 px-2 font-display text-xl font-bold">
          <span className="text-primary">✦</span> Coloreo
        </div>
        <nav className="flex-1 space-y-1">
          {NAV.map((n) => {
            const active = n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium ${
                  active ? "bg-primary text-white" : "text-ink-soft hover:bg-primary-soft"
                }`}
              >
                <span>{n.icon}</span> {n.label}
              </Link>
            );
          })}
        </nav>
        <Link href="/de" className="px-3 py-2 text-xs text-muted hover:text-primary">← Zum Shop</Link>
        <button onClick={logout} className="mt-1 rounded-xl px-3 py-2 text-left text-sm text-ink-soft hover:bg-accent-soft hover:text-accent">
          ⏻ Abmelden
        </button>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
