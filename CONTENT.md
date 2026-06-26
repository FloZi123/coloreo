# Content-Pipeline (Malbücher)

## Was bereits real erzeugt ist
- **48 Cover** (alle Bücher): prozedurale Linienkunst-Mandalas, pro Kategorie eingefärbt,
  gebrandet, mit Titel. → `public/covers/<slug>.svg`, in DB `books.cover_url`.
- **10 echte Mal-PDFs** (24 Seiten, druckfertig A4) für die muster-freundlichen Kategorien
  Mandalas, Geometrisch, Paisley/Henna, Japan/Zen, Blumen/Botanik.
  → `public/masters/<slug>.pdf`, in DB `books.pdf_path`.

Regenerieren:
```
npm run gen:covers
npm run gen:masters
```

## Architektur
- `scripts/lib-art.mjs` – deterministischer Geometrie-Generator (seed = Slug) für Mandalas/Muster.
  Liefert SVG-Pfade, die sowohl als Cover-SVG als auch via `pdf-lib.drawSvgPath` ins PDF gezeichnet werden.
- `src/lib/pdf.ts` – lädt das Master-PDF (`pdf_path` als Storage-Pfad **oder** URL/Public-Pfad),
  prägt das personalisierte Wasserzeichen ein und legt das Käufer-PDF im `downloads`-Bucket ab.

## Repräsentative Motive (Tiere, Fantasy, Kinder etc.)
Prozedural nicht sinnvoll abbildbar. Vorgesehener Einschub: ein **Bild-Provider** (z. B. Adobe Firefly,
Replicate, OpenAI Images) erzeugt Linienkunst-Seiten, die identisch zur PDF montiert werden.
Andockpunkt: eine `generatePages(book)`-Funktion, die statt `mandalaPaths` Bild-URLs liefert; der
PDF-Zusammenbau bleibt gleich. Bis dahin liefern diese Bücher beim Kauf ein klar gekennzeichnetes
Platzhalter-PDF (siehe `getMasterPdfBytes`-Fallback) – Cover sind bereits real.

## Auto-Generierung (Phase 6)
Die Auto-Gen-Engine nutzt dieselbe Pipeline: erkanntes Trend-Thema → Buch-Entwurf (Titel/Texte via
Claude) + Cover/Seiten via Generator → Status `draft_ready` → Freigabe durch Florian im Admin.
