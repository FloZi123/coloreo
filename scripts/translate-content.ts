/**
 * Füllt die i18n-JSONB-Spalten (books/categories/worlds/bundles) via Claude für die Zielsprachen.
 * Übersetzt aus EN (Fallback DE). Überspringt bereits vorhandene Locales (außer --force).
 *   npx tsx scripts/translate-content.ts            # fr es it nl, alle Tabellen
 *   npx tsx scripts/translate-content.ts fr es      # bestimmte Sprachen
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { localeEnglishName, type Locale } from "../src/i18n/config";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const l of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const FORCE = process.argv.includes("--force");

type Field = "title" | "name" | "description";
interface TableCfg { table: string; fields: Field[] }
const TABLES: TableCfg[] = [
  { table: "books", fields: ["title", "description"] },
  { table: "categories", fields: ["name"] },
  { table: "worlds", fields: ["name", "description"] },
  { table: "bundles", fields: ["title", "description"] },
];

async function translateRow(src: Record<string, string>, langs: Locale[]): Promise<Record<string, Record<string, string>>> {
  const names = langs.map((l) => `${l}=${localeEnglishName[l]}`).join(", ");
  const res = await client.messages.create({
    model: "claude-sonnet-4-6", max_tokens: 1500,
    messages: [{ role: "user", content: `Translate these product fields for a printable coloring-book webshop from English into these languages: ${names}.
Keep the brand "Coloreo" unchanged; natural marketing tone; keep it concise (same length feel).
Source (English): ${JSON.stringify(src)}
Return ONLY JSON shaped as {"<langcode>": {${Object.keys(src).map((k) => `"${k}":"..."`).join(",")}}, ...} for every requested language.` }],
  });
  const txt = res.content.filter((c) => c.type === "text").map((c) => (c as { text: string }).text).join("");
  return JSON.parse(txt.slice(txt.indexOf("{"), txt.lastIndexOf("}") + 1));
}

async function main() {
  const langs = (process.argv.slice(2).filter((a) => !a.startsWith("--")).length
    ? process.argv.slice(2).filter((a) => !a.startsWith("--"))
    : ["fr", "es", "it", "nl"]) as Locale[];

  for (const cfg of TABLES) {
    const cols = cfg.fields.flatMap((f) => [`${f}_de`, `${f}_en`]).join(", ");
    const { data: rows } = await sb.from(cfg.table).select(`id, i18n, ${cols}`);
    if (!rows?.length) continue;
    console.log(`\n=== ${cfg.table} (${rows.length}) → ${langs.join(",")} ===`);
    for (const row of rows as Record<string, unknown>[]) {
      const i18n = (row.i18n as Record<string, Record<string, string>>) ?? {};
      const missing = langs.filter((l) => FORCE || !i18n[l] || cfg.fields.some((f) => !i18n[l]?.[f]));
      if (!missing.length) { continue; }
      // EN-Quelle (Fallback DE)
      const src: Record<string, string> = {};
      for (const f of cfg.fields) src[f] = String(row[`${f}_en`] ?? row[`${f}_de`] ?? "");
      try {
        const out = await translateRow(src, missing);
        for (const l of missing) if (out[l]) i18n[l] = { ...i18n[l], ...out[l] };
        await sb.from(cfg.table).update({ i18n }).eq("id", row.id as string);
        process.stdout.write(".");
      } catch (e) {
        process.stdout.write("x");
        console.warn(`\n  ⚠ ${cfg.table}/${row.id}: ${e instanceof Error ? e.message : e}`);
      }
    }
    console.log(" ✓");
  }
  console.log("FERTIG");
}
main().catch((e) => { console.error("FEHLER:", e instanceof Error ? e.stack : e); process.exit(1); });
