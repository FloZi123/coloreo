import { createAdminClient } from "@/lib/supabase/admin";
import { getAnthropic, anthropicConfigured, MODELS } from "@/lib/anthropic";
import { coverSvg, masterPdfBytes } from "@/lib/generator/art";
import { imageProviderConfigured, getImageProvider } from "@/lib/generator/imageProvider";
import {
  isThematicCategory,
  motifsForCategory,
  generateMasterFromMotifs,
  generateCoverImage,
} from "@/lib/generator/thematic";
import { makeWatermarkedPreviews } from "@/lib/generator/previews";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type Admin = SupabaseClient<Database>;
type Audience = "adult" | "kids" | "all";

interface BookSpec {
  titleDe: string;
  titleEn: string;
  descDe: string;
  descEn: string;
  categoryId: string | null;
  categoryName: string;
  categorySlug: string;
  audience: Audience;
  motifs: string[];
  heroMotif: string;
  priceCents?: number;
  pages?: number;
}

/** Standard-Preis (Cent) je Zielgruppe – analog Konzept-Anker. */
function defaultPriceFor(audience: Audience): number {
  return audience === "kids" ? 499 : audience === "all" ? 599 : 699;
}

/**
 * Erzeugt Cover (Stil B, falls Bild-Provider konfiguriert), Master-PDF (KI-Linienkunst oder
 * prozedural), Wasserzeichen-Vorschauen und legt das Buch als Entwurf an. Liefert die Buch-ID.
 */
async function materializeBook(admin: Admin, spec: BookSpec): Promise<string> {
  const slug = `${slugify(spec.titleDe)}-${Math.floor(Math.random() * 9000 + 1000)}`;
  const pages = Math.min(40, Math.max(8, spec.pages ?? 18));
  const useAI = imageProviderConfigured();

  // Cover
  let coverUrl: string;
  if (useAI) {
    const png = await generateCoverImage(getImageProvider(), {
      title: spec.titleDe,
      categoryName: `${spec.categoryName}`,
      heroMotif: spec.heroMotif,
      pages,
    });
    await admin.storage.from("covers").upload(`${slug}.png`, png, { contentType: "image/png", upsert: true });
    coverUrl = `${SUPA_URL}/storage/v1/object/public/covers/${slug}.png`;
  } else {
    const svg = coverSvg(slug, spec.titleDe, spec.categoryName, "🎨", pages);
    await admin.storage.from("covers").upload(`${slug}.svg`, new TextEncoder().encode(svg), { contentType: "image/svg+xml", upsert: true });
    coverUrl = `${SUPA_URL}/storage/v1/object/public/covers/${slug}.svg`;
  }

  // Master-PDF
  const pdf = useAI
    ? await generateMasterFromMotifs(getImageProvider(), { slug, titleDe: spec.titleDe, audience: spec.audience }, spec.motifs, pages)
    : await masterPdfBytes(slug, spec.titleDe, pages);
  await admin.storage.from("books").upload(`${slug}.pdf`, pdf, { contentType: "application/pdf", upsert: true });

  // Wasserzeichen-Vorschauen (best effort)
  let previewUrls: string[] = [];
  try {
    const previews = await makeWatermarkedPreviews(pdf, 5);
    previewUrls = [];
    for (let i = 0; i < previews.length; i++) {
      const path = `${slug}/p${i + 1}.webp`;
      await admin.storage.from("previews").upload(path, previews[i], { contentType: "image/webp", upsert: true });
      previewUrls.push(`${SUPA_URL}/storage/v1/object/public/previews/${path}`);
    }
  } catch (e) {
    console.warn("[autogen] Vorschau-Erzeugung übersprungen:", e instanceof Error ? e.message : e);
  }

  const { data: book, error } = await admin
    .from("books")
    .insert({
      slug,
      category_id: spec.categoryId,
      title_de: spec.titleDe,
      title_en: spec.titleEn,
      description_de: spec.descDe,
      description_en: spec.descEn,
      i18n: { de: { title: spec.titleDe, description: spec.descDe }, en: { title: spec.titleEn, description: spec.descEn } },
      price_cents: spec.priceCents ?? defaultPriceFor(spec.audience),
      page_count: pages,
      cover_url: coverUrl,
      pdf_path: `${slug}.pdf`,
      preview_urls: previewUrls,
      status: "draft",
      source: "ai_generated",
      tags: [spec.categorySlug || "ki", "malbuch", "pdf"],
    })
    .select("id")
    .single();
  if (error || !book) throw error ?? new Error("book_insert_failed");
  return book.id;
}

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/** Trend-Scan: identifiziert starke Kategorien anhand Verkäufen und schlägt neue Bücher vor. */
export async function scanTrends(): Promise<number> {
  const admin = createAdminClient();
  const { data: cats } = await admin.from("categories").select("id, name_de, name_en, emoji, slug").eq("is_active", true);
  const { data: books } = await admin.from("books").select("category_id, sales_count, title_de");

  // Verkäufe je Kategorie aggregieren
  const salesByCat = new Map<string, number>();
  for (const b of books ?? []) {
    if (b.category_id) salesByCat.set(b.category_id, (salesByCat.get(b.category_id) ?? 0) + b.sales_count);
  }
  const ranked = (cats ?? [])
    .map((c) => ({ ...c, sales: salesByCat.get(c.id) ?? 0 }))
    .sort((a, b) => b.sales - a.sales);

  // Top-Kategorien (bei null Verkäufen: erste 3 als Start)
  const top = ranked.slice(0, 3);

  const suggestions: { title_de: string; title_en: string; category_id: string; rationale: string }[] = [];

  if (anthropicConfigured()) {
    const client = getAnthropic();
    const ctx = top.map((c) => `${c.name_de} (Verkäufe: ${c.sales})`).join(", ");
    const res = await client.messages.create({
      model: MODELS.content,
      max_tokens: 700,
      messages: [
        {
          role: "user",
          content: `Du planst neue digitale Malbücher für den Shop "Coloreo". Basierend auf den umsatzstärksten Kategorien: ${ctx}.
Schlage 3 konkrete, verkaufsstarke neue Malbuch-Titel vor (je 1 pro Top-Kategorie), die sich von bestehenden abheben (spezielle Themen/Anlässe/Trends).
Antworte AUSSCHLIESSLICH als JSON-Array: [{"category_de":"<Kategoriename>","title_de":"...","title_en":"...","rationale":"<1 Satz warum>"}]`,
        },
      ],
    });
    const txt = res.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("");
    try {
      const arr = JSON.parse(txt.slice(txt.indexOf("["), txt.lastIndexOf("]") + 1));
      for (const s of arr) {
        const cat = top.find((c) => c.name_de === s.category_de) ?? top[0];
        suggestions.push({ title_de: s.title_de, title_en: s.title_en, category_id: cat.id, rationale: s.rationale });
      }
    } catch {
      // fällt unten auf Heuristik zurück
    }
  }

  if (suggestions.length === 0) {
    // Heuristik-Fallback
    for (const c of top) {
      suggestions.push({
        title_de: `${c.name_de} – Special Edition`,
        title_en: `${c.name_en} – Special Edition`,
        category_id: c.id,
        rationale: `Starke Kategorie (${c.sales} Verkäufe) – neue Edition kann Nachfrage abschöpfen.`,
      });
    }
  }

  let created = 0;
  for (const s of suggestions) {
    const { error } = await admin.from("book_generation_queue").insert({
      suggested_title_de: s.title_de,
      suggested_title_en: s.title_en,
      category_id: s.category_id,
      rationale: s.rationale,
      status: "suggested",
      trigger_data: { source: "trend_scan" },
    });
    if (!error) created++;
  }
  return created;
}

/** Erzeugt aus einem Queue-Vorschlag einen vollständigen Buch-Entwurf (Texte + Cover + PDF). */
export async function generateBookDraft(queueId: string): Promise<{ bookId: string }> {
  const admin = createAdminClient();
  const { data: item } = await admin
    .from("book_generation_queue")
    .select("id, suggested_title_de, suggested_title_en, category_id, status")
    .eq("id", queueId)
    .single();
  if (!item) throw new Error("queue_item_not_found");

  await admin.from("book_generation_queue").update({ status: "generating" }).eq("id", queueId);

  const { data: cat } = await admin.from("categories").select("name_de, name_en, emoji, slug, audience").eq("id", item.category_id ?? "").maybeSingle();
  const audience = (cat?.audience ?? "adult") as Audience;
  const catSlug = cat?.slug ?? "";

  let titleDe = item.suggested_title_de;
  let titleEn = item.suggested_title_en;
  let descDe = `Ein neues ${cat?.name_de ?? ""}-Malbuch mit liebevoll gestalteten Motiven. Sofort als PDF herunterladen und losmalen.`;
  let descEn = `A new ${cat?.name_en ?? ""} coloring book with lovingly designed motifs. Download instantly as PDF and start coloring.`;

  if (anthropicConfigured()) {
    try {
      const client = getAnthropic();
      const res = await client.messages.create({
        model: MODELS.content,
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: `Erzeuge Produkttexte für ein digitales Malbuch.
Kategorie: ${cat?.name_de}. Arbeitstitel: ${item.suggested_title_de}.
Antworte als JSON: {"title_de":"...","title_en":"...","description_de":"<2 Sätze>","description_en":"<2 sentences>"}`,
          },
        ],
      });
      const txt = res.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("");
      const j = JSON.parse(txt.slice(txt.indexOf("{"), txt.lastIndexOf("}") + 1));
      titleDe = j.title_de ?? titleDe;
      titleEn = j.title_en ?? titleEn;
      descDe = j.description_de ?? descDe;
      descEn = j.description_en ?? descEn;
    } catch {
      /* Default-Texte beibehalten */
    }
  }

  const motifs = isThematicCategory(catSlug) ? motifsForCategory(catSlug) : [];
  const bookId = await materializeBook(admin, {
    titleDe, titleEn, descDe, descEn,
    categoryId: item.category_id,
    categoryName: cat?.name_de ?? "",
    categorySlug: catSlug,
    audience,
    motifs,
    heroMotif: motifs[0] ?? titleDe,
  });

  await admin.from("book_generation_queue").update({ status: "draft_ready", generated_book_id: bookId }).eq("id", queueId);
  return { bookId };
}

/**
 * Buch-Generierung aus Admin-Brief, in Konzept-Qualität ("visuelle Reise").
 *
 * Thema + (optional) Anker-Motive + Kategorie + Zielgruppe + Seitenzahl/Preis →
 * Claude plant eine narrative Story und eine GEORDNETE Motiv-Liste (Seite 1→n) plus
 * ein Cover-heroMotif. Danach läuft dieselbe Pipeline wie bei den Konzept-Büchern
 * (Cover Stil B, Linienkunst je Schwierigkeit, Binarisierung, Wasserzeichen-Vorschauen).
 */
export async function generateBookFromBrief(input: {
  theme: string;
  bullets: string[];
  categoryId: string;
  audience?: Audience;
  pageCount?: number;
  priceCents?: number;
}): Promise<{ bookId: string }> {
  const admin = createAdminClient();
  const { data: cat } = await admin
    .from("categories")
    .select("name_de, name_en, slug, audience")
    .eq("id", input.categoryId)
    .maybeSingle();
  if (!cat) throw new Error("category_not_found");

  // Zielgruppe: explizit gewählt schlägt Kategorie-Default
  const audience: Audience = input.audience ?? ((cat.audience ?? "adult") as Audience);
  const pages = Math.min(40, Math.max(8, input.pageCount ?? (audience === "kids" ? 16 : 18)));
  const theme = input.theme.trim();
  const bullets = input.bullets.map((b) => b.trim()).filter(Boolean);

  const diffHint =
    audience === "kids"
      ? "Bold & Easy: dicke, einfache Linien, große Flächen, niedlich, für junge Kinder"
      : audience === "all"
        ? "mittlerer Detailgrad, familientauglich, freundlich"
        : "filigran, detailreich, ornamental, Zentangle-Stil, für Erwachsene/Anti-Stress";

  let titleDe = theme;
  let titleEn = theme;
  let story = "";
  let descDe = `${theme}: ein liebevoll gestaltetes Malbuch mit ${pages} Motiven. Sofort als PDF herunterladen, ausdrucken und losmalen.`;
  let descEn = `${theme}: a lovingly designed coloring book with ${pages} motifs. Download instantly as PDF, print and start coloring.`;
  let motifs: string[] = bullets.length ? [...bullets] : [theme];
  let heroMotif = motifs[0] ?? theme;

  if (anthropicConfigured()) {
    try {
      const client = getAnthropic();
      const res = await client.messages.create({
        model: MODELS.content,
        max_tokens: 1600,
        messages: [
          {
            role: "user",
            content: `Du bist Produktdesigner für den digitalen Malbuch-Shop "Coloreo". Plane EIN Malbuch als zusammenhängende "visuelle Reise": die Seiten erzählen Schritt für Schritt eine Geschichte (narrativer Bogen) statt loser Einzelmotive. Das ist das Verkaufs- und Kohäsions-Argument.

Thema: "${theme}"
Kategorie: ${cat.name_de}
Zielgruppe/Stil: ${audience} → ${diffHint}
Seitenanzahl: GENAU ${pages}
${bullets.length ? `Diese Anker-Motive MÜSSEN sinnvoll in der Reise vorkommen: ${bullets.join("; ")}` : "Keine Vorgaben – du wählst die Motive."}

Wichtig für die Motiv-Liste:
- GENAU ${pages} Einträge, in Story-Reihenfolge (Seite 1 → ${pages}), aufeinander aufbauend.
- Jeder Eintrag NUR ein kurzer, konkreter englischer Nominalausdruck (z. B. "a cozy thatched cottage with a flower garden").
- KEIN "coloring book", KEIN "line art", KEIN "black and white" – das wird automatisch ergänzt.
- Abwechslungsreich (nicht 5x dasselbe Objekt), passend zu Thema, Kategorie und Stil.

Antworte AUSSCHLIESSLICH als JSON:
{"title_de":"kurzer einprägsamer Titel","title_en":"English title","story":"1-2 Sätze narrative Klammer (Deutsch)","description_de":"2 knackige Verkaufssätze (Deutsch), nenne ${pages} Seiten und Sofort-PDF","description_en":"2 sentences (English)","hero_motif":"EIN attraktives englisches Hauptmotiv fürs Cover (kurzer Nominalausdruck, kein 'coloring book'/'line art')","motifs":["...genau ${pages} Einträge..."]}`,
          },
        ],
      });
      const txt = res.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("");
      const j = JSON.parse(txt.slice(txt.indexOf("{"), txt.lastIndexOf("}") + 1));
      titleDe = j.title_de ?? titleDe;
      titleEn = j.title_en ?? titleEn;
      story = typeof j.story === "string" ? j.story : "";
      descDe = j.description_de ?? descDe;
      descEn = j.description_en ?? descEn;
      if (typeof j.hero_motif === "string" && j.hero_motif.trim()) heroMotif = j.hero_motif.trim();
      if (Array.isArray(j.motifs) && j.motifs.length) {
        motifs = j.motifs.map((m: unknown) => String(m).trim()).filter(Boolean);
      }
    } catch {
      /* Brief-Daten beibehalten */
    }
  }

  // Auf exakte Seitenzahl bringen (Story-Reihenfolge erhalten, sonst zyklisch auffüllen)
  if (motifs.length > pages) motifs = motifs.slice(0, pages);
  const base = motifs.length;
  for (let i = 0; base > 0 && motifs.length < pages; i++) motifs.push(motifs[i % base]);

  const bookId = await materializeBook(admin, {
    titleDe, titleEn, descDe, descEn,
    categoryId: input.categoryId,
    categoryName: cat.name_de,
    categorySlug: cat.slug,
    audience,
    motifs,
    heroMotif,
    pages,
    priceCents: input.priceCents,
  });

  await admin.from("book_generation_queue").insert({
    suggested_title_de: titleDe,
    suggested_title_en: titleEn,
    category_id: input.categoryId,
    rationale: story ? `Visuelle Reise: ${story}` : `Manuell erzeugt aus Brief: ${theme}`,
    status: "draft_ready",
    generated_book_id: bookId,
    trigger_data: { source: "admin_brief", theme, bullets, audience, pages, story, heroMotif, motifs },
  });

  return { bookId };
}
