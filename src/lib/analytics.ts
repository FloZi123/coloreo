"use client";
import posthog from "posthog-js";

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";
const CONSENT_KEY = "coloreo_consent";

let started = false;

export function analyticsConfigured(): boolean {
  return !!KEY;
}
export function hasConsent(): boolean {
  return typeof window !== "undefined" && localStorage.getItem(CONSENT_KEY) === "granted";
}
export function setConsent(granted: boolean) {
  if (typeof window !== "undefined") localStorage.setItem(CONSENT_KEY, granted ? "granted" : "denied");
  if (granted) initAnalytics();
}

/** Initialisiert PostHog NUR nach Einwilligung (EU-Host, keine Session-Recordings, kein Autocapture). */
export function initAnalytics() {
  if (started || !KEY || typeof window === "undefined" || !hasConsent()) return;
  posthog.init(KEY, {
    api_host: HOST,
    person_profiles: "identified_only",
    capture_pageview: false,
    autocapture: false,
    disable_session_recording: true,
  });
  started = true;
}

// ── UTM-Attribution (Video/Social → Freebie) ──────────────────────────────
/** Reine UTM-Extraktion aus einem Query-String (testbar, ohne Browser-Abhängigkeit). */
export function parseUtm(search: string): Record<string, string> {
  const p = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const out: Record<string, string> = {};
  for (const k of ["utm_source", "utm_medium", "utm_campaign"]) { const v = p.get(k); if (v) out[k] = v; }
  return out;
}
function currentUtm(): Record<string, string> {
  return typeof window !== "undefined" ? parseUtm(window.location.search) : {};
}

export function capture(event: string, props?: Record<string, unknown>) {
  if (!started || !hasConsent()) return;
  // UTM an JEDES Event hängen (insb. freebie_signup) → Video/Social→Freebie attribuierbar.
  posthog.capture(event, { ...currentUtm(), ...props });
}
export function capturePageview(path: string) {
  if (!started) return;
  posthog.capture("$pageview", { $current_url: path, ...currentUtm() });
}
