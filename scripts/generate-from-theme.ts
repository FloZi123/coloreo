/**
 * End-to-End-Test der Admin-Brief-Generierung (identischer Claude-Prompt + Pipeline wie
 * generateBookFromBrief), ohne Server/Login. Erzeugt EIN Buch als Entwurf.
 *   npx tsx scripts/generate-from-theme.ts "Thema" <adult|kids|all> <pages> <preisEuro> <katSlug> "Kat-Name"
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { getImageProvider } from "../src/lib/generator/imageProvider";
import { generateMasterFromMotifs, generateCoverImage } from "../src/lib/generator/thematic";
import { makeWatermarkedPreviews } from "../src/lib/generator/previews";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env: Record<string, string> = {};
for (const l of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
}
for (const k of Object.keys(env)) if (!process.env[k]) process.env[k] = env[k];

const theme = process.argv[2] || "Ein Tag am Meer";
const audience = (process.argv[3] || "adult") as "adult" | "kids" | "all";
const pages = Math.min(40, Math.max(8, Number(process.argv[4] || 16)));
const priceCents = Math.round(parseFloat((process.argv[5] || "6.99").replace(",", ".")) * 100);
const catSlug = process.argv[6] || "unterwasserwelt";
const catName = process.argv[7] || "Unterwasserwelt";

const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const sb = createClient(SUPA, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

function slugify(s: string) {
  return s.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

async function main() {
  const diffHint = audience === "kids" ? "Bold & Easy: dicke, einfache Linien, große Flächen, niedlich, für junge Kinder"
    : audience === "all" ? "mittlerer Detailgrad, familientauglich, freundlich"
    : "filigran, detailreich, ornamental, Zentangle-Stil, für Erwachsene/Anti-Stress";

  console.log(`Plane "${theme}" (${audience}, ${pages} S.) via Claude …`);
  const res = await client.messages.create({
    model: "claude-sonnet-4-6", max_tokens: 1600,
    messages: [{ role: "user", content: `Du bist Produktdesigner für den digitalen Malbuch-Shop "Coloreo". Plane EIN Malbuch als zusammenhängende "visuelle Reise": die Seiten erzählen Schritt für Schritt eine Geschichte (narrativer Bogen) statt loser Einzelmotive.

Thema: "${theme}"
Kategorie: ${catName}
Zielgruppe/Stil: ${audience} → ${diffHint}
Seitenanzahl: GENAU ${pages}
Keine Vorgaben – du wählst die Motive.

Wichtig für die Motiv-Liste:
- GENAU ${pages} Einträge, in Story-Reihenfolge (Seite 1 → ${pages}), aufeinander aufbauend.
- Jeder Eintrag NUR ein kurzer, konkreter englischer Nominalausdruck.
- KEIN "coloring book", KEIN "line art", KEIN "black and white".
- Abwechslungsreich, passend zu Thema, Kategorie und Stil.

Antworte AUSSCHLIESSLICH als JSON:
{"title_de":"...","title_en":"...","story":"1-2 Sätze (Deutsch)","description_de":"2 Sätze, nenne ${pages} Seiten und Sofort-PDF","description_en":"2 sentences","hero_motif":"EIN englisches Hauptmotiv fürs Cover","motifs":["...genau ${pages}..."]}` }],
  });
  const txt = res.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("");
  const j = JSON.parse(txt.slice(txt.indexOf("{"), txt.lastIndexOf("}") + 1));
  let motifs: string[] = (j.motifs || []).map((m: unknown) => String(m).trim()).filter(Boolean);
  if (motifs.length > pages) motifs = motifs.slice(0, pages);
  const base = motifs.length;
  for (let i = 0; base > 0 && motifs.length < pages; i++) motifs.push(motifs[i % base]);

  console.log("TITEL:", j.title_de, "| STORY:", j.story);
  console.log("HERO :", j.hero_motif);
  motifs.forEach((m, i) => console.log(`  ${i + 1}. ${m}`));

  const slug = `${slugify(j.title_de)}-${Math.floor(Math.random() * 9000 + 1000)}`;
  const provider = getImageProvider();

  const { data: cat } = await sb.from("categories")
    .upsert({ slug: catSlug, name_de: catName, name_en: catName, emoji: "🌊", audience, is_active: true }, { onConflict: "slug" })
    .select("id").single();

  const cover = await generateCoverImage(provider, { title: j.title_de, categoryName: catName, heroMotif: j.hero_motif, pages });
  await sb.storage.from("covers").upload(`${slug}.png`, cover, { contentType: "image/png", upsert: true });
  console.log("✓ Cover");

  const pdf = await generateMasterFromMotifs(provider, { slug, titleDe: j.title_de, audience }, motifs, pages, { concurrency: 4 });
  await sb.storage.from("books").upload(`${slug}.pdf`, pdf, { contentType: "application/pdf", upsert: true });
  console.log(`✓ ${pages} Seiten`);

  const previewUrls: string[] = [];
  try {
    const pv = await makeWatermarkedPreviews(pdf, 5);
    for (let i = 0; i < pv.length; i++) {
      const p = `${slug}/p${i + 1}.webp`;
      await sb.storage.from("previews").upload(p, pv[i], { contentType: "image/webp", upsert: true });
      previewUrls.push(`${SUPA}/storage/v1/object/public/previews/${p}`);
    }
  } catch (e) { console.warn("⚠ Vorschau:", e instanceof Error ? e.message : e); }

  await sb.from("books").upsert({
    slug, category_id: cat?.id ?? null,
    title_de: j.title_de, title_en: j.title_en,
    description_de: j.description_de, description_en: j.description_en,
    audience, price_cents: priceCents, page_count: pages,
    cover_url: `${SUPA}/storage/v1/object/public/covers/${slug}.png`,
    pdf_path: `${slug}.pdf`, preview_urls: previewUrls,
    status: "draft", source: "ai_generated", tags: [catSlug, "brief-test", "pdf"],
  }, { onConflict: "slug" });

  console.log(`\n=== FERTIG === slug=${slug}`);
  console.log("Cover:", `${SUPA}/storage/v1/object/public/covers/${slug}.png`);
  console.log("Page1:", previewUrls[0] ?? "(keine Vorschau)");
}
main().catch((e) => { console.error("FEHLER:", e instanceof Error ? e.stack : e); process.exit(1); });
