/**
 * Cover neu erzeugen mit der RUHIGEN, realistischen Kolorierung (img2img + multiply, wie Social-Pins)
 * und in Storage überschreiben + cover_url ?v cache-busten.
 *   npx tsx scripts/regen-covers.ts             # alle veröffentlichten Bücher
 *   npx tsx scripts/regen-covers.ts <slug> …    # einzelne
 * heroMotif kommt aus MALBUCH-KONZEPT.md. Voraussetzung: REPLICATE_API_TOKEN + Supabase-Env in .env.local.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { getImageProvider } from "../src/lib/generator/imageProvider";
import { generateCoverImage } from "../src/lib/generator/thematic";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const l of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
}
const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const sb = createClient(SUPA, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

const CONCEPT = existsSync(join(root, "MALBUCH-KONZEPT.md")) ? readFileSync(join(root, "MALBUCH-KONZEPT.md"), "utf8") : "";
function conceptHero(slug: string): string {
  const idx = CONCEPT.indexOf(`**Slug:** \`${slug}\``);
  if (idx < 0) return "";
  return CONCEPT.slice(idx, idx + 4000).match(/\*\*heroMotif \(Cover\):\*\*\s*`([^`]+)`/)?.[1] ?? "";
}

async function main() {
  const ALL = process.argv.includes("--all"); // FREIGABE-GATE: voller Katalog NUR mit --all
  const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  let slugs = only;
  if (!slugs.length) {
    if (!ALL) {
      console.error("Freigabe-Gate: Kein Slug angegeben. Voller Katalog-Lauf NUR mit --all (ausdrückliche Freigabe).");
      console.error("Beispiele: npx tsx scripts/regen-covers.ts <slug> [<slug> …]");
      process.exit(1);
    }
    const { data } = await sb.from("books").select("slug").eq("status", "published").not("cover_url", "is", null);
    slugs = (data ?? []).map((b) => b.slug);
  }
  const provider = getImageProvider();
  console.log(`Cover-Neurender (ruhige img2img-Kolorierung) für ${slugs.length} Buch/Bücher …`);
  let ok = 0; const skipped: string[] = [];
  for (const slug of slugs) {
    const hero = conceptHero(slug);
    if (!hero) { console.warn(`  ⚠ ${slug}: kein heroMotif im Konzept – übersprungen`); skipped.push(slug); continue; }
    const { data: b } = await sb.from("books").select("title_de, page_count, category_id, cover_url").eq("slug", slug).maybeSingle();
    let catName = "";
    if (b?.category_id) {
      const { data: c } = await sb.from("categories").select("name_de").eq("id", b.category_id).maybeSingle();
      catName = c?.name_de ?? "";
    }
    try {
      const png = await generateCoverImage(provider, { heroMotif: hero, slug, variant: 0, title: b?.title_de ?? slug, categoryName: catName, pages: b?.page_count ?? 18 });
      const up = await sb.storage.from("covers").upload(`${slug}.png`, png, { contentType: "image/png", upsert: true });
      if (up.error) throw up.error;
      const base = (b?.cover_url ?? `${SUPA}/storage/v1/object/public/covers/${slug}.png`).split("?")[0];
      await sb.from("books").update({ cover_url: `${base}?v=${Date.now()}` }).eq("slug", slug);
      ok++; console.log(`  ✓ ${slug}`);
    } catch (e) {
      skipped.push(slug); console.warn(`  ✖ ${slug}: ${e instanceof Error ? e.message : e}`);
    }
  }
  console.log(`FERTIG · ${ok}/${slugs.length} neu gerendert${skipped.length ? ` · offen: ${skipped.join(", ")}` : ""}`);
}
main().catch((e) => { console.error("FEHLER:", e instanceof Error ? e.stack : e); process.exit(1); });
