import Anthropic from "@anthropic-ai/sdk";

export const MODELS = {
  chat: "claude-haiku-4-5-20251001",
  content: "claude-sonnet-4-6",
} as const;

let _client: Anthropic | null = null;

export function anthropicConfigured(): boolean {
  const key = process.env.ANTHROPIC_API_KEY;
  return !!key && !key.includes("PLACEHOLDER");
}

export function getAnthropic(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key.includes("PLACEHOLDER")) {
    throw new Error("ANTHROPIC_API_KEY fehlt/Platzhalter.");
  }
  if (!_client) _client = new Anthropic({ apiKey: key });
  return _client;
}
