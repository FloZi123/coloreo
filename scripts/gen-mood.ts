/**
 * Generiert die 8 fotorealistischen Mood-Bilder aus MOODBILDER-PROMPTS.md via Replicate flux-dev.
 * Speichert nach public/mood/<name>.webp.
 *   npx tsx scripts/gen-mood.ts            # alle 8
 *   npx tsx scripts/gen-mood.ts hero macro # nur bestimmte (nach Name)
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Replicate from "replicate";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const l of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
}

// Dateinamen in Reihenfolge Bild 1→8
const NAMES = ["hero", "flatlay", "cozy-evening", "family", "macro", "usp-print", "cafe", "gift"];

function parsePrompts(): { name: string; ratio: string; prompt: string }[] {
  const lines = readFileSync(join(root, "MOODBILDER-PROMPTS.md"), "utf8").split("\n");
  const out: { ratio: string; prompt: string }[] = [];
  let idx = -1, promptMode = false;
  for (const line of lines) {
    if (/^###\s+Bild\s+\d+/.test(line)) { idx++; out[idx] = { ratio: "1:1", prompt: "" }; promptMode = false; continue; }
    if (idx < 0) continue;
    const r = line.match(/\*\*Seitenverhältnis:\*\*\s*`(\d+:\d+)`/);
    if (r) { out[idx].ratio = r[1]; continue; }
    if (/\*\*Prompt:\*\*/.test(line)) { promptMode = true; continue; }
    if (promptMode) {
      const p = line.match(/^\s*`(.+)`\s*$/);
      if (p) { out[idx].prompt = p[1]; promptMode = false; }
    }
  }
  return out.map((o, i) => ({ name: NAMES[i] ?? `mood-${i + 1}`, ratio: o.ratio, prompt: o.prompt }));
}

async function run(rep: Replicate, prompt: string, ratio: string, maxRetries = 8): Promise<Uint8Array> {
  const input: Record<string, unknown> = {
    prompt, aspect_ratio: ratio, num_inference_steps: 40, guidance: 3,
    output_format: "webp", output_quality: 82, megapixels: "1", num_outputs: 1,
  };
  for (let attempt = 0; ; attempt++) {
    try {
      const output = await rep.run("black-forest-labs/flux-dev", { input });
      const first = Array.isArray(output) ? output[0] : output;
      if (first && typeof (first as { blob?: unknown }).blob === "function") {
        return new Uint8Array(await (await (first as { blob: () => Promise<Blob> }).blob()).arrayBuffer());
      }
      const url = typeof (first as { url?: unknown }).url === "function" ? String((first as { url: () => unknown }).url()) : String(first);
      const res = await fetch(url);
      return new Uint8Array(await res.arrayBuffer());
    } catch (e) {
      const msg = (e as { message?: string }).message ?? String(e);
      const retriable = msg.includes("429") || /throttl/i.test(msg) || /ECONNRESET|ETIMEDOUT|fetch failed|terminated|socket/i.test(msg);
      if (!retriable || attempt >= maxRetries) throw e;
      const m = msg.match(/resets in ~?(\d+)s|retry_after"?:\s*(\d+)/i);
      const waitS = m ? Number(m[1] ?? m[2]) + 1 : Math.min(2 ** attempt, 15);
      console.log(`   …retry in ${waitS}s`);
      await new Promise((r) => setTimeout(r, waitS * 1000));
    }
  }
}

async function main() {
  const rep = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });
  const all = parsePrompts();
  const only = process.argv.slice(2);
  const targets = only.length ? all.filter((p) => only.includes(p.name)) : all;
  const dir = join(root, "public", "mood");
  mkdirSync(dir, { recursive: true });

  console.log(`Generiere ${targets.length} Mood-Bilder (flux-dev):`);
  for (const t of targets) {
    if (!t.prompt) { console.warn(`  ⚠ ${t.name}: kein Prompt geparst`); continue; }
    console.log(`▶ ${t.name} (${t.ratio}) …`);
    const bytes = await run(rep, t.prompt, t.ratio);
    writeFileSync(join(dir, `${t.name}.webp`), bytes);
    console.log(`  ✓ public/mood/${t.name}.webp (${Math.round(bytes.length / 1024)} KB)`);
  }
  console.log("FERTIG");
}
main().catch((e) => { console.error("FEHLER:", e instanceof Error ? e.stack : e); process.exit(1); });
