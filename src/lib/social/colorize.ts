import sharp from "sharp";
import type Replicate from "replicate";
import { colorizeWithinLines } from "../generator/thematic";
import type { Frame } from "./frames";

async function outputToBytes(output: unknown): Promise<Uint8Array> {
  const first = Array.isArray(output) ? output[0] : output;
  if (!first) throw new Error("Replicate: keine Ausgabe");
  if (typeof first === "object" && typeof (first as { blob?: unknown }).blob === "function") {
    return new Uint8Array(await (await (first as { blob: () => Promise<Blob> }).blob()).arrayBuffer());
  }
  const url = typeof (first as { url?: unknown }).url === "function" ? String((first as { url: () => unknown }).url()) : String(first);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Replicate-Download ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

export type Audience = "kids" | "all" | "adult";

/**
 * Realistische, RUHIGE Kolorierung EINER Linienkunst-Seite (Anti-Stress/Cottagecore).
 * 1) flux-dev img2img koloriert das Blatt mit weichen, natürlichen Tönen,
 * 2) die AI-Farben werden leicht entsättigt (kein Neon/Regenbogen),
 * 3) die ORIGINAL-Konturen werden per multiply sauber darübergelegt → „in den Linien",
 *    ohne den grellen Paint-by-Numbers-Flächenfüller.
 * Liefert ein PNG (W×H). WIRFT bei Fehler – KEIN stiller s/w-Fallback (AI-Kolorierung ist Pflicht).
 * `audience` koppelt den Detailgrad (kids einfacher, adult feiner) – reiner img2img-Prompt.
 */
export async function realisticColored(rep: Replicate, frame: Frame, W: number, H: number, audience: Audience = "all"): Promise<Buffer> {
  const lineForAi = await sharp(frame.png).resize(896, null, { fit: "inside" }).flatten({ background: "#ffffff" }).png().toBuffer();
  const dataUri = `data:image/png;base64,${lineForAi.toString("base64")}`;
  const detail = audience === "kids"
    ? "simple soft clean colors, "
    : audience === "adult"
      ? "delicate subtle colored-pencil shading, "
      : "gentle soft natural shading, ";
  const out = await rep.run("black-forest-labs/flux-dev", {
    input: {
      image: dataUri,
      // Klar koloriert, aber ruhig/natürlich – ausdrücklich KEIN Neon/Regenbogen/Übersättigung.
      prompt: `fully colored version of this illustration, ${detail}every area clearly filled with soft natural realistic colors, cozy harmonious earthy palette, gentle colored-pencil and light watercolor shading, warm believable real-world tones, NOT neon, NOT rainbow, NOT oversaturated, NOT garish, NOT random flat block colors, soft daytime light, plain white background, no text`,
      prompt_strength: 0.85,
      num_inference_steps: 34,
      guidance: 3.5,
      output_format: "png",
      megapixels: "1",
    },
  });
  const colBytes = await outputToBytes(out);
  // Natürliche AI-Farben – klar sichtbar, aber ruhig (leicht über neutral, kein Neon).
  const colored = await sharp(colBytes).resize(W, H, { fit: "fill" }).flatten({ background: "#ffffff" })
    .modulate({ saturation: 1.08, brightness: 1.0 }).toColourspace("srgb").png().toBuffer();
  // Original-Konturen (schwarz auf weiß) per multiply darüber → saubere, scharfe Linien über der Färbung.
  const lines = await sharp(frame.png).resize(W, H, { fit: "fill" }).flatten({ background: "#ffffff" }).grayscale().toColourspace("srgb").png().toBuffer();
  return sharp(colored).composite([{ input: lines, blend: "multiply" }]).png().toBuffer();
}

/** Flache Markenfüllung (kein AI) – Fallback / --flat. */
export async function flatColored(frame: Frame, W: number, H: number): Promise<Buffer> {
  const raw = await colorizeWithinLines(frame.png, W, H);
  return sharp(raw, { raw: { width: W, height: H, channels: 3 } }).png().toBuffer();
}
