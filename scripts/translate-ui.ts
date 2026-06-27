/**
 * Übersetzt das UI-Dictionary (EN-Basis) via Claude in die Zielsprachen → src/i18n/messages/<locale>.json.
 *   npx tsx scripts/translate-ui.ts            # fr es it nl
 *   npx tsx scripts/translate-ui.ts fr es      # bestimmte
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import { getDictionary } from "../src/i18n/dictionaries";
import { localeEnglishName, type Locale } from "../src/i18n/config";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const l of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
}
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

async function main() {
  const en = getDictionary("en");
  const targets = (process.argv.slice(2).length ? process.argv.slice(2) : ["fr", "es", "it", "nl"]) as Locale[];
  for (const loc of targets) {
    const name = localeEnglishName[loc];
    console.log(`▶ UI → ${name} (${loc}) …`);
    const res = await client.messages.create({
      model: "claude-sonnet-4-6", max_tokens: 8000,
      messages: [{ role: "user", content: `Translate the VALUES of this JSON UI dictionary for a coloring-book webshop from English to ${name}.
Rules: keep ALL keys exactly; keep placeholders like {price}, {count}, %s and any HTML tags unchanged; keep the brand name "Coloreo"/"coloreo" unchanged; warm, friendly e-commerce tone. Return ONLY the JSON, nothing else.

${JSON.stringify(en)}` }],
    });
    const txt = res.content.filter((c) => c.type === "text").map((c) => (c as { text: string }).text).join("");
    const j = JSON.parse(txt.slice(txt.indexOf("{"), txt.lastIndexOf("}") + 1));
    writeFileSync(join(root, "src/i18n/messages", `${loc}.json`), JSON.stringify(j, null, 2) + "\n");
    console.log(`  ✓ src/i18n/messages/${loc}.json`);
  }
  console.log("FERTIG");
}
main().catch((e) => { console.error("FEHLER:", e instanceof Error ? e.stack : e); process.exit(1); });
