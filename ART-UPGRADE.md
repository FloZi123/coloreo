# Malbuch-Qualität: Upgrade-Plan (VERSCHOBEN auf später)

Status: **pausiert** — Florian arbeitet zuerst an Logo & Brand.
Voraussetzung für Start: `ANTHROPIC_API_KEY` (für die Motivgenerierung) + Budget ~$23 (Replicate, flux-dev).

## Beschlossene Einstellungen (im Test bestätigt)

| Thema | Entscheidung |
|---|---|
| **Modell (Seiten)** | `black-forest-labs/flux-dev` — sauberer & günstiger als pro. Opts: `num_inference_steps:30, guidance:3.5, megapixels:"1"`, `aspect_ratio:"3:4"` |
| **Schwierigkeit** | Automatisch nach `audience`: **Erwachsene** = „intricate, highly detailed, ornate decorative patterns, fine delicate linework, zentangle style"; **Kinder** = „very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children" |
| **Basis-Prompt** | „coloring book page, black and white line art, clean bold black outlines, no shading, no grayscale, no color, pure white background, full page illustration, " |
| **Motiv-Vielfalt** | **Claude erzeugt 24 einzigartige Motive je Buch** (1 Anfrage/Buch) → keine Wiederholungen. Braucht `ANTHROPIC_API_KEY`. |
| **S/W-Bereinigung** | `sharp(img).grayscale().threshold(140)` → dünne, druckreine Linien (vom Florian gewählt: „dünnere Linien"). |
| **Cover** | **Stil B – teilkoloriertes Linienkunst-Cover**: Prompt „coloring book style illustration of <Motiv>, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, white background, no text" → + Coloreo-Branding-Overlay (Logo/Titel/Kategorie). Modell flux-1.1-pro für Cover optional. |
| **Rollout** | Tendenz: erst **1 komplettes Buch** final zeigen → Freigabe → dann die übrigen 48. (offen, bei Wiederaufnahme bestätigen) |

## Umsetzung bei Wiederaufnahme
- `src/lib/generator/thematic.ts`: Difficulty nach audience + Binarisierung (sharp threshold) nach Replicate-Output einbauen; Motiv-Pools durch Claude-Generierung ersetzen.
- Cover: neuer Generator (Stil B) + Branding-Overlay → ersetzt prozedurale Cover; cover_url aktualisieren.
- Batch-Skripte `gen:thematic` / `process-masters` entsprechend anpassen, dann neu laufen lassen.
- Referenz-Prototyp der Test-Logik: `scripts/_quality-test.mjs`.
