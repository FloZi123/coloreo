/** 6 Validierungs-Cover (verschiedene Nischen) mit der neuen Logik – lokal nach .cover-examples/validate6/. */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getImageProvider } from "../src/lib/generator/imageProvider";
import { generateCoverImage } from "../src/lib/generator/thematic";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const l of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
}
const CONCEPT = existsSync(join(root, "MALBUCH-KONZEPT.md")) ? readFileSync(join(root, "MALBUCH-KONZEPT.md"), "utf8") : "";
const hero = (slug: string) => {
  const i = CONCEPT.indexOf(`**Slug:** \`${slug}\``);
  return i < 0 ? "" : (CONCEPT.slice(i, i + 4000).match(/\*\*heroMotif \(Cover\):\*\*\s*`([^`]+)`/)?.[1] ?? "");
};
const OUT = join(root, ".cover-examples", "validate6");
mkdirSync(OUT, { recursive: true });

const SLUGS = [
  "cottagecore-tag-im-landhaus",
  "mandala-reise-durch-den-tag",
  "safari-abenteuer",
  "japan-koi-und-wasser",
  "botanik-gewaechshaus",
  "kawaii-baeckerei",
];

async function main() {
  const provider = getImageProvider();
  for (const slug of SLUGS) {
    const h = hero(slug);
    if (!h) { console.warn(`  ⚠ ${slug}: kein heroMotif`); continue; }
    const png = await generateCoverImage(provider, { heroMotif: h, slug, variant: 0 });
    writeFileSync(join(OUT, `${slug}.png`), Buffer.from(png));
    console.log("✓", slug);
  }
  console.log("FERTIG · 6 Validierungs-Cover →", OUT);
}
main().catch((e) => { console.error("FEHLER:", e instanceof Error ? e.stack : e); process.exit(1); });
