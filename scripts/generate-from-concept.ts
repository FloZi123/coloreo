/**
 * Generiert Bücher EXAKT nach MALBUCH-KONZEPT.md.
 *   npx tsx scripts/generate-from-concept.ts            # Default-Auswahl (5 Bücher)
 *   npx tsx scripts/generate-from-concept.ts <slug>...  # bestimmte Slugs
 * Voraussetzung: REPLICATE_API_TOKEN + SUPABASE_SERVICE_ROLE_KEY in .env.local.
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

type Audience = "adult" | "kids" | "all";
interface Book {
  catCode: string; catSlug: string; catName: string; catNameEn: string;
  bookNum: number; slug: string; audience: Audience; pages: number; priceCents: number;
  titleDe: string; titleEn: string; descDe: string; heroMotif: string; motifs: string[];
}

const CAT_EMOJI: Record<string, string> = {
  "mandala-meditation": "🌀", "botanischer-garten": "🌿", "cottagecore": "🏡",
  "dark-academia": "📚", "niedliche-tiere": "🐻", "unterwasserwelt": "🌊",
  "dino-welt": "🦕",
};

function parseConcept(md: string): Book[] {
  const lines = md.split("\n");
  const books: Book[] = [];
  let cat = { code: "", slug: "", name: "", nameEn: "" };
  let cur: Book | null = null;
  let collectingMotifs = false;
  let collectingDesc = false;

  const push = () => { if (cur) books.push(cur); cur = null; };

  for (const line of lines) {
    const catM = line.match(/^##\s+([A-Z]\d{1,2})\s+·\s+(.+?)\s+\(`([^`]+)`,\s*(\w+)\)/);
    if (catM) {
      push();
      const nm = catM[2].split("|")[0].trim();
      cat = { code: catM[1], slug: catM[3], name: nm, nameEn: nm };
      continue;
    }
    const bookM = line.match(/^###\s+Buch\s+(\d+)\s+—\s+"([^"]+)"\s*\/\s*"([^"]+)"/);
    if (bookM) {
      push();
      collectingMotifs = false; collectingDesc = false;
      cur = {
        catCode: cat.code, catSlug: cat.slug, catName: cat.name, catNameEn: cat.nameEn,
        bookNum: Number(bookM[1]), slug: "", audience: "adult", pages: 18, priceCents: 599,
        titleDe: bookM[2], titleEn: bookM[3], descDe: "", heroMotif: "", motifs: [],
      };
      continue;
    }
    if (!cur) continue;

    const slugM = line.match(/\*\*Slug:\*\*\s*`([^`]+)`.*?\*\*Audience:\*\*\s*(\w+).*?\*\*Seiten:\*\*\s*(\d+).*?\*\*Preis:\*\*\s*([\d.,]+)/);
    if (slugM) {
      cur.slug = slugM[1];
      cur.audience = slugM[2] as Audience;
      cur.pages = Number(slugM[3]);
      cur.priceCents = Math.round(parseFloat(slugM[4].replace(",", ".")) * 100);
      continue;
    }
    const heroM = line.match(/\*\*heroMotif \(Cover\):\*\*\s*`([^`]+)`/);
    if (heroM) { cur.heroMotif = heroM[1]; collectingDesc = false; continue; }

    const descM = line.match(/\*\*Beschreibung \(DE\):\*\*\s*(.*)/);
    if (descM) { cur.descDe = descM[1].trim(); collectingDesc = true; continue; }

    if (/\*\*Motiv-Liste/.test(line)) { collectingMotifs = true; collectingDesc = false; continue; }
    if (collectingMotifs) {
      const m = line.match(/^\s*\d+\.\s+(.+?)\s*$/);
      if (m) { cur.motifs.push(m[1]); continue; }
      if (/^\s*-\s+\*\*/.test(line) || line.trim() === "") { if (/^\s*-\s+\*\*/.test(line)) collectingMotifs = false; }
    }
    if (collectingDesc) {
      if (/^\s*-\s+\*\*/.test(line) || /^#/.test(line)) collectingDesc = false;
      else if (line.trim()) cur.descDe += " " + line.trim();
    }
  }
  push();
  return books;
}

async function main() {
  const env: Record<string, string> = {};
  for (const l of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
    const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
  }
  for (const k of ["REPLICATE_API_TOKEN", "REPLICATE_MODEL", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "ANTHROPIC_API_KEY"]) {
    if (env[k] && !process.env[k]) process.env[k] = env[k];
  }
  const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const sb = createClient(SUPA, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const anthropic = process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes("PLACEHOLDER")
    ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;

  // DE + EN Verkaufsbeschreibung via Claude, gegründet auf die Konzept-Fakten.
  async function genDescriptions(b: Book): Promise<{ de: string; en: string }> {
    if (!anthropic) return { de: b.descDe, en: b.titleEn };
    const aud = b.audience === "kids" ? "Kinder" : b.audience === "all" ? "Familie/alle" : "Erwachsene";
    try {
      const res = await anthropic.messages.create({
        model: "claude-sonnet-4-6", max_tokens: 600,
        messages: [{ role: "user", content: `Produktbeschreibungen für ein digitales Malbuch (PDF-Download) im Shop "Coloreo".

Titel DE: "${b.titleDe}" · Titel EN: "${b.titleEn}"
Kategorie: ${b.catName} · Zielgruppe: ${aud} · Seiten: ${b.pages}
Inhalt/Fakten (Grundlage, nicht wörtlich): "${b.descDe}"
Einige Motive: ${b.motifs.slice(0, 6).join(", ")}

Schreibe je eine Beschreibung DE und EN: jeweils GENAU 2 Sätze, warm und verkaufsstark, natürliche Sprache (EN keine wörtliche Übersetzung), nenne die ${b.pages} Seiten und den Sofort-PDF-Download, Tonfall passend zur Zielgruppe.
Antworte NUR als JSON: {"de":"...","en":"..."}` }],
      });
      const txt = res.content.filter((c) => c.type === "text").map((c) => (c as { text: string }).text).join("");
      const j = JSON.parse(txt.slice(txt.indexOf("{"), txt.lastIndexOf("}") + 1));
      return { de: (j.de || b.descDe).trim(), en: (j.en || b.titleEn).trim() };
    } catch (e) {
      console.warn("  ⚠ Beschreibung (Fallback):", e instanceof Error ? e.message : e);
      return { de: b.descDe, en: b.titleEn };
    }
  }

  // Motive zu vollen, gefüllten Szenen ausformulieren (gegen leere Einzelmotiv-Seiten).
  async function sceneify(b: Book): Promise<string[]> {
    if (!anthropic || !b.motifs.length) return b.motifs;
    try {
      const res = await anthropic.messages.create({
        model: "claude-sonnet-4-6", max_tokens: 1400,
        messages: [{ role: "user", content: `Coloring-book page motifs for the theme "${b.catName}". For EACH motif, rewrite it as ONE short vivid English image-prompt phrase describing a FULL scene that fills the whole page: keep the main subject large and prominent, and add fitting background and surrounding elements (its habitat, plants, related objects, sky/water/ground) so there is no empty space. Do NOT add any border or frame. Keep each phrase under 25 words.

Motifs (${b.motifs.length}):
${b.motifs.map((m, i) => `${i + 1}. ${m}`).join("\n")}

Reply ONLY as a JSON array of exactly ${b.motifs.length} strings, in the same order.` }],
      });
      const txt = res.content.filter((c) => c.type === "text").map((c) => (c as { text: string }).text).join("");
      const arr = JSON.parse(txt.slice(txt.indexOf("["), txt.lastIndexOf("]") + 1)) as unknown[];
      if (Array.isArray(arr) && arr.length === b.motifs.length) return arr.map((s) => String(s));
      return b.motifs;
    } catch (e) {
      console.warn("  ⚠ Szenen (Fallback Originalmotive):", e instanceof Error ? e.message : e);
      return b.motifs;
    }
  }

  const books = parseConcept(readFileSync(join(root, "MALBUCH-KONZEPT.md"), "utf8"));
  const argSlugs = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const COVERS_ONLY = process.argv.includes("--covers-only"); // nur Cover neu (text-frei), Seiten/DB unangetastet
  const DEFAULT = ["mandala-reise-durch-den-tag", "botanik-gewaechshaus", "cottagecore-tag-im-landhaus", "dark-academia-alte-bibliothek"];
  // + erstes Kinderbuch (K1, Buch 1)
  const k1 = books.find((b) => b.catCode === "K1" && b.bookNum === 1);
  const wantSlugs = argSlugs.length ? argSlugs : [...DEFAULT, ...(k1 ? [k1.slug] : [])];
  const targets = wantSlugs.map((s) => books.find((b) => b.slug === s)).filter(Boolean) as Book[];

  console.log(`Geparst: ${books.length} Bücher. Generiere ${targets.length}:`);
  for (const b of targets) {
    console.log(`  - ${b.slug} (${b.catName}, ${b.audience}, ${b.pages} S., ${b.motifs.length} Motive) "${b.titleDe}"`);
    if (process.env.DRY) { console.log(`      Motiv1: ${b.motifs[0]} | hero: ${b.heroMotif} | desc: ${b.descDe.slice(0, 60)}…`); }
  }
  if (process.env.DRY) { console.log("DRY-RUN — keine Generierung."); return; }

  const provider = getImageProvider();
  const results: { slug: string; cover: string }[] = [];

  for (const b of targets) {
    console.log(`\n▶ ${b.slug} …`);

    if (COVERS_ONLY) {
      // Nur das (jetzt text-freie) Cover neu erzeugen – Seiten/Beschreibungen/DB bleiben unangetastet.
      const cover = await generateCoverImage(provider, { title: b.titleDe, categoryName: b.catName, heroMotif: b.heroMotif, pages: b.pages });
      await sb.storage.from("covers").upload(`${b.slug}.png`, cover, { contentType: "image/png", upsert: true });
      console.log("  ✓ Cover (nur Cover, text-frei)");
      results.push({ slug: b.slug, cover: `${SUPA}/storage/v1/object/public/covers/${b.slug}.png` });
      continue;
    }

    // Kategorie sicherstellen
    const { data: cat } = await sb.from("categories")
      .upsert({ slug: b.catSlug, name_de: b.catName, name_en: b.catNameEn, emoji: CAT_EMOJI[b.catSlug] ?? "🎨", audience: b.audience, is_active: true }, { onConflict: "slug" })
      .select("id").single();

    // Beschreibungen (DE+EN) via Claude
    const desc = await genDescriptions(b);
    console.log("  ✓ Beschreibungen");

    // Cover
    const cover = await generateCoverImage(provider, { title: b.titleDe, categoryName: b.catName, heroMotif: b.heroMotif, pages: b.pages });
    await sb.storage.from("covers").upload(`${b.slug}.png`, cover, { contentType: "image/png", upsert: true });
    const ver = Date.now(); // Cache-Busting → CDN/Browser laden die NEUEN Cover/Vorschauen
    const coverUrl = `${SUPA}/storage/v1/object/public/covers/${b.slug}.png?v=${ver}`;
    console.log("  ✓ Cover");

    // Motive zu vollen Szenen ausformulieren (verlässlich gefüllte Seiten)
    const sceneMotifs = await sceneify(b);
    console.log(`  ✓ Szenen (${sceneMotifs.length})`);

    // Master-PDF
    const pdf = await generateMasterFromMotifs(provider, { slug: b.slug, titleDe: b.titleDe, audience: b.audience }, sceneMotifs, b.pages, { concurrency: 4 });
    await sb.storage.from("books").upload(`${b.slug}.pdf`, pdf, { contentType: "application/pdf", upsert: true });
    console.log(`  ✓ ${b.pages} Seiten`);

    // Vorschauen
    const previewUrls: string[] = [];
    try {
      const pv = await makeWatermarkedPreviews(pdf, 5);
      for (let i = 0; i < pv.length; i++) {
        const path = `${b.slug}/p${i + 1}.webp`;
        await sb.storage.from("previews").upload(path, pv[i], { contentType: "image/webp", upsert: true });
        previewUrls.push(`${SUPA}/storage/v1/object/public/previews/${path}?v=${ver}`);
      }
    } catch (e) { console.warn("  ⚠ Vorschau:", e instanceof Error ? e.message : e); }

    await sb.from("books").upsert({
      slug: b.slug, category_id: cat?.id ?? null,
      title_de: b.titleDe, title_en: b.titleEn,
      description_de: desc.de, description_en: desc.en,
      i18n: { de: { title: b.titleDe, description: desc.de }, en: { title: b.titleEn, description: desc.en } },
      audience: b.audience, price_cents: b.priceCents, page_count: b.pages,
      cover_url: coverUrl, pdf_path: `${b.slug}.pdf`, preview_urls: previewUrls,
      status: "draft", source: "ai_generated", tags: [b.catSlug, "konzept", "pdf"],
    }, { onConflict: "slug" });
    console.log("  ✓ in DB (draft)");
    results.push({ slug: b.slug, cover: coverUrl });
  }

  console.log("\n=== FERTIG ===");
  for (const r of results) console.log(r.slug, "→", r.cover);
}

main().catch((e) => { console.error("FEHLER:", e instanceof Error ? e.stack : e); process.exit(1); });
