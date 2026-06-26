import Replicate from "replicate";

/**
 * Pluggable Bild-Provider für thematische Malseiten (Linienkunst).
 * Aktuelle Implementierung: Replicate. Weitere Provider (OpenAI, Firefly …)
 * lassen sich durch dieselbe `ImageProvider`-Schnittstelle ergänzen.
 */
export interface ImageProvider {
  /** Erzeugt ein PNG (Linienkunst) zum Prompt und liefert die Bytes. */
  generate(prompt: string): Promise<Uint8Array>;
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

  async generate(prompt: string): Promise<Uint8Array> {
    const output = await this.client.run(this.model, {
      input: {
        prompt,
        aspect_ratio: "3:4",
        num_outputs: 1,
        output_format: "png",
        megapixels: "1",
        disable_safety_checker: false,
      },
    });

    // Replicate-SDK liefert je nach Version: FileOutput[], FileOutput, URL-String[] oder URL-String.
    const first = Array.isArray(output) ? output[0] : output;
    if (!first) throw new Error("Replicate: keine Ausgabe erhalten");

    // FileOutput mit .blob()
    if (typeof first === "object" && first !== null && typeof (first as { blob?: unknown }).blob === "function") {
      const blob = await (first as { blob: () => Promise<Blob> }).blob();
      return new Uint8Array(await blob.arrayBuffer());
    }
    // FileOutput mit .url()
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
}

export function getImageProvider(): ImageProvider {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token || token.includes("PLACEHOLDER")) {
    throw new Error("REPLICATE_API_TOKEN fehlt/Platzhalter.");
  }
  return new ReplicateProvider(token);
}
