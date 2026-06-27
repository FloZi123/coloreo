import { PostHog } from "posthog-node";

let client: PostHog | null = null;
function ph(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;
  if (!client) client = new PostHog(key, { host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com" });
  return client;
}

/** Serverseitiges Event (z. B. purchase_completed aus dem Webhook – verlässlich, ohne PII-Cookies). */
export async function captureServer(distinctId: string, event: string, properties?: Record<string, unknown>): Promise<void> {
  const c = ph();
  if (!c) return;
  try {
    c.capture({ distinctId, event, properties });
    await c.flush();
  } catch {
    /* Analytics darf den Kauf-Flow nie blockieren */
  }
}
