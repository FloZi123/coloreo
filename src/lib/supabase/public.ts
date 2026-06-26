import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/** Cookie-freier Read-Only-Client für öffentliche Katalogdaten (RLS: published/active). */
export function createPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}
