type Bucket = { count: number; resetAt: number };
const store = new Map<string, Bucket>();

/**
 * Einfaches In-Memory Fixed-Window-Rate-Limit (pro Server-Instanz).
 * Für Vercel mit mehreren Instanzen nur Basisschutz – für harte Limits einen
 * zentralen Store (z. B. Upstash/Supabase) verwenden.
 */
export function rateLimit(key: string, max = 10, windowMs = 60_000): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const b = store.get(key);
  if (!b || b.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  b.count++;
  if (b.count > max) return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  return { ok: true, retryAfter: 0 };
}

/** Client-IP aus den üblichen Proxy-Headern. */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/** Gibt eine 429-fähige Antwort zurück, oder null wenn erlaubt. */
export function limited(req: Request, name: string, max: number, windowMs = 60_000) {
  const { ok, retryAfter } = rateLimit(`${name}:${clientIp(req)}`, max, windowMs);
  return ok ? null : retryAfter;
}
