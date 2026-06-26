import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mandalaPaths, colorFromSlug, hashSeed } from "./lib-art.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// .env.local minimal parsen
const env = {};
for (const line of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function wrap(title, max) {
  const words = title.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > max) {
      if (cur) lines.push(cur.trim());
      cur = w;
    } else cur = (cur + " " + w).trim();
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

function cover(book, cat) {
  const c = colorFromSlug(cat.slug);
  const seed = hashSeed(book.slug);
  const paths = mandalaPaths(seed, 300, 360, 195)
    .map((d) => `<path d="${d}" fill="none" stroke="${c.stroke}" stroke-width="1.6" stroke-linejoin="round"/>`)
    .join("");
  const titleLines = wrap(book.title_de, 18);
  const fontSize = titleLines.length > 2 ? 34 : 40;
  const titleSvg = titleLines
    .map((l, i) => `<tspan x="300" dy="${i === 0 ? 0 : fontSize + 4}">${esc(l)}</tspan>`)
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="600" height="800">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${c.bgA}"/><stop offset="1" stop-color="${c.bgB}"/>
    </linearGradient>
  </defs>
  <rect width="600" height="800" fill="url(#bg)"/>
  <rect x="22" y="22" width="556" height="756" rx="28" fill="none" stroke="${c.stroke}" stroke-width="2" opacity="0.5"/>
  <text x="300" y="74" text-anchor="middle" font-family="Quicksand, Arial, sans-serif" font-size="26" font-weight="700" fill="${c.stroke}">&#10022; Coloreo</text>
  <g transform="translate(0,40)">${paths}</g>
  <g transform="translate(300,640)">
    <rect x="-110" y="-26" width="220" height="34" rx="17" fill="#ffffff" opacity="0.8"/>
    <text x="0" y="-3" text-anchor="middle" font-family="Quicksand, Arial, sans-serif" font-size="16" font-weight="600" fill="${c.stroke}">${esc(cat.emoji ?? "")} ${esc(cat.name_de)}</text>
  </g>
  <text x="300" y="700" text-anchor="middle" font-family="Quicksand, Arial, sans-serif" font-size="${fontSize}" font-weight="700" fill="#2b2540">${titleSvg}</text>
  <text x="300" y="772" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" fill="#5b5470">Malbuch · ${book.page_count} Seiten</text>
</svg>`;
}

const { data: cats } = await sb.from("categories").select("id, slug, name_de, emoji");
const catMap = new Map(cats.map((c) => [c.id, c]));
const { data: books } = await sb.from("books").select("id, slug, title_de, page_count, category_id");

const outDir = join(root, "public", "covers");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

let n = 0;
for (const book of books) {
  const cat = catMap.get(book.category_id);
  if (!cat) continue;
  writeFileSync(join(outDir, `${book.slug}.svg`), cover(book, cat), "utf8");
  n++;
}
console.log(`✓ ${n} Cover erzeugt in public/covers/`);
