import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { watermarkPdf } from "../src/lib/pdf";

for (const l of readFileSync(".env.local", "utf8").split("\n")) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
}

async function main() {
  const slug = process.argv[2] ?? "unterwasser-korallenriff";
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const { data, error } = await sb.storage.from("books").download(`${slug}.pdf`);
  if (error || !data) throw new Error("Master-Download fehlgeschlagen: " + error?.message);
  const master = new Uint8Array(await data.arrayBuffer());
  const stamped = await watermarkPdf(master, { email: "kunde@beispiel.de", orderNumber: "CO-DEMO-0001" });

  const localName = `KUNDEN-PDF-${slug}.pdf`;
  writeFileSync(localName, Buffer.from(stamped));

  const path = `_demo/${slug}.pdf`;
  await sb.storage.from("downloads").upload(path, Buffer.from(stamped), { contentType: "application/pdf", upsert: true });
  const { data: signed } = await sb.storage.from("downloads").createSignedUrl(path, 60 * 60 * 6);

  console.log("LOCAL:", localName, `(${(stamped.length / 1024 / 1024).toFixed(1)} MB)`);
  console.log("SIGNED_URL:", signed?.signedUrl ?? "(keine)");
}
main().catch((e) => { console.error("FEHLER:", e instanceof Error ? e.message : e); process.exit(1); });
