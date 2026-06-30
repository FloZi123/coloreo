/**
 * Validiert Social-Compliance: KI-Disclosure (AI-Act/Plattform) + UTM-Attribution (Video→Freebie).
 *   npx tsx scripts/validate-social-compliance.ts   → letzte Zeile "PASS".
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SOCIAL_I18N } from "../src/lib/social/strings";
import { locales } from "../src/i18n/config";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p: string) => (existsSync(p) ? readFileSync(p, "utf8") : null);
const errs: string[] = [];

// ── 1) DISCLOSURE ──────────────────────────────────────────────────────────
for (const l of locales) {
  const d = SOCIAL_I18N[l]?.disclosure;
  if (!d || !d.trim()) errs.push(`SOCIAL_I18N.${l}.disclosure fehlt/leer`);
}
const pins = read(join(root, "src/lib/social/pins.ts")) ?? "";
const video = read(join(root, "src/lib/social/video.ts")) ?? "";
if (!/disclosure/i.test(pins)) errs.push("pins.ts brennt keine Disclosure ein");
if (!/disclosure/i.test(video)) errs.push("video.ts brennt keine Disclosure ein");
const gen = read(join(root, "scripts/generate-social.ts")) ?? "";
if (!/aiDisclosure|disclosureText/.test(gen)) errs.push("Manifest enthält kein Disclosure-Flag/Text");

// Beispiel-Asset (mit --force erzeugt): irgendein social.json mit aiDisclosure + Text.
function findManifests(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...findManifests(p));
    else if (e.name === "social.json") out.push(p);
  }
  return out;
}
const manifests = findManifests(join(root, "public/social"));
const withDisc = manifests.map((m) => { try { return JSON.parse(readFileSync(m, "utf8")); } catch { return null; } })
  .filter((j) => j && j.aiDisclosure === true && typeof j.disclosureText === "string" && j.disclosureText.trim());
if (withDisc.length === 0) errs.push("Kein Beispiel-Asset-Manifest mit aiDisclosure+disclosureText gefunden (npm run social:gen -- <slug> --flat --force)");
else console.log(`  ✓ Beispiel-Manifest: ${withDisc.length} mit Disclosure "${withDisc[0].disclosureText}"`);

// ── 2) ATTRIBUTION ─────────────────────────────────────────────────────────
const analytics = read(join(root, "src/lib/analytics.ts")) ?? "";
if (!/capturePageview/.test(analytics) || !/currentUtm|parseUtm/.test(analytics)) errs.push("analytics: pageview ohne UTM");
if (!/posthog\.capture\(event,\s*\{[^}]*currentUtm/.test(analytics)) errs.push("analytics: capture-Events ohne UTM-Props");
const freebie = read(join(root, "src/components/FreebieForm.tsx")) ?? "";
if (!/freebie_signup/.test(freebie) || !/parseUtm|utm_/.test(freebie)) errs.push("FreebieForm: freebie_signup ohne UTM-Props");

// Unit-Check: die ECHTE parseUtm-Funktion isoliert ausführen (kein Browser-Import nötig).
const m = analytics.match(/export function parseUtm\(search[^)]*\)[^{]*\{([\s\S]*?)\n\}/);
if (!m) errs.push("parseUtm nicht gefunden");
else {
  try {
    const body = m[1].replace(/: Record<string, string>/g, "").replace(/: string/g, "");
    const fn = new Function("search", body) as (s: string) => Record<string, string>;
    const r = fn("?utm_source=tiktok&utm_medium=video&utm_campaign=dino-vulkane");
    const empty = fn("?foo=bar");
    if (r.utm_source !== "tiktok" || r.utm_medium !== "video" || r.utm_campaign !== "dino-vulkane")
      errs.push(`parseUtm Unit-Check: falsche Props ${JSON.stringify(r)}`);
    else if (Object.keys(empty).length !== 0) errs.push("parseUtm Unit-Check: liefert Props ohne UTM");
    else console.log(`  ✓ parseUtm Unit-Check ok: ${JSON.stringify(r)}`);
  } catch (e) {
    errs.push("parseUtm Unit-Check Fehler: " + (e instanceof Error ? e.message : String(e)));
  }
}

if (errs.length) { for (const e of errs) console.log("✗ " + e); console.log(`\nFAIL (${errs.length})`); process.exit(1); }
else console.log("\nPASS");
