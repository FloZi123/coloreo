"use client";

import { useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

type Msg = { role: "user" | "assistant"; content: string };

export default function ChatWidget({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: dict.chat.greeting }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const sessionId = useRef<string>(
    typeof crypto !== "undefined" ? crypto.randomUUID() : String(Date.now())
  );

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, locale, sessionId: sessionId.current }),
      });
      const data = await res.json();
      setMessages([...next, { role: "assistant", content: data.reply ?? "…" }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "⚠️ " + dict.chat.connectionError }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl text-white shadow-lg hover:bg-primary-dark"
        aria-label={dict.chat.title}
      >
        {open ? "✕" : "💬"}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[28rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border bg-surface shadow-2xl">
          <div className="bg-primary px-4 py-3 font-display font-semibold text-white">{dict.chat.title}</div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                <span
                  className={`inline-block max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user" ? "bg-primary text-white" : "bg-primary-soft text-ink"
                  }`}
                >
                  {m.content}
                </span>
              </div>
            ))}
            {loading && <div className="text-left text-sm text-muted">…</div>}
          </div>
          <div className="flex gap-2 border-t p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={dict.chat.placeholder}
              className="flex-1 rounded-full border px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <button onClick={send} disabled={loading} className="btn-primary px-4 text-sm">
              {dict.chat.send}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
