/** Erzeugt Cover neu (neue Stil-B-Logik mit Farb-Garantie) und überschreibt sie in Storage. */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { getImageProvider } from "../src/lib/generator/imageProvider";
import { generateCoverImage } from "../src/lib/generator/thematic";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env: Record<string, string> = {};
for (const l of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
}
const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const sb = createClient(SUPA, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

// slug → heroMotif (aus Konzept / Brief-Test)
const TARGETS: Record<string, string> = {
  "mandala-reise-durch-den-tag": "an intricate sunrise mandala with radiating sun rays and lotus petals",
  "botanik-gewaechshaus": "a lush victorian greenhouse interior with hanging plants and a glass dome",
  "cottagecore-tag-im-landhaus": "a cozy thatched cottage with a flower garden and smoking chimney",
  "dark-academia-alte-bibliothek": "an old gothic library with tall bookshelves a spiral staircase and a candle",
  "tiere-tag-auf-der-wiese": "a cute happy fox and rabbit sitting in a meadow",
  "ein-tag-am-meer-5798": "ornate mandala jellyfish floating in sunlit ocean waters",
};

async function main() {
  const only = process.argv.slice(2);
  const slugs = only.length ? only : Object.keys(TARGETS);
  const provider = getImageProvider();
  for (const slug of slugs) {
    const hero = TARGETS[slug];
    if (!hero) { console.warn("kein heroMotif für", slug); continue; }
    const { data: b } = await sb.from("books").select("title_de, page_count, category_id").eq("slug", slug).maybeSingle();
    let catName = "";
    if (b?.category_id) {
      const { data: c } = await sb.from("categories").select("name_de").eq("id", b.category_id).maybeSingle();
      catName = c?.name_de ?? "";
    }
    const png = await generateCoverImage(provider, { title: b?.title_de ?? slug, categoryName: catName, heroMotif: hero, pages: b?.page_count ?? 18 });
    await sb.storage.from("covers").upload(`${slug}.png`, png, { contentType: "image/png", upsert: true });
    console.log("✓", slug);
  }
  console.log("FERTIG");
}
main().catch((e) => { console.error("FEHLER:", e instanceof Error ? e.stack : e); process.exit(1); });
