# Coloreo — Mood-Bilder-Portfolio (8 fotorealistische Replicate-Prompts)

> Stand: 2026-06-27 · Für die Website von Coloreo (digitaler Malbuch-Shop).
> Ziel: 8 zusammenhängende, fotorealistische Stimmungsbilder als eine Bildwelt —
> warm, cozy, Anti-Stress (Erwachsene) + hell, fröhlich (Familie). Generiert via Replicate.

---

## 0. Modell & globale Einstellungen (wichtig)

Euer Shop nutzt für Linienkunst `black-forest-labs/flux-schnell`. Für **fotorealistische
Mood-Fotos** ist das zu flach. Empfehlung:

- **Modell:** `black-forest-labs/flux-1.1-pro` (beste Fotoqualität) **oder** `black-forest-labs/flux-dev`
  (günstiger, sehr gut). Beide auf Replicate verfügbar.
- **Parameter (flux-dev):** `num_inference_steps: 40`, `guidance: 3`, `output_format: "png"` (oder
  `"webp"` fürs Web), `prompt_strength`/`megapixels: "1"`. Bei `flux-1.1-pro` Parameter analog,
  zusätzlich `output_quality: 90`.
- **Seitenverhältnis (`aspect_ratio`)** pro Bild unten angegeben — nicht global überschreiben.
- **Kein Negative-Prompt:** Flux (schnell/dev/pro) hat **keinen** `negative_prompt`-Parameter.
  Unerwünschtes wird **positiv** weggeschrieben (z. B. "clean uncluttered surface" statt "no clutter").
  Die "Vermeiden"-Liste je Bild ist als Formulierungs- und QA-Hilfe gedacht. Wer echte Negativ-Prompts
  braucht, müsste auf ein SDXL-Modell wechseln.
- **Konsistente Bildwelt** — diese Bausteine stecken in **jedem** Prompt:
  - **Stil:** `photorealistic, high-end lifestyle photography, shot on a 50mm lens, shallow depth of field, natural soft light`
  - **Farbwelt (Coloreo-CI):** `warm cozy color palette, soft violet and coral accents, warm gold highlights, cream paper-white background tones`
  - **Stimmung:** `calm, inviting, wholesome, hygge atmosphere`
  - **Sauberkeit:** `no text, no watermark, no logos, no visible brand names`
- **Gesichter:** Bewusst Hände, Über-die-Schulter- oder angeschnittene Perspektiven — vermeidet
  "uncanny" KI-Gesichter und ist DSGVO-/Likeness-unkritisch. Wo Personen vorkommen: generisch,
  nicht prominent im Fokus.
- **Wasserzeichen-Hinweis:** Diese Bilder zeigen *fertig ausgemalte* Seiten als Sympathieträger —
  sie sind **Marketing-Mood**, nicht die wasserzeichengeschützten Produkt-Previews.

---

## 1. Die 8 Mood-Bilder

### Bild 1 — Hero (Anti-Stress, Erwachsene)
- **Einsatz:** Startseiten-Hero, große Bühne hinter Headline & CTAs.
- **Seitenverhältnis:** `16:9` (`aspect_ratio: "16:9"`)
- **Prompt:**
  `photorealistic high-end lifestyle photography, a woman's hands holding a colored pencil, coloring an intricate half-finished mandala in an open coloring book on a light wooden desk, a cup of coffee and a small potted plant beside it, soft morning sunlight through a window, shot on a 50mm lens, shallow depth of field, warm cozy color palette, soft violet and coral accents, warm gold highlights, cream paper-white background tones, calm inviting wholesome hygge atmosphere, no text, no watermark, no logos`
- **Vermeiden (QA):** abgeschnittene/verformte Finger, sichtbarer Text auf der Seite, grelles Licht,
  unruhiger Hintergrund.

### Bild 2 — Flat-Lay Produktstimmung (top-down)
- **Einsatz:** Sektion "beliebte Bücher" / Über-uns / Trust-Bar-Hintergrund.
- **Seitenverhältnis:** `4:5` (`aspect_ratio: "4:5"`)
- **Prompt:**
  `photorealistic top-down flat lay photography, an open coloring book showing a beautifully colored floral mandala page, a neat row of colored pencils fanned out, a few loose pencil shavings, a small ceramic mug, arranged on a cream paper-white desk surface, soft even natural light, shot from directly above, warm cozy color palette, soft violet coral and gold accents, calm wholesome aesthetic, clean uncluttered composition, no text, no watermark, no logos`
- **Vermeiden (QA):** Text/Schrift, schiefe Perspektive (muss exakt top-down sein), zu viele Objekte.

### Bild 3 — Cozy Abend (Entspannung)
- **Einsatz:** Freebie-/Newsletter-Sektion, "Anti-Stress"-Story, Bundles-Teaser.
- **Seitenverhältnis:** `3:2` (`aspect_ratio: "3:2"`)
- **Prompt:**
  `photorealistic cozy lifestyle photography, a person relaxing on a soft sofa under a knitted blanket, a coloring book and colored pencils on their lap, a steaming cup of tea on a side table, a warm glowing table lamp, a candle and houseplants in the softly blurred background, evening hygge mood, shot on a 50mm lens, shallow depth of field, warm cozy color palette, soft violet and gold tones, calm intimate wholesome atmosphere, face out of focus, no text, no watermark, no logos`
- **Vermeiden (QA):** scharfes/verzerrtes Gesicht im Fokus, kühles Licht, Unordnung.

### Bild 4 — Familie & Kinder (helle Säule)
- **Einsatz:** Kinder-/Familien-Kategorie-Banner, Welt "Kleine Entdecker".
- **Seitenverhältnis:** `3:2` (`aspect_ratio: "3:2"`)
- **Prompt:**
  `photorealistic candid family lifestyle photography, a young child coloring a bright cute animal page in a coloring book at a kitchen table, scattered chunky crayons and colored pencils in vibrant colors, a parent's hands gently helping in the frame, bright cheerful daylight, shot on a 35mm lens, shallow depth of field, fresh playful color palette with coral mint and gold accents, warm joyful wholesome atmosphere, child seen from the side or above, no text, no watermark, no logos`
- **Vermeiden (QA):** verzerrte Kindergesichter (eher von oben/seitlich/Hände), düsteres Licht.

### Bild 5 — Makro / Detail (Textur-Banner)
- **Einsatz:** schmaler Trennbanner zwischen Sektionen, Kategorie-Header-Hintergrund.
- **Seitenverhältnis:** `16:9` (`aspect_ratio: "16:9"`)
- **Prompt:**
  `photorealistic extreme close-up macro photography, the sharp tip of a violet colored pencil mid-stroke filling a section of a black-and-white line-art coloring page, fine paper texture visible, a soft blur of colorful pencils in the background, dramatic shallow depth of field, natural soft light, warm cozy color palette with violet coral and gold, calm tactile premium feel, no text, no watermark, no logos`
- **Vermeiden (QA):** lesbarer Text auf der Seite, flaches Licht, kein erkennbarer Schärfepunkt.

### Bild 6 — USP "Digital → druckfertig"
- **Einsatz:** Trust-/USP-Sektion ("Sofort-Download · druckfertig"), Erklär-Block.
- **Seitenverhältnis:** `4:3` (`aspect_ratio: "4:3"`)
- **Prompt:**
  `photorealistic lifestyle photography, a freshly printed coloring book page with crisp black line art resting on a desk next to a home inkjet printer and an open laptop, a tidy stack of blank paper, a few colored pencils ready beside it, bright clean home-office light, shot on a 50mm lens, shallow depth of field, warm cozy color palette with subtle violet accents, modern wholesome reassuring mood, screens and paper showing no readable text, no watermark, no logos`
- **Vermeiden (QA):** lesbare UI-Texte/Marken auf Laptop/Drucker, chaotischer Schreibtisch.

### Bild 7 — Outdoor / Café (Lifestyle, Fernweh)
- **Einsatz:** Lifestyle-/Story-Sektion, Social-Header, "überall dabei".
- **Seitenverhältnis:** `3:2` (`aspect_ratio: "3:2"`)
- **Prompt:**
  `photorealistic outdoor lifestyle photography, a coloring book and a small tin of colored pencils on a rustic café table next to a latte, dappled sunlight through green leaves, a softly blurred summer garden background, relaxed weekend mood, shot on a 50mm lens, shallow depth of field, warm cozy color palette with coral gold and mint, airy wholesome inviting atmosphere, no text, no watermark, no logos`
- **Vermeiden (QA):** harte Mittagsschatten, Text auf Tassen/Schildern, überladener Hintergrund.

### Bild 8 — Geschenk / Hygge (Saison & Social)
- **Einsatz:** Geschenk-/Saison-Aktionen, Bundle-Geschenkidee, Instagram/Pinterest-Kachel.
- **Seitenverhältnis:** `4:5` (`aspect_ratio: "4:5"`)
- **Prompt:**
  `photorealistic cozy flat lay photography, a coloring book tied with a soft ribbon presented as a gift, surrounded by colored pencils, a lit candle, a sprig of eucalyptus, a warm mug, and a folded knit blanket, on a cream linen surface, soft warm window light, top-down slightly angled view, warm cozy color palette with violet coral and gold accents, gift-worthy hygge wholesome mood, no text, no watermark, no logos`
- **Vermeiden (QA):** Text/Etiketten, kalte Farben, zu symmetrisch-steril.

---

## 2. Einsatz-Übersicht

| # | Thema | Zielgruppe | Ratio | Hauptplatzierung |
|---|-------|-----------|-------|------------------|
| 1 | Hero, Hände am Mandala | Erwachsene | 16:9 | Startseiten-Hero |
| 2 | Flat-Lay Produktstimmung | Erwachsene | 4:5 | Beliebte Bücher / Trust |
| 3 | Cozy Abend auf dem Sofa | Erwachsene | 3:2 | Freebie / Newsletter |
| 4 | Familie & Kind | Kinder/Familie | 3:2 | Kinder-Kategorie-Banner |
| 5 | Makro Stift & Linie | neutral | 16:9 | Sektions-Trennbanner |
| 6 | Digital → druckfertig | neutral | 4:3 | USP / Trust-Sektion |
| 7 | Outdoor / Café | Erwachsene | 3:2 | Lifestyle / Social-Header |
| 8 | Geschenk / Hygge | Familie/Erwachsene | 4:5 | Saison / Social-Kachel |

## 3. Tipps für Konsistenz & Qualität

- **Eine Bildsprache:** Die fixen Stil-/Farb-/Stimmungs-Bausteine (Abschnitt 0) in **jedem** Prompt
  unverändert lassen — so wirken alle 8 wie aus einem Shooting.
- **Seeds notieren:** Gelungene Ergebnisse über den Replicate-`seed` festhalten; Varianten durch
  `seed`-Wechsel bei gleichem Prompt erzeugen.
- **2–3 Generierungen pro Bild** und das beste auswählen; bei Händen/Gesichtern lieber neu würfeln
  als nachbessern.
- **Web-Export:** Final als `webp` (Qualität ~82) für schnelle Ladezeiten; Hero ggf. zusätzlich als
  hochauflösendes `png`.
- **Barrierefreiheit:** Sprechende `alt`-Texte vergeben (die Bilder selbst tragen bewusst keinen Text).
- **Rechtliches:** Keine echten Personen/Marken/urheberrechtlich geschützten Motive — alle Prompts
  sind generisch gehalten. Vor Go-Live AI-Bildnutzung mit euren Bildrechte-Vorgaben abgleichen.
