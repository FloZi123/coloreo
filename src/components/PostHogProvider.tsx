"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initAnalytics, capturePageview, hasConsent } from "@/lib/analytics";

/** Initialisiert Analytics (nach Consent) und trackt SPA-Pageviews. */
export default function PostHogProvider() {
  const pathname = usePathname();
  useEffect(() => {
    if (hasConsent()) {
      initAnalytics();
      capturePageview(pathname);
    }
  }, [pathname]);
  return null;
}
