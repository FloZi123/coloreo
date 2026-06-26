import Link from "next/link";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import LibraryView from "@/components/LibraryView";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

async function loadLibrary(email: string) {
  const admin = createAdminClient();
  const { data: orders } = await admin
    .from("orders")
    .select("id, order_number, created_at")
    .eq("customer_email", email.toLowerCase())
    .eq("status", "paid")
    .order("created_at", { ascending: false });
  if (!orders?.length) return [];
  const ids = orders.map((o) => o.id);
  const { data: dls } = await admin.from("downloads").select("order_id, book_id, token, download_count, max_downloads, expires_at").in("order_id", ids);
  const bookIds = [...new Set((dls ?? []).map((d) => d.book_id))];
  const { data: books } = bookIds.length ? await admin.from("books").select("id, title_de").in("id", bookIds) : { data: [] as { id: string; title_de: string }[] };
  const bm = new Map((books ?? []).map((b) => [b.id, b.title_de]));
  return orders.map((o) => ({
    orderNumber: o.order_number,
    date: o.created_at,
    items: (dls ?? []).filter((d) => d.order_id === o.id).map((d) => ({
      title: bm.get(d.book_id) ?? "Malbuch",
      url: `${SITE}/api/download/${d.token}`,
      left: Math.max(0, d.max_downloads - d.download_count),
      expired: new Date(d.expires_at) < new Date(),
    })),
  }));
}

export default async function LibraryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "de";
  const dict = getDictionary(locale);
  const de = locale === "de";

  let email: string | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    email = data.user?.email ?? null;
  } catch {}

  if (email) {
    const orders = await loadLibrary(email);
    return (
      <div className="container-page py-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">{dict.library.title}</h1>
            <p className="text-ink-soft">{email}</p>
          </div>
          <LogoutButton locale={locale} />
        </div>
        {orders.length === 0 ? (
          <div className="card p-10 text-center text-muted">{dict.library.noPurchases}</div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-6">
            {orders.map((o) => (
              <div key={o.orderNumber} className="card p-5">
                <div className="mb-3 flex justify-between text-sm text-muted">
                  <span>{o.orderNumber}</span>
                  <span>{new Date(o.date).toLocaleDateString(de ? "de-DE" : "en-IE")}</span>
                </div>
                <div className="space-y-2">
                  {o.items.map((it, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl border px-4 py-3">
                      <span className="font-display text-sm font-semibold">🎨 {it.title}</span>
                      {it.expired ? <span className="text-xs text-muted">{de ? "abgelaufen" : "expired"}</span> : (
                        <a href={it.url} className="btn-primary px-4 py-1.5 text-xs">⬇ {dict.common.download} ({it.left})</a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container-page py-16">
      <h1 className="text-center font-display text-3xl font-bold">{dict.library.title}</h1>
      <p className="mx-auto mt-2 mb-4 max-w-md text-center text-ink-soft">{dict.library.enterEmail}</p>
      <p className="mx-auto mb-8 max-w-md text-center text-sm">
        <Link href={`/${locale}/login`} className="font-semibold text-primary hover:underline">
          🔑 {de ? "Mit Magic-Link sicher anmelden" : "Sign in securely with a magic link"}
        </Link>
      </p>
      <LibraryView locale={locale} dict={dict} />
    </div>
  );
}
