import Replicate from "replicate";
import sharp from "sharp";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = {};
for (const l of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
}
const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });

async function gen(model, prompt, extra = {}, tries = 6) {
  for (let a = 0; ; a++) {
    try {
      const out = await replicate.run(model, { input: { prompt, aspect_ratio: "3:4", output_format: "png", ...extra } });
      const first = Array.isArray(out) ? out[0] : out;
      if (first && typeof first.blob === "function") return Buffer.from(await (await first.blob()).arrayBuffer());
      const url = typeof first === "string" ? first : typeof first?.url === "function" ? String(first.url()) : null;
      const r = await fetch(url);
      return Buffer.from(await r.arrayBuffer());
    } catch (e) {
      const msg = (e?.message ?? String(e)) + " " + (e?.cause?.code ?? "");
      const retriable = msg.includes("429") || /throttl/i.test(msg) || /ECONNRESET|ETIMEDOUT|fetch failed|terminated|socket/i.test(msg);
      if (a >= tries || !retriable) throw e;
      const w = (Number(msg.match(/in ~?(\d+)s/)?.[1] ?? 5) + 1) * 1000;
      console.log(`  …Fehler (${msg.trim().slice(0, 40)}), retry in ${w / 1000}s`);
      await new Promise((r) => setTimeout(r, w));
    }
  }
}

const LINEART = "coloring book page, black and white line art, clean bold black outlines, no shading, no grayscale, no color, pure white background, full page illustration, ";
const ADULT = "intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, ";
const KIDS = "very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, ";

const DEV = "black-forest-labs/flux-dev";
const PRO = "black-forest-labs/flux-1.1-pro";
const devOpts = { num_inference_steps: 30, guidance: 3.5, megapixels: "1", num_outputs: 1 };
const proOpts = { prompt_upsampling: true, safety_tolerance: 2 };

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function brandingOverlay(w, h, rawTitle, rawCategory, pages, light) {
  const title = esc(rawTitle);
  const category = esc(rawCategory);
  const ink = light ? "#ffffff" : "#2b2540";
  const shadow = light ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.0)";
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <rect x="0" y="0" width="${w}" height="74" fill="rgba(0,0,0,0.28)"/>
    <text x="${w / 2}" y="48" text-anchor="middle" font-family="Arial" font-size="30" font-weight="700" fill="#ffffff">&#10022; Coloreo</text>
    <rect x="0" y="${h - 150}" width="${w}" height="150" fill="${light ? "rgba(43,37,64,0.55)" : "rgba(255,255,255,0.82)"}"/>
    <text x="${w / 2}" y="${h - 96}" text-anchor="middle" font-family="Arial" font-size="34" font-weight="700" fill="${ink}" style="paint-order:stroke;stroke:${shadow};stroke-width:3">${title}</text>
    <text x="${w / 2}" y="${h - 58}" text-anchor="middle" font-family="Arial" font-size="17" fill="${light ? "#e9e3ff" : "#5b5470"}">${category}</text>
    <text x="${w / 2}" y="${h - 30}" text-anchor="middle" font-family="Arial" font-size="15" fill="${light ? "#cfc6ff" : "#8b8499"}">Malbuch · ${pages} Seiten</text>
  </svg>`);
}

async function compose(illusBytes, title, category, light) {
  const base = await sharp(illusBytes).resize(600, 800, { fit: "cover" }).png().toBuffer();
  return sharp(base).composite([{ input: brandingOverlay(600, 800, title, category, 24, light), top: 0, left: 0 }]).png().toBuffer();
}

const adultPrompt = LINEART + ADULT + "a majestic lion with a flowing ornate decorative mane and floral patterns";
const kidsPrompt = LINEART + KIDS + "a happy smiling baby elephant holding a balloon";
async function step(file, model, prompt, opts) {
  if (existsSync(join(root, file))) { console.log(`= ${file} existiert, skip`); return; }
  console.log(`… ${file}`);
  writeFileSync(join(root, file), await gen(model, prompt, opts));
}
await step("qt-adult-dev.png", DEV, adultPrompt, devOpts);
await step("qt-adult-pro.png", PRO, adultPrompt, proOpts);
await step("qt-kids-dev.png", DEV, kidsPrompt, devOpts);
await step("qt-kids-pro.png", PRO, kidsPrompt, proOpts);

if (!existsSync(join(root, "qt-cover-A.png"))) {
  console.log("… qt-cover-A.png (bunt)");
  const coverA = await gen(PRO, "vibrant colorful children's book cover illustration of a cute magical unicorn in a flowery meadow with a rainbow, cheerful bright colors, professional clean illustration, no text", proOpts);
  writeFileSync(join(root, "qt-cover-A.png"), await compose(coverA, "Einhörner & Magie", "🦄 Einhörner & Magie", true));
} else console.log("= qt-cover-A.png existiert, skip");

if (!existsSync(join(root, "qt-cover-B.png"))) {
  console.log("… qt-cover-B.png (teilkoloriert)");
  const coverB = await gen(PRO, "coloring book style illustration of a cute magical unicorn in a meadow, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, white background, no text", proOpts);
  writeFileSync(join(root, "qt-cover-B.png"), await compose(coverB, "Einhörner & Magie", "🦄 Einhörner & Magie", false));
} else console.log("= qt-cover-B.png existiert, skip");

console.log("✓ fertig: qt-*.png");
