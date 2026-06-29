"use client";

import { use, useState } from "react";

export default function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const de = locale === "de";
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    setLoading(true);
    setError("");
    // Magic-Link wird serverseitig erzeugt und über unsere gebrandete,
    // lokalisierte E-Mail versendet (statt Supabase-Default-Template).
    const res = await fetch("/api/auth/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, locale }),
    });
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok || !json.ok) {
      setError(
        json.error === "rate_limited"
          ? de ? "Zu viele Versuche – bitte in ein paar Minuten erneut." : "Too many attempts – please try again in a few minutes."
          : de ? "Etwas ist schiefgelaufen. Bitte später erneut versuchen." : "Something went wrong. Please try again later.",
      );
    } else setSent(true);
  }

  return (
    <div className="container-page py-20">
      <div className="card mx-auto max-w-md p-8 text-center">
        <span className="text-4xl">🔑</span>
        <h1 className="mt-3 font-display text-2xl font-bold">{de ? "Anmelden / Meine Bibliothek" : "Sign in / My Library"}</h1>
        {sent ? (
          <p className="mt-4 text-ink-soft">
            {de ? "Wir haben dir einen Login-Link an " : "We sent a login link to "}
            <strong>{email}</strong> {de ? "geschickt. Öffne die E-Mail, um dich anzumelden." : ". Open it to sign in."}
          </p>
        ) : (
          <>
            <p className="mt-2 text-ink-soft">{de ? "Wir senden dir einen sicheren Login-Link per E-Mail – kein Passwort nötig." : "We'll email you a secure login link – no password needed."}</p>
            <form onSubmit={submit} className="mt-6 flex flex-col gap-2 sm:flex-row">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={de ? "deine@email.de" : "you@email.com"} className="flex-1 rounded-full border px-5 py-3 text-sm outline-none focus:border-primary" />
              <button type="submit" disabled={loading} className="btn-primary whitespace-nowrap px-6 py-3 text-sm">{loading ? "…" : de ? "Link senden" : "Send link"}</button>
            </form>
            {error && <p className="mt-3 text-sm text-accent">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
