/** Erzeugt Beispiel-Cover (NICHT im Shop) für neue Themen-Ideen → nur lokale PNGs zum Sichten. */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getImageProvider } from "../src/lib/generator/imageProvider";
import { generateCoverImage } from "../src/lib/generator/thematic";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const l of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
}
const OUT = process.argv[2] || root; // Zielordner als Argument (z. B. scratchpad)

// FREIGABE-GATE: max. 4 Beispiele – Hero-Cottagecore in 2 Varianten (A/B) + 2 weitere Themen.
const COTTAGE = "a cozy thatched cottage with a flower garden climbing roses and a smoking chimney, trees and clouds behind";
const EX = [
  { slug: "cottagecore-tag-im-landhaus", variant: 0, hero: COTTAGE },
  { slug: "cottagecore-tag-im-landhaus", variant: 1, hero: COTTAGE },
  { slug: "tarot-der-mond", variant: 0, hero: "an ornate tarot card The Moon, a large crescent moon with a serene face, two tall towers, a howling wolf, a crayfish in the water, decorative celestial star and vine border, symmetrical mystical illustration" },
  { slug: "muertos-calavera", variant: 0, hero: "an ornate decorated sugar skull calavera with marigold flowers roses candles and swirling symmetrical patterns, Day of the Dead folk art" },
];

async function main() {
  const provider = getImageProvider();
  for (const e of EX) {
    const png = await generateCoverImage(provider, { heroMotif: e.hero, slug: e.slug, variant: e.variant });
    const fp = join(OUT, `example-${e.slug}-v${e.variant}.png`);
    writeFileSync(fp, Buffer.from(png));
    console.log("✓", `${e.slug} v${e.variant}`, "→", fp);
  }
  console.log("FERTIG · 4 Beispiele (kein Katalog-Lauf)");
}
main().catch((e) => { console.error("FEHLER:", e instanceof Error ? e.stack : e); process.exit(1); });
