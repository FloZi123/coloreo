import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropic, MODELS } from "@/lib/anthropic";
import { createPublicClient } from "@/lib/supabase/public";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Locale } from "@/i18n/config";
import { formatPrice } from "@/lib/pricing";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export type ChatMessage = { role: "user" | "assistant"; content: string };

function systemPrompt(locale: Locale): string {
  const lang = locale === "de" ? "Deutsch" : "English";
  return `Du bist der freundliche Support- und Verkaufsassistent von "Coloreo", einem Online-Shop für digitale Malbücher (PDF-Sofortdownload) für Erwachsene und Kinder. Antworte IMMER auf ${lang}, kurz und herzlich.

Wissen:
- Produkte sind digitale Malbücher als PDF (A4, druckfertig), Sofort-Download nach Zahlung.
- Preise ab 4,99 €. Mengenrabatt: 2 Bücher −10%, 3 −20%, 5 −30%, 10 −40%. Es gibt kuratierte Bundles und einen Bundle-Builder.
- Zahlung per Kreditkarte und PayPal (über Stripe). Nach Kauf kommen Download-Links per E-Mail und auf der Danke-Seite; jederzeit in "Meine Bibliothek" (mit Kauf-E-Mail) abrufbar.
- Jede PDF ist personalisiert (Wasserzeichen mit Käufer-E-Mail), nur für privaten Gebrauch. Kein Weiterverkauf.
- Widerruf: Bei digitalen Inhalten erlischt das Widerrufsrecht mit Start des Downloads (Kunde stimmt beim Kauf zu).

Regeln:
- Nutze das Tool "search_products" für Empfehlungen passender Malbücher.
- Nutze "lookup_order" NUR wenn der Kunde nach seiner Bestellung/seinen Downloads fragt und eine E-Mail oder Bestellnummer nennt. Erfinde niemals Bestelldaten.
- Wenn du nicht weiterhelfen kannst oder der Kunde es wünscht, nutze "escalate_to_human" (brauche die E-Mail des Kunden).
- Erfinde keine Fakten. Verweise bei rechtlichen Detailfragen auf die Seiten Impressum/AGB/Widerruf.`;
}

const tools: Anthropic.Tool[] = [
  {
    name: "search_products",
    description: "Sucht passende Malbücher im Katalog (nach Stichwort/Thema). Gibt Titel, Preis und Link zurück.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Suchbegriff oder Thema, z. B. 'Katzen', 'Mandala', 'Kinder Dinosaurier'" },
      },
      required: ["query"],
    },
  },
  {
    name: "lookup_order",
    description: "Findet eine bezahlte Bestellung und ihre Download-Links per E-Mail oder Bestellnummer.",
    input_schema: {
      type: "object",
      properties: {
        email: { type: "string" },
        order_number: { type: "string" },
      },
    },
  },
  {
    name: "escalate_to_human",
    description: "Legt ein Support-Ticket für das menschliche Team an, wenn der Bot nicht weiterhelfen kann.",
    input_schema: {
      type: "object",
      properties: {
        email: { type: "string" },
        summary: { type: "string", description: "Kurze Zusammenfassung des Anliegens" },
      },
      required: ["summary"],
    },
  },
];

async function execTool(name: string, input: Record<string, unknown>, locale: Locale): Promise<string> {
  if (name === "search_products") {
    const q = String(input.query ?? "");
    const sb = createPublicClient();
    const { data } = await sb
      .from("books")
      .select("slug, title_de, title_en, price_cents, tags")
      .eq("status", "published")
      .or(`title_de.ilike.%${q}%,title_en.ilike.%${q}%`)
      .limit(5);
    let results = data ?? [];
    if (results.length === 0) {
      // Fallback: über Tags / Kategorie-Namen
      const { data: byTag } = await sb.from("books").select("slug, title_de, title_en, price_cents, tags").eq("status", "published").contains("tags", [q.toLowerCase()]).limit(5);
      results = byTag ?? [];
    }
    if (results.length === 0) return JSON.stringify({ found: 0, hint: "Keine direkten Treffer – bitte allgemeiner suchen." });
    return JSON.stringify({
      found: results.length,
      products: results.map((b) => ({
        title: locale === "en" ? b.title_en : b.title_de,
        price: formatPrice(b.price_cents, locale),
        url: `${SITE}/${locale}/buch/${b.slug}`,
      })),
    });
  }

  if (name === "lookup_order") {
    const email = input.email ? String(input.email).toLowerCase().trim() : null;
    const orderNumber = input.order_number ? String(input.order_number).trim() : null;
    if (!email && !orderNumber) return JSON.stringify({ error: "E-Mail oder Bestellnummer nötig." });
    const admin = createAdminClient();
    let query = admin.from("orders").select("id, order_number, status, customer_email").eq("status", "paid");
    query = orderNumber ? query.eq("order_number", orderNumber) : query.eq("customer_email", email!);
    const { data: orders } = await query.limit(3);
    if (!orders || orders.length === 0) return JSON.stringify({ found: 0 });
    const orderIds = orders.map((o) => o.id);
    const { data: dls } = await admin.from("downloads").select("order_id, book_id, token").in("order_id", orderIds);
    const { data: books } = await admin.from("books").select("id, title_de, title_en").in("id", (dls ?? []).map((d) => d.book_id));
    const titleMap = new Map((books ?? []).map((b) => [b.id, locale === "en" ? b.title_en : b.title_de]));
    return JSON.stringify({
      found: orders.length,
      orders: orders.map((o) => ({
        order_number: o.order_number,
        downloads: (dls ?? []).filter((d) => d.order_id === o.id).map((d) => ({ title: titleMap.get(d.book_id), url: `${SITE}/api/download/${d.token}` })),
      })),
    });
  }

  if (name === "escalate_to_human") {
    const admin = createAdminClient();
    await admin.from("support_tickets").insert({
      customer_email: input.email ? String(input.email) : null,
      subject: "Chat-Eskalation",
      summary: String(input.summary ?? ""),
      status: "open",
    });
    return JSON.stringify({ ok: true, message: "Ticket angelegt – das Team meldet sich per E-Mail." });
  }

  return JSON.stringify({ error: "unknown_tool" });
}

export async function runChat(messages: ChatMessage[], locale: Locale): Promise<string> {
  const client = getAnthropic();

  // Verlauf vorbereiten: führende Assistant-Greetings entfernen
  const trimmed = [...messages];
  while (trimmed.length && trimmed[0].role === "assistant") trimmed.shift();
  if (trimmed.length === 0) return locale === "de" ? "Wie kann ich helfen?" : "How can I help?";

  const convo: Anthropic.MessageParam[] = trimmed.map((m) => ({ role: m.role, content: m.content }));

  for (let round = 0; round < 4; round++) {
    const res = await client.messages.create({
      model: MODELS.chat,
      max_tokens: 800,
      system: systemPrompt(locale),
      tools,
      messages: convo,
    });

    if (res.stop_reason === "tool_use") {
      convo.push({ role: "assistant", content: res.content });
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of res.content) {
        if (block.type === "tool_use") {
          const out = await execTool(block.name, block.input as Record<string, unknown>, locale);
          toolResults.push({ type: "tool_result", tool_use_id: block.id, content: out });
        }
      }
      convo.push({ role: "user", content: toolResults });
      continue;
    }

    const text = res.content.filter((b) => b.type === "text").map((b) => (b as Anthropic.TextBlock).text).join("\n");
    return text || (locale === "de" ? "Entschuldige, das habe ich nicht verstanden." : "Sorry, I didn't understand that.");
  }
  return locale === "de" ? "Bitte formuliere deine Frage noch einmal." : "Please rephrase your question.";
}
