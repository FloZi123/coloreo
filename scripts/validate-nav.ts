/**
 * Validiert den IA-Fokus (Welten aus Hauptnav/Startseite, Zielgruppen-Nav, Welt-URLs erhalten).
 *   npx tsx scripts/validate-nav.ts   → letzte Zeile "NAV PASS".
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p: string) => (existsSync(join(root, p)) ? readFileSync(join(root, p), "utf8") : null);
const errs: string[] = [];
const ok = (m: string) => console.log("  ✓ " + m);

// ── 1) HAUPT-NAV ─────────────────────────────────────────────────────────────
const header = read("src/components/Header.tsx") ?? "";
const linksBlock = header.match(/const links = \[([\s\S]*?)\];/)?.[1] ?? "";
if (!linksBlock) errs.push("Header: links-Array nicht gefunden");
if (/p\(\s*["'`]\/welten["'`]\s*\)/.test(linksBlock)) errs.push("Header: Welten ist noch ein Primär-Nav-Link (/welten)");
const audience = read("src/components/AudienceNav.tsx") ?? "";
if (!/audience=adult/.test(audience) || !/audience=kids/.test(audience)) errs.push("AudienceNav: audience=adult/kids Ziel-URLs fehlen");
// Header muss die beiden Zielgruppen-Einträge führen (über die zentralen Labels/Hrefs).
if (!/AUDIENCE_HREF\.adults/.test(linksBlock) || !/AUDIENCE_HREF\.kids/.test(linksBlock)) errs.push("Header: keine zwei Zielgruppen-Einträge (Erwachsene/Kinder)");
if (!/AUDIENCE_LABELS|aud\.adults/.test(header)) errs.push("Header: Zielgruppen-Labels nicht genutzt");
if (!errs.length) ok("Haupt-Nav: kein /welten-Primärlink; zwei Zielgruppen-Einträge (Erwachsene/Kinder)");

// ── 2) STARTSEITE ────────────────────────────────────────────────────────────
const home = read("src/app/[locale]/page.tsx") ?? "";
if (/worlds\.map/.test(home)) errs.push("Startseite: 6-Welten-Grid (worlds.map) noch als Browse-Block");
if (/\/welten\/\$\{/.test(home)) errs.push("Startseite: verlinkt noch /welten/<slug> als Primär-Browse");
if (!/AudienceNav/.test(home)) errs.push("Startseite: keine Zielgruppen-Navigation (AudienceNav)");
if (!/COLLECTION_HREF|\/kategorien\/cottagecore/.test(home)) errs.push("Startseite: Hero verlinkt nicht die Anti-Stress/Cottagecore-Kollektion");
if (!/\/gratis/.test(home)) errs.push("Startseite: Held-Haupt-CTA (Gratis-Probeseite) fehlt");
if (!errs.some((e) => /Startseite/.test(e))) ok("Startseite: Held-Hero (Gratis + Anti-Stress-Kollektion) + Zielgruppen-Nav, kein Welten-Grid");

// ── 3) URLS ERHALTEN ─────────────────────────────────────────────────────────
if (!read("src/app/[locale]/welten/page.tsx")) errs.push("welten/page.tsx wurde entfernt (URL muss bleiben)");
if (!read("src/app/[locale]/welten/[slug]/page.tsx")) errs.push("welten/[slug]/page.tsx wurde entfernt (URL muss bleiben)");
if (!errs.some((e) => /welten\//.test(e))) ok("Welt-URLs erhalten (welten/ + welten/[slug] existieren weiter)");

if (errs.length) { for (const e of errs) console.log("✗ " + e); console.log(`\nNAV FAIL (${errs.length})`); process.exit(1); }
console.log("\nNAV PASS");
