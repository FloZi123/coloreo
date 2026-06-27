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

export function capture(event: string, props?: Record<string, unknown>) {
  if (!started || !hasConsent()) return;
  posthog.capture(event, props);
}
export function capturePageview(path: string) {
  if (!started) return;
  posthog.capture("$pageview", { $current_url: path });
}
