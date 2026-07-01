/**
 * Setzt das per Best-of-N + menschlicher Auswahl gewählte Hero-Cover produktiv (NUR dieses eine Buch):
 * lädt den gewählten Kandidaten in den covers-Bucket (upsert <slug>.png) und bumpt cover_url ?v.
 *   npx tsx scripts/finalize-hero-cover.ts <hero-slug>
 * KEIN Katalog-Lauf. Voraussetzung: .cover-examples/<slug>/selection.json + candidates.json + Kandidaten-PNGs.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const l of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
}
const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const sb = createClient(SUPA, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

async function main() {
  const slug = process.argv[2];
  if (!slug) { console.error("Nutzung: finalize-hero-cover.ts <hero-slug>"); process.exit(1); }
  const dir = join(root, ".cover-examples", slug);
  const sel = JSON.parse(readFileSync(join(dir, "selection.json"), "utf8")) as { chosenSeed: number };
  const seed = sel.chosenSeed;
  const cand = readFileSync(join(dir, "candidates.json"), "utf8");
  if (!JSON.parse(cand).candidates.some((c: { seed: number }) => c.seed === seed)) { console.error(`Seed ${seed} ist kein Kandidat.`); process.exit(1); }
  // Gewählten Kandidaten (exakt reproduzierbar per Seed) finden.
  const file = `cand-${JSON.parse(cand).candidates.findIndex((c: { seed: number }) => c.seed === seed) + 1}-seed${seed}.png`;
  const src = existsSync(join(dir, file)) ? join(dir, file) : join(dir, `cand-1-seed${seed}.png`);
  const png = readFileSync(src);
  writeFileSync(join(dir, `FINAL-seed${seed}.png`), png); // Protokoll-Kopie

  const { data: book } = await sb.from("books").select("slug, cover_url, status").eq("slug", slug).maybeSingle();
  if (!book) { console.error(`Buch ${slug} nicht gefunden.`); process.exit(1); }
  const up = await sb.storage.from("covers").upload(`${slug}.png`, png, { contentType: "image/png", upsert: true });
  if (up.error) { console.error("Upload:", up.error.message); process.exit(1); }
  const base = (book.cover_url ?? `${SUPA}/storage/v1/object/public/covers/${slug}.png`).split("?")[0];
  const v = Date.now();
  await sb.from("books").update({ cover_url: `${base}?v=${v}` }).eq("slug", slug);
  console.log(`✓ Hero-Cover live: ${slug} (seed=${seed}) → covers/${slug}.png?v=${v} (nur dieses Buch, Status ${book.status})`);
}
main().catch((e) => { console.error("FEHLER:", e instanceof Error ? e.stack : e); process.exit(1); });
