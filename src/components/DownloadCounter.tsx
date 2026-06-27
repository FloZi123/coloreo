import { createAdminClient } from "@/lib/supabase/admin";

interface Props {
  locale: string;
}

async function getDownloadCount(): Promise<number> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("download_count");
    if (error) return 0;
    return Number(data ?? 0);
  } catch {
    return 0;
  }
}

const labels: Record<string, { text: (n: number) => string }> = {
  de: { text: (n) => `Bereits ${n.toLocaleString("de-DE")} kostenlose Vorlagen heruntergeladen` },
  en: { text: (n) => `${n.toLocaleString("en-GB")} free templates downloaded so far` },
  fr: { text: (n) => `${n.toLocaleString("fr-FR")} modèles gratuits téléchargés` },
  es: { text: (n) => `${n.toLocaleString("es-ES")} plantillas gratuitas descargadas` },
  it: { text: (n) => `${n.toLocaleString("it-IT")} modelli gratuiti scaricati` },
  nl: { text: (n) => `${n.toLocaleString("nl-NL")} gratis sjablonen gedownload` },
};

export default async function DownloadCounter({ locale }: Props) {
  const count = await getDownloadCount();
  if (!count || count <= 0) return null;

  const entry = labels[locale] ?? labels["en"];
  const text = entry.text(count);

  return (
    <div className="flex items-center justify-center gap-2 text-sm font-semibold text-muted">
      <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full text-xs text-white" style={{ background: "var(--color-success)" }}>
        ↓
      </span>
      <span>{text}</span>
    </div>
  );
}
