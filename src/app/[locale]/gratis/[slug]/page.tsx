import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { isLocale, locales, defaultLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getBookBySlug, tTitle, tName } from "@/lib/data";
import { createPublicClient } from "@/lib/supabase/public";
import FreebieForm from "@/components/FreebieForm";
import BookPreviewViewer from "@/components/BookPreviewViewer";
import JsonLd from "@/components/JsonLd";

// Lokalisierte Texte der Free-Page (Dictionaries bleiben unangetastet).
const FREE: Record<Locale, {
  badge: string; h1: (t: string) => string; intro: (t: string, n: number) => string;
  how: string; steps: string[]; captureTitle: string; toBook: string; note: string; previewTitle: string;
}> = {
  de: {
    badge: "Kostenlose Malvorlagen",
    h1: (t) => `Kostenlose Malvorlagen: ${t}`,
    intro: (t, n) => `Hol dir kostenlose Probeseiten aus „${t}" – druckfertig in A4, sofort per E-Mail. Das komplette Malbuch hat ${n} Seiten zum Sofort-Download.`,
    how: "So funktioniert's",
    steps: ["E-Mail eintragen und Gratis-Probeseiten erhalten", "Als A4-PDF herunterladen und ausdrucken", "Losmalen – und bei Gefallen das ganze Buch holen"],
    captureTitle: "Gratis-Probeseiten per E-Mail",
    toBook: "Komplettes Malbuch ansehen",
    note: "Kein Spam. Abmeldung jederzeit möglich.",
    previewTitle: "Vorschau aus dem Buch",
  },
  en: {
    badge: "Free coloring pages",
    h1: (t) => `Free coloring pages: ${t}`,
    intro: (t, n) => `Grab free sample pages from "${t}" – print-ready A4, instantly by email. The full coloring book has ${n} pages for instant download.`,
    how: "How it works",
    steps: ["Enter your email and get free sample pages", "Download as an A4 PDF and print", "Start coloring – and grab the full book if you love it"],
    captureTitle: "Free sample pages by email",
    toBook: "View the full coloring book",
    note: "No spam. Unsubscribe anytime.",
    previewTitle: "Preview from the book",
  },
  fr: {
    badge: "Coloriages gratuits",
    h1: (t) => `Coloriages gratuits : ${t}`,
    intro: (t, n) => `Recevez des pages d'exemple gratuites de « ${t} » – prêtes à imprimer en A4, par e-mail. Le livre complet compte ${n} pages en téléchargement immédiat.`,
    how: "Comment ça marche",
    steps: ["Saisissez votre e-mail et recevez des pages gratuites", "Téléchargez le PDF A4 et imprimez", "Commencez à colorier – puis prenez le livre complet"],
    captureTitle: "Pages gratuites par e-mail",
    toBook: "Voir le livre complet",
    note: "Pas de spam. Désinscription à tout moment.",
    previewTitle: "Aperçu du livre",
  },
  es: {
    badge: "Páginas para colorear gratis",
    h1: (t) => `Páginas para colorear gratis: ${t}`,
    intro: (t, n) => `Consigue páginas de muestra gratis de "${t}" – listas para imprimir en A4, al instante por correo. El libro completo tiene ${n} páginas de descarga inmediata.`,
    how: "Cómo funciona",
    steps: ["Introduce tu correo y recibe páginas gratis", "Descarga el PDF A4 e imprime", "Empieza a colorear – y consigue el libro completo"],
    captureTitle: "Páginas gratis por correo",
    toBook: "Ver el libro completo",
    note: "Sin spam. Cancela cuando quieras.",
    previewTitle: "Vista previa del libro",
  },
  it: {
    badge: "Disegni da colorare gratis",
    h1: (t) => `Disegni da colorare gratis: ${t}`,
    intro: (t, n) => `Ricevi pagine di esempio gratuite da "${t}" – pronte da stampare in A4, subito via email. Il libro completo ha ${n} pagine in download immediato.`,
    how: "Come funziona",
    steps: ["Inserisci l'email e ricevi pagine gratis", "Scarica il PDF A4 e stampa", "Inizia a colorare – e prendi il libro completo"],
    captureTitle: "Pagine gratis via email",
    toBook: "Vedi il libro completo",
    note: "Niente spam. Disiscrizione in qualsiasi momento.",
    previewTitle: "Anteprima dal libro",
  },
  nl: {
    badge: "Gratis kleurplaten",
    h1: (t) => `Gratis kleurplaten: ${t}`,
    intro: (t, n) => `Ontvang gratis voorbeeldpagina's uit "${t}" – printklaar op A4, direct per e-mail. Het volledige kleurboek heeft ${n} pagina's voor directe download.`,
    how: "Hoe het werkt",
    steps: ["Vul je e-mail in en ontvang gratis pagina's", "Download als A4-pdf en print", "Begin met kleuren – en haal het hele boek"],
    captureTitle: "Gratis pagina's per e-mail",
    toBook: "Bekijk het volledige kleurboek",
    note: "Geen spam. Altijd afmelden mogelijk.",
    previewTitle: "Voorbeeld uit het boek",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale: Locale = isLocale(raw) ? raw : "de";
  const book = await getBookBySlug(slug);
  if (!book) return {};
  const t = tTitle(book, locale);
  const title = FREE[locale].h1(t);
  const description = FREE[locale].intro(t, book.page_count).slice(0, 160);
  const languages = Object.fromEntries(locales.map((l) => [l, `/${l}/gratis/${slug}`]));
  return {
    title,
    description,
    alternates: { canonical: `/${locale}/gratis/${slug}`, languages: { ...languages, "x-default": `/${defaultLocale}/gratis/${slug}` } },
    openGraph: { title, description, images: book.cover_url ? [book.cover_url] : [], type: "website" },
  };
}

export default async function FreePrintablePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale: Locale = isLocale(raw) ? raw : "de";
  const dict = getDictionary(locale);
  const book = await getBookBySlug(slug);
  if (!book) notFound();
  const f = FREE[locale];
  const title = tTitle(book, locale);
  const category = book.category_id ? await getCategoryBySlugById(book.category_id) : null;
  const previews = Array.isArray(book.preview_urls) ? (book.preview_urls as string[]) : [];

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const ld = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: f.h1(title),
    description: f.intro(title, book.page_count),
    inLanguage: locale,
    url: `${site}/${locale}/gratis/${slug}`,
    isPartOf: { "@type": "WebSite", name: "Coloreo", url: site },
  };

  return (
    <div className="container-page py-12">
      <JsonLd data={ld} />
      <nav className="mb-4 text-sm text-muted">
        <Link href={`/${locale}/gratis`} className="hover:text-primary">{dict.freebie.title}</Link>
        {category && <> · <Link href={`/${locale}/kategorien/${category.slug}`} className="hover:text-primary">{tName(category, locale)}</Link></>}
      </nav>

      <span className="inline-flex items-center rounded-full border bg-surface px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-muted">{f.badge}</span>
      <h1 className="mt-3 font-display text-3xl font-bold md:text-4xl">{f.h1(title)}</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">{f.intro(title, book.page_count)}</p>

      <div className="mt-8 grid gap-8 md:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="mb-3 font-display text-lg font-bold">{f.previewTitle}</h2>
          {previews.length > 0 ? (
            <BookPreviewViewer images={previews} totalPages={book.page_count} locale={locale} dict={dict} />
          ) : book.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={book.cover_url} alt={title} className="w-full max-w-md rounded-2xl border" />
          ) : null}
          <h2 className="mb-3 mt-8 font-display text-lg font-bold">{f.how}</h2>
          <ol className="list-decimal space-y-2 pl-5 text-ink-soft">
            {f.steps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        </div>

        <aside>
          <div className="card p-6">
            <h2 className="font-display text-lg font-bold">{f.captureTitle}</h2>
            <div className="mt-4"><FreebieForm locale={locale} dict={dict} /></div>
            <p className="mt-3 text-xs text-muted">{f.note}</p>
          </div>
          <Link href={`/${locale}/buch/${book.slug}`} className="btn-primary mt-4 block w-full px-6 py-3 text-center text-sm">{f.toBook}</Link>
        </aside>
      </div>
    </div>
  );
}

async function getCategoryBySlugById(categoryId: string) {
  const sb = createPublicClient();
  const { data } = await sb.from("categories").select("*").eq("id", categoryId).maybeSingle();
  return data;
}
