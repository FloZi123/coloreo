"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { analyticsConfigured, setConsent } from "@/lib/analytics";
import type { Locale } from "@/i18n/config";

/** DSGVO-Opt-in: vor Zustimmung kein Tracking. Nur sichtbar, wenn Analytics konfiguriert ist. */
export default function ConsentBanner({ locale }: { locale: Locale }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (analyticsConfigured() && typeof window !== "undefined" && !localStorage.getItem("coloreo_consent")) setShow(true);
  }, []);
  if (!show) return null;
  const de = locale === "de";
  const decide = (granted: boolean) => { setConsent(granted); setShow(false); };
  return (
    <div className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-xl rounded-2xl border bg-paper p-4 shadow-xl sm:p-5">
      <p className="text-sm text-ink-soft">
        {de
          ? "Wir nutzen anonyme Statistik (PostHog, EU-Hosting), um den Shop zu verbessern. Nur mit deiner Zustimmung."
          : "We use anonymous analytics (PostHog, EU hosting) to improve the shop. Only with your consent."}{" "}
        <Link href={`/${locale}/datenschutz`} className="underline hover:text-primary">{de ? "Datenschutz" : "Privacy"}</Link>
      </p>
      <div className="mt-3 flex gap-2">
        <button onClick={() => decide(true)} className="btn-primary px-5 py-2 text-sm">{de ? "Zustimmen" : "Accept"}</button>
        <button onClick={() => decide(false)} className="rounded-full border px-5 py-2 text-sm font-semibold text-ink-soft hover:border-primary">{de ? "Ablehnen" : "Decline"}</button>
      </div>
    </div>
  );
}
