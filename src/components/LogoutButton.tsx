"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export default function LogoutButton({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const router = useRouter();
  async function logout() {
    await createClient().auth.signOut();
    router.refresh();
  }
  return (
    <button onClick={logout} className="rounded-full border px-4 py-2 text-sm font-semibold hover:border-primary">
      {dict.account.signOut}
    </button>
  );
}
