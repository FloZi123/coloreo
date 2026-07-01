import Replicate from "replicate";

/**
 * Pluggable Bild-Provider für thematische Malseiten (Linienkunst).
 * Aktuelle Implementierung: Replicate. Weitere Provider (OpenAI, Firefly …)
 * lassen sich durch dieselbe `ImageProvider`-Schnittstelle ergänzen.
 */
export interface ImageProvider {
  /** Erzeugt ein PNG (Linienkunst) zum Prompt und liefert die Bytes.
   *  opts.seed: fester Seed → reproduzierbar; für Charakter-Konsistenz über die Buchseiten. */
  generate(prompt: string, opts?: { seed?: number }): Promise<Uint8Array>;
  /** img2img: koloriert ein Eingabebild (Linienkunst) natürlich (flux-dev), deckungsgleich.
   *  seed: fester Seed → reproduzierbare Kolorierung. */
  colorize(image: Uint8Array, prompt: string, promptStrength?: number, seed?: number): Promise<Uint8Array>;
}

export function imageProviderConfigured(): boolean {
  const t = process.env.REPLICATE_API_TOKEN;
  return !!t && !t.includes("PLACEHOLDER");
}

const DEFAULT_MODEL = "black-forest-labs/flux-schnell";

class ReplicateProvider implements ImageProvider {
  private client: Replicate;
  private model: `${string}/${string}`;
  constructor(token: string) {
    this.client = new Replicate({ auth: token });
    this.model = (process.env.REPLICATE_MODEL || DEFAULT_MODEL) as `${string}/${string}`;
  }

  /** Führt ein Modell aus und wiederholt bei Rate-Limit (429)/Netzwerkfehlern mit Backoff. */
  private async runModel(model: `${string}/${string}`, input: Record<string, unknown>, maxRetries = 8): Promise<unknown> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.client.run(model, { input });
      } catch (e) {
        const err = e as { message?: string; cause?: { code?: string } };
        const msg = (err.message ?? String(e)) + " " + (err.cause?.code ?? "");
        const retriable = msg.includes("429") || /throttl/i.test(msg) || /ECONNRESET|ETIMEDOUT|fetch failed|terminated|socket/i.test(msg);
        if (!retriable || attempt >= maxRetries) throw e;
        const m = msg.match(/resets in ~?(\d+)s|retry_after"?:\s*(\d+)/i);
        const waitS = m ? Number(m[1] ?? m[2]) + 1 : Math.min(2 ** attempt, 15);
        await new Promise((r) => setTimeout(r, waitS * 1000));
      }
    }
  }

  /** Replicate-Ausgabe (FileOutput[]/FileOutput/URL-String) → Bytes. */
  private async toBytes(output: unknown): Promise<Uint8Array> {
    const first = Array.isArray(output) ? output[0] : output;
    if (!first) throw new Error("Replicate: keine Ausgabe erhalten");
    if (typeof first === "object" && first !== null && typeof (first as { blob?: unknown }).blob === "function") {
      const blob = await (first as { blob: () => Promise<Blob> }).blob();
      return new Uint8Array(await blob.arrayBuffer());
    }
    let url: string | null = null;
    if (typeof first === "object" && first !== null && typeof (first as { url?: unknown }).url === "function") {
      url = String((first as { url: () => unknown }).url());
    } else if (typeof first === "string") {
      url = first;
    }
    if (!url) throw new Error("Replicate: Ausgabeformat nicht erkannt");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Replicate: Bild-Download fehlgeschlagen (${res.status})`);
    return new Uint8Array(await res.arrayBuffer());
  }

  async generate(prompt: string, opts?: { seed?: number }): Promise<Uint8Array> {
    const isFlux = this.model.includes("flux");
    const isDev = this.model.includes("flux-dev");
    const input: Record<string, unknown> = { prompt, aspect_ratio: "3:4", output_format: "png" };
    if (opts?.seed !== undefined) input.seed = opts.seed;
    if (isFlux) {
      input.num_outputs = 1;
      input.megapixels = "1";
      if (isDev) { input.num_inference_steps = 30; input.guidance = 3.5; }
    }
    return this.toBytes(await this.runModel(this.model, input));
  }

  /** img2img-Kolorierung (flux-dev) EINES Eingabebildes – deckungsgleich zur Linienkunst. */
  async colorize(image: Uint8Array, prompt: string, promptStrength = 0.85, seed?: number): Promise<Uint8Array> {
    const dataUri = `data:image/png;base64,${Buffer.from(image).toString("base64")}`;
    const input: Record<string, unknown> = {
      image: dataUri, prompt, prompt_strength: promptStrength,
      num_inference_steps: 34, guidance: 3.5, output_format: "png", megapixels: "1",
    };
    if (seed !== undefined) input.seed = seed;
    return this.toBytes(await this.runModel("black-forest-labs/flux-dev", input));
  }
}

export function getImageProvider(): ImageProvider {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token || token.includes("PLACEHOLDER")) {
    throw new Error("REPLICATE_API_TOKEN fehlt/Platzhalter.");
  }
  return new ReplicateProvider(token);
}
