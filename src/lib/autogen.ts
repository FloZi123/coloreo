import { createAdminClient } from "@/lib/supabase/admin";
import { getAnthropic, anthropicConfigured, MODELS } from "@/lib/anthropic";
import { coverSvg, masterPdfBytes } from "@/lib/generator/art";

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

  const { data: cat } = await admin.from("categories").select("name_de, name_en, emoji, slug").eq("id", item.category_id ?? "").maybeSingle();

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

  const slug = `${slugify(titleDe)}-${Math.floor(Math.random() * 9000 + 1000)}`;
  const pages = 24;

  // Cover hochladen (öffentlicher Bucket)
  const svg = coverSvg(slug, titleDe, cat?.name_de ?? "", cat?.emoji ?? "🎨", pages);
  await admin.storage.from("covers").upload(`${slug}.svg`, new TextEncoder().encode(svg), {
    contentType: "image/svg+xml",
    upsert: true,
  });
  const coverUrl = `${SUPA_URL}/storage/v1/object/public/covers/${slug}.svg`;

  // Master-PDF hochladen (privater Bucket)
  const pdf = await masterPdfBytes(slug, titleDe, pages);
  await admin.storage.from("books").upload(`${slug}.pdf`, pdf, { contentType: "application/pdf", upsert: true });

  // Buch als Entwurf anlegen
  const { data: book, error } = await admin
    .from("books")
    .insert({
      slug,
      category_id: item.category_id,
      title_de: titleDe,
      title_en: titleEn,
      description_de: descDe,
      description_en: descEn,
      price_cents: 599,
      page_count: pages,
      cover_url: coverUrl,
      pdf_path: `${slug}.pdf`,
      status: "draft",
      source: "ai_generated",
      tags: [cat?.slug ?? "ki", "malbuch", "pdf"],
    })
    .select("id")
    .single();
  if (error || !book) throw error ?? new Error("book_insert_failed");

  await admin.from("book_generation_queue").update({ status: "draft_ready", generated_book_id: book.id }).eq("id", queueId);
  return { bookId: book.id };
}
