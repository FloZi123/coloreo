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

/**
 * Realistische Kolorierung EINER Linienkunst-Seite (wie bei den Covern):
 * 1) flux-dev img2img koloriert das Blatt natürlich,
 * 2) daraus wird je Fläche der reale Farbton gesampelt und INNERHALB der Linien flach gefüllt.
 * Liefert ein PNG (W×H). Fällt bei Fehler auf die flache Markenpalette zurück.
 */
export async function realisticColored(rep: Replicate, frame: Frame, W: number, H: number): Promise<Buffer> {
  try {
    const lineForAi = await sharp(frame.png).resize(896, null, { fit: "inside" }).flatten({ background: "#ffffff" }).png().toBuffer();
    const dataUri = `data:image/png;base64,${lineForAi.toString("base64")}`;
    const out = await rep.run("black-forest-labs/flux-dev", {
      input: {
        image: dataUri,
        prompt: "fully colored version of this illustration, rich vibrant natural realistic colors, every area filled with its true real-world color, very colorful and saturated, bright cheerful daylight palette, light and airy, NOT grayscale, NOT monochrome, NOT a dark or night scene, no black background, white background, no text",
        prompt_strength: 0.82,
        num_inference_steps: 32,
        guidance: 4,
        output_format: "png",
        megapixels: "1",
      },
    });
    const colBytes = await outputToBytes(out);
    // Farbquelle aufhellen/sättigen, damit dunkle Renderbereiche nicht zu schwarzen Füllungen werden
    const { data, info } = await sharp(colBytes).resize(W, H, { fit: "fill" }).flatten({ background: "#ffffff" })
      .modulate({ brightness: 1.16, saturation: 1.28 }).toColourspace("srgb").raw().toBuffer({ resolveWithObject: true });
    const raw = await colorizeWithinLines(frame.png, W, H, { data, ch: info.channels }, 108);
    return sharp(raw, { raw: { width: W, height: H, channels: 3 } }).png().toBuffer();
  } catch (e) {
    console.warn(`    ⚠ AI-Kolorierung fehlgeschlagen, flache Füllung: ${e instanceof Error ? e.message : e}`);
    const raw = await colorizeWithinLines(frame.png, W, H);
    return sharp(raw, { raw: { width: W, height: H, channels: 3 } }).png().toBuffer();
  }
}

/** Flache Markenfüllung (kein AI) – Fallback / --flat. */
export async function flatColored(frame: Frame, W: number, H: number): Promise<Buffer> {
  const raw = await colorizeWithinLines(frame.png, W, H);
  return sharp(raw, { raw: { width: W, height: H, channels: 3 } }).png().toBuffer();
}
