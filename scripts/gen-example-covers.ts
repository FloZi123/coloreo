/** Erzeugt Beispiel-Cover (NICHT im Shop) zum Sichten/Validieren → nach .cover-examples/.
 *  Freigabe-Gate: nur Beispiele (Hero-Buch + max. 1 weiteres). Fester Seed je slug#variant.
 *  Variante via CLI: npx tsx scripts/gen-example-covers.ts <slug>=<variant> … (Default siehe EX). */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getImageProvider } from "../src/lib/generator/imageProvider";
import { generateCoverImage } from "../src/lib/generator/thematic";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const l of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
}
const OUT = join(root, ".cover-examples");
mkdirSync(OUT, { recursive: true });

// Hero-Buch + max. 1 weiteres. Motive OHNE Text-/Rahmen-Trigger (keine „card"/„title"/„border").
const EX: Record<string, { hero: string }> = {
  "cottagecore-tag-im-landhaus": { hero: "a cozy thatched cottage with a flower garden climbing roses and a smoking chimney, trees and clouds behind" },
  "tarot-der-mond": { hero: "a large ornate crescent moon with a calm serene face in a starry night sky above two distant towers, a howling wolf on a hill, vines and flowers" },
};

// Variant-Overrides: <slug>=<variant>
const overrides = new Map<string, number>();
for (const a of process.argv.slice(2)) {
  const m = a.match(/^(.+)=(\d+)$/);
  if (m) overrides.set(m[1], Number(m[2]));
}

async function main() {
  const provider = getImageProvider();
  for (const [slug, e] of Object.entries(EX)) {
    const variant = overrides.get(slug) ?? 0;
    const png = await generateCoverImage(provider, { heroMotif: e.hero, slug, variant });
    const fp = join(OUT, `${slug}-v${variant}.png`);
    writeFileSync(fp, Buffer.from(png));
    console.log("✓", `${slug} v${variant}`, "→", fp);
  }
  console.log("FERTIG · Beispiele (kein Katalog-Lauf)");
}
main().catch((e) => { console.error("FEHLER:", e instanceof Error ? e.stack : e); process.exit(1); });
