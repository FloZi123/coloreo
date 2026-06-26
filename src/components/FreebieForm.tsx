"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export default function FreebieForm({
  locale,
  dict,
  compact = false,
}: {
  locale: Locale;
  dict: Dictionary;
  compact?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    setState("loading");
    try {
      const res = await fetch("/api/freebie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale, source: "freebie" }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return <p className="rounded-2xl bg-success/10 px-4 py-3 text-center font-medium text-success">✓ {dict.freebie.success}</p>;
  }

  return (
    <form onSubmit={submit} className={compact ? "flex gap-2" : "mx-auto flex max-w-md flex-col gap-3 sm:flex-row"}>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={dict.freebie.emailPlaceholder}
        className="flex-1 rounded-full border bg-white px-5 py-3 text-sm outline-none focus:border-primary"
      />
      <button type="submit" disabled={state === "loading"} className="btn-primary whitespace-nowrap px-6 py-3 text-sm">
        {state === "loading" ? dict.common.loading : dict.freebie.submit}
      </button>
    </form>
  );
}
