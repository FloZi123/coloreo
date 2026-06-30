import { cookies, headers } from "next/headers";
import { CURRENCY_COOKIE, currencyForCountry, isCurrency, type Currency } from "@/lib/currency";

/**
 * Aktive Währung serverseitig auflösen:
 *   1) manuelle Wahl (Cookie) > 2) Geo (Vercel-IP-Header) > 3) Fallback EUR.
 * Geo wird NUR zum Vorbelegen genutzt (kein Tracking, kein Persistieren ohne Wahl).
 */
export async function getActiveCurrency(): Promise<Currency> {
  const chosen = (await cookies()).get(CURRENCY_COOKIE)?.value;
  if (isCurrency(chosen)) return chosen;
  const country = (await headers()).get("x-vercel-ip-country") ?? "";
  return currencyForCountry(country);
}
