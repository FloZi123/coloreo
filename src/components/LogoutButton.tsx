"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Locale } from "@/i18n/config";

export default function LogoutButton({ locale }: { locale: Locale }) {
  const router = useRouter();
  async function logout() {
    await createClient().auth.signOut();
    router.refresh();
  }
  return (
    <button onClick={logout} className="rounded-full border px-4 py-2 text-sm font-semibold hover:border-primary">
      {locale === "de" ? "Abmelden" : "Sign out"}
    </button>
  );
}
