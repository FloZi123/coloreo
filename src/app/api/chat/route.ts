import { NextResponse } from "next/server";
import { runChat, type ChatMessage } from "@/lib/chatbot";
import { anthropicConfigured } from "@/lib/anthropic";
import { isLocale } from "@/i18n/config";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages: ChatMessage[] = (body.messages ?? [])
      .filter((m: ChatMessage) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-12);
    const locale = isLocale(body.locale) ? body.locale : "de";

    if (!anthropicConfigured()) {
      const reply =
        locale === "de"
          ? "Der KI-Assistent ist noch nicht konfiguriert (ANTHROPIC_API_KEY fehlt). Gerne helfen dir solange unsere Hilfe-Seiten: Downloads findest du in „Meine Bibliothek“, Zahlung per Karte/PayPal, PDFs sofort nach Kauf."
          : "The AI assistant isn't configured yet (missing ANTHROPIC_API_KEY). Meanwhile: find downloads in 'My Library', pay by card/PayPal, PDFs delivered instantly.";
      return NextResponse.json({ reply });
    }

    const reply = await runChat(messages, locale);
    return NextResponse.json({ reply });
  } catch (e) {
    console.error("[chat]", e);
    return NextResponse.json({ reply: "⚠️ Sorry, etwas ist schiefgelaufen. Bitte versuche es erneut." });
  }
}
