"use client";

import { use, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/${locale}/bibliothek` },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
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
