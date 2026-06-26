/**
 * Batch: erzeugt thematische Master-Mal-PDFs (KI-Linienkunst via Replicate) für alle
 * repräsentativen Kategorien und überschreibt die prozeduralen Platzhalter in public/masters.
 *
 *   npx tsx scripts/generate-thematic.ts            # alle thematischen Bücher
 *   npx tsx scripts/generate-thematic.ts <slug>...  # nur bestimmte Buch-Slugs
 *
 * Voraussetzung: REPLICATE_API_TOKEN in .env.local.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// .env.local laden, bevor Module process.env lesen
for (const line of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
}

const { createClient } = await import("@supabase/supabase-js");
const { imageProviderConfigured, getImageProvider } = await import("../src/lib/generator/imageProvider.ts");
const { isThematicCategory, generateThematicMasterPdf } = await import("../src/lib/generator/thematic.ts");

if (!imageProviderConfigured()) {
  console.error("✗ REPLICATE_API_TOKEN fehlt in .env.local – Abbruch.");
  process.exit(1);
}

const PAGES = Number(process.env.THEMATIC_PAGES ?? 24);
const onlySlugs = process.argv.slice(2);

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

const { data: cats } = await sb.from("categories").select("id, slug");
const catById = new Map((cats ?? []).map((c) => [c.id, c.slug]));
const { data: books } = await sb.from("books").select("id, slug, title_de, category_id");

const outDir = join(root, "public", "masters");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const provider = getImageProvider();
const targets = (books ?? []).filter((b) => {
  const slug = catById.get(b.category_id ?? "");
  if (!isThematicCategory(slug)) return false;
  if (onlySlugs.length && !onlySlugs.includes(b.slug)) return false;
  return true;
});

console.log(`Generiere ${targets.length} thematische Bücher × ${PAGES} Seiten …`);
let done = 0;
for (const b of targets) {
  const slug = catById.get(b.category_id ?? "")!;
  try {
    const pdf = await generateThematicMasterPdf(provider, { slug: b.slug, titleDe: b.title_de, categorySlug: slug }, PAGES);
    writeFileSync(join(outDir, `${b.slug}.pdf`), Buffer.from(pdf));
    done++;
    console.log(`  ✓ ${b.slug} (${done}/${targets.length})`);
  } catch (e) {
    console.error(`  ✗ ${b.slug}:`, e instanceof Error ? e.message : e);
  }
}
console.log(`Fertig: ${done}/${targets.length} thematische Master-PDFs erzeugt.`);
