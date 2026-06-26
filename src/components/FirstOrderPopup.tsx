"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";

const KEY = "coloreo_welcome_seen";
const CODE = "WILLKOMMEN10";

export default function FirstOrderPopup({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const de = locale === "de";

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY)) return;
    } catch {
      return;
    }
    const t = setTimeout(() => setOpen(true), 12000);
    return () => clearTimeout(t);
  }, []);

  function close() {
    setOpen(false);
    try { localStorage.setItem(KEY, "1"); } catch {}
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    setDone(true);
    try { localStorage.setItem(KEY, "1"); } catch {}
    fetch("/api/freebie", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, locale, source: "newsletter" }) }).catch(() => {});
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={close}>
      <div className="w-full max-w-md rounded-2xl bg-surface p-8 text-center" onClick={(e) => e.stopPropagation()}>
        <button onClick={close} className="float-right text-muted hover:text-ink" aria-label="schließen">✕</button>
        <span className="text-4xl">🎁</span>
        {!done ? (
          <>
            <h2 className="mt-3 font-display text-2xl font-bold">{de ? "10 % auf deine erste Bestellung" : "10% off your first order"}</h2>
            <p className="mt-2 text-ink-soft">{de ? "Trag dich ein und erhalte deinen Willkommens-Gutschein – plus gratis Probeseiten." : "Sign up and get your welcome code – plus free sample pages."}</p>
            <form onSubmit={submit} className="mt-5 flex flex-col gap-2 sm:flex-row">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={de ? "deine@email.de" : "you@email.com"} className="flex-1 rounded-full border px-5 py-3 text-sm outline-none focus:border-primary" />
              <button type="submit" className="btn-primary whitespace-nowrap px-6 py-3 text-sm">{de ? "Code sichern" : "Get code"}</button>
            </form>
            <p className="mt-3 text-xs text-muted">{de ? "Kein Spam. Abmeldung jederzeit." : "No spam. Unsubscribe anytime."}</p>
          </>
        ) : (
          <>
            <h2 className="mt-3 font-display text-2xl font-bold">{de ? "Geschafft! 🎉" : "Done! 🎉"}</h2>
            <p className="mt-2 text-ink-soft">{de ? "Dein Code an der Kasse:" : "Your code at checkout:"}</p>
            <div className="mt-3 rounded-xl border-2 border-dashed border-primary bg-primary-soft px-4 py-3 font-mono text-xl font-bold text-primary">{CODE}</div>
            <button onClick={close} className="btn-primary mt-5 px-6 py-2.5 text-sm">{de ? "Weiter stöbern" : "Keep browsing"}</button>
          </>
        )}
      </div>
    </div>
  );
}
