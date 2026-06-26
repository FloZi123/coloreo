import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Admin-Client mit Service-Role-Key. NUR serverseitig verwenden
 * (API-Routes, Server Actions, Webhooks). Umgeht RLS.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || key.startsWith("PLACEHOLDER")) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY fehlt. Bitte in .env.local / Vercel eintragen (Supabase Dashboard -> Settings -> API)."
    );
  }
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
