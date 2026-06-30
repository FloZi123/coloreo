# Malbuch-Konzept "Coloreo" — Kategorien, Bücher & Replicate-Generierung

> Stand: 2026-06-27 · Konzept-Überarbeitung für Florian Zinkl
> Ersetzt die bisherige Kategorien-/Buchstruktur. Basis: Trend-Recherche 2025/2026
> (Amazon KDP, Etsy, TikTok/Pinterest). Story-Prinzip: **Visuelle Reise** (narrativ).

---

## Story- & Varianz-Regel

**Verbindlicher Autoren-Standard für JEDES Buch.** Jedes Buch ist eine durchgehende visuelle
Reise (Aufbruch → Abenteuer → Höhepunkt → Rückkehr) innerhalb **eines** Themas — keine Reihung
desselben Motivs. Themen werden nicht gemischt; der Hebel ist Szenen-Vielfalt + ein klarer
Erzählbogen. Geprüft maschinell durch `scripts/validate-stories.ts` (muss `PASS 72/72` melden):

1. **Umfang:** 15–20 Motive in der Motiv-Liste.
2. **Keine Dubletten:** kein Motiv doppelt (case-insensitive, getrimmt).
3. **Erzählbogen:** Das letzte Motiv unterscheidet sich vom ersten **und** markiert einen Abschluss
   (Heimkehr/Ausklang) — enthält eines von: `sunset, back, home, nest, together, all the,
   end of the day, zurück, abend, sicher`.
4. **Szenen-Vielfalt:** Mindestens **70 %** unterschiedliche Anfangs-Subjekte (kein Buch, das jede
   Seite mit demselben Wort/derselben Figur beginnt) **und** mindestens **3 verschiedene
   Schauplatz-/Orts-Begriffe** (z. B. cave, river, jungle, lake, hill, forest, meadow, castle,
   garden, reef, …) über die Motive verteilt.
5. **Kein flacher Titel:** Kein bloßes Objekt-Paar „X und Y" / „X and Y" ohne Reise-/Story-Wort.
   Solche Titel werden in reisehafte Titel geschärft (z. B. „Dinos und Vulkane" → „Das große
   Vulkan-Abenteuer"). Der **Slug bleibt** dabei unverändert (DB/SEO-stabil).

Neue oder auto-generierte Bücher müssen diese Regeln erfüllen, bevor sie in den Katalog gehen.

---

## 0. Wie dieses Dokument zu lesen ist

Dieses Dokument ist die **vollständige Produktions-Spezifikation**. Pro Buch findest du:

- **Slug, Titel (DE/EN), Zielgruppe, Seitenzahl** — direkt in DB übernehmbar (`books`-Tabelle).
- **Story** — die narrative Klammer ("visuelle Reise"): Die Seiten erzählen Schritt für Schritt
  eine zusammenhängende Geschichte. Das ist das Verkaufs- und Kohäsions-Argument.
- **Beschreibung (DE)** — Verkaufstext für die Produktseite.
- **Motiv-Liste** — geordnete Liste (Seite 1 → n) in **Englisch**. Geht 1:1 in die bestehende
  Pipeline (`SUBJECTS`/`motifsForCategory` in `src/lib/generator/thematic.ts`). Die Reihenfolge
  ist die Story-Reihenfolge.
- **Cover-Prompt** — fertig ausformuliert (Englisch), passend zur Story. Plus `heroMotif`-Token
  für `generateCoverImage()`.
- **Beispiel-Seitenprompts** — 2–3 voll ausformulierte Prompts als Vorlage, damit die
  Linienkunst-Qualität sofort stimmt.

### Wichtig: So funktioniert eure Pipeline (nicht ändern, nur befüllen)

Die Seiten-Prompts werden **automatisch** aus dem Motiv gebaut (`buildMotifPrompt`):

```
[LINEART-PRÄFIX] + [SCHWIERIGKEIT je Zielgruppe] + [MOTIV] + ", " + [VARIATION]
```

- **LINEART-PRÄFIX** (fix):
  `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, `
- **SCHWIERIGKEIT:**
  - `kids` → `very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, ` (= **Bold & Easy**, Top-Trend 2026)
  - `adult` → `intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, `
  - `all` → `clean detailed outlines, balanced level of detail, friendly, `
- **VARIATION** (rotierend): centered composition / full body view / decorative patterned background /
  close-up portrait / small scene with surroundings / surrounded by ornamental flourishes
- **Modell:** `black-forest-labs/flux-schnell`, `aspect_ratio: "3:4"`, `output_format: "png"`.
- Danach **Binarisierung** (`sharp.grayscale().threshold(140)`) → druckreine Schwarz-Weiß-Konturen.

→ **Konsequenz für dieses Konzept:** In der Motiv-Liste steht **nur das Motiv** (kein "coloring book",
kein "line art" — das kommt automatisch davor). Jedes Motiv ist ein kurzer englischer Nominalausdruck.

### Cover-Pipeline (`generateCoverImage`)

Cover-Prompt-Schema (der ganze Satz wird gesendet):

```
coloring book style illustration of [HEROMOTIF], bold black outlines with several areas
filled in bright vibrant colors, half colored half black-and-white line art, playful,
cheerful, white background, no text
```

Pro Buch liefere ich einen **kompletten Cover-Prompt** (so kannst du auch ein anderes Modell direkt
füttern) **und** das `heroMotif`-Token (für die bestehende Funktion). Branding/Titel-Overlay wird
serverseitig drübergelegt — der Cover-Prompt enthält daher **keinen Text**.

---

## 1. Markt- & Trendbasis (Kurzfassung der Recherche)

Worauf die neue Struktur aufbaut — die nachweisbaren Trends 2025/2026:

- **"Bold & Easy" ist der #1-Wachstumstrend.** Dicke, einfache Linien, große Flächen — für
  Einsteiger, Senioren, Anti-Stress. Trägt Preise von 8,99–12,99 $. → Standard-Stil für die
  Kinder-/Einsteiger-Linie; bei Erwachsenen-Kategorien je ein "Sanft & Einfach"-Buch.
- **Cottagecore / Cozy / Hygge** — Pilze, Wildblumen, Hütten, Teeküchen. Eskapismus, Pinterest/TikTok stark, geringe Konkurrenz.
- **Cozy-Character-Journeys (BobbieGoods-Stil)** — niedliche Tierfiguren in gemütlichen Szenen
  (Café, Bäckerei, Pooltag). Viral auf TikTok. **Genau das narrative "visuelle Reise"-Format.**
- **Dark Academia** — Bibliotheken, gotische Architektur, Vintage-Bücher, Statuen, Kerzenlicht. Extrem niedrige Konkurrenz, Premium-Preis.
- **Witchy / Mond & Mystik (#WitchTok)** — Mondphasen, Kräuter, Kristalle, Tarot. Passionierte Käufer.
- **Zodiac / Astrologie** — 12 Zeichen = Serien-Potenzial.
- **Achtsamkeit & Affirmationen** — Wellness-Boom, klinisch gestützt, Premium-Preis.
- **Evergreens mit Nischen-Winkel:** Mandalas, Botanik, Ozean, Schmetterlinge, Japan/Zen.
- **Kinder:** niedliche Tiere & "Party"-Themen (Spitzen-Suchvolumen), Dinos, Fahrzeuge, Weltraum,
  Einhörner, Meerjungfrauen, Bauernhof, Safari, saisonale Feste.
- **Format-Lehre:** Cover zeigt das *fertige* (teilkolorierte) Ergebnis; Serien-Strategie;
  enge Nische schlägt Generik 6:1. → Deshalb hier **Stories statt generischer Motiv-Töpfe**.

Quellen am Dateiende.

---

## 2. Zielgruppen-Logik & Preise

- **Zielgruppen-Mix: 50/50** — 12 Kategorien Erwachsene/Anti-Stress, 12 Kategorien Kinder/Familie.
- **`audience`-Feld:** `adult` (filigran), `kids` (Bold & Easy), `all` (mittel — familientauglich).
- **Seitenzahl pro Buch: 15–20** (laut Vorgabe). Empfehlung: Erwachsene 18–20, Kinder 15–16.
- **Preis-Anker (digital, EUR):** Kinder 4,99 € · Familie/all 5,99 € · Erwachsene 6,99 € ·
  Premium-Nische (Dark Academia, Mond/Mystik, Achtsamkeit) 7,99 €.

---

## 3. Kategorien-Überblick (24 Kategorien · je 3 Bücher · 72 Bücher)

**Erwachsene / Anti-Stress (12):**

| # | Slug | Name (DE) | Name (EN) | Audience | Status |
|---|------|-----------|-----------|----------|--------|
| A1 | `mandala-meditation` | Mandala & Meditation | Mandala & Meditation | adult | behalten★ |
| A2 | `botanischer-garten` | Botanischer Garten | Botanical Garden | adult | behalten |
| A3 | `cottagecore` | Cottagecore & Hygge | Cottagecore & Hygge | adult | NEU |
| A4 | `dark-academia` | Dark Academia | Dark Academia | adult | NEU |
| A5 | `mond-mystik` | Mond, Magie & Mystik | Moon, Magic & Mystic | adult | NEU |
| A6 | `sternzeichen-kosmos` | Sternzeichen & Kosmos | Zodiac & Cosmos | adult | NEU |
| A7 | `japan-zen` | Japan & Zen | Japan & Zen | adult | behalten |
| A8 | `gothic-skulls` | Gothic & Sugar Skulls | Gothic & Sugar Skulls | adult | behalten |
| A9 | `achtsamkeit-affirmationen` | Achtsamkeit & Affirmationen | Mindfulness & Affirmations | adult | behalten+ |
| A10 | `vintage-steampunk` | Vintage & Steampunk | Vintage & Steampunk | adult | behalten |
| A11 | `unterwasserwelt` | Unterwasserwelt | Underwater World | adult | behalten |
| A12 | `schmetterlinge-libellen` | Schmetterlinge & Libellen | Butterflies & Dragonflies | adult | behalten |

**Kinder / Familie (12):**

| # | Slug | Name (DE) | Name (EN) | Audience | Status |
|---|------|-----------|-----------|----------|--------|
| K1 | `niedliche-tiere` | Niedliche Tiere | Cute Animals | kids | behalten |
| K2 | `gemuetliche-freunde` | Gemütliche Freunde | Cozy Friends | all | NEU★ |
| K3 | `dino-welt` | Dino-Welt | Dino World | kids | behalten |
| K4 | `fahrzeuge-maschinen` | Fahrzeuge & Maschinen | Vehicles & Machines | kids | behalten |
| K5 | `weltraum-planeten` | Weltraum & Planeten | Space & Planets | kids | behalten |
| K6 | `einhoerner-regenbogen` | Einhörner & Regenbogen | Unicorns & Rainbows | kids | behalten |
| K7 | `zauberwald-feen` | Zauberwald & Feen | Enchanted Forest & Fairies | all | behalten |
| K8 | `meerjungfrauen` | Meerjungfrauen & Meereszauber | Mermaids & Ocean Magic | kids | NEU |
| K9 | `bauernhof` | Bauernhof & Tierfreunde | Farm & Animal Friends | kids | NEU |
| K10 | `kawaii-food` | Kawaii Food & Süßes | Kawaii Food & Sweets | all | behalten |
| K11 | `dschungel-safari` | Dschungel & Safari | Jungle & Safari | kids | NEU |
| K12 | `jahreszeiten-feste` | Jahreszeiten & Feste | Seasons & Festivities | all | behalten |

★ = Trag­säule. **Ersetzt** wurden die schwächeren Alt-Kategorien `geometrisch`, `paisley-henna`,
`fashion`, `staedte`, `abc-zahlen`, `fantasy-drachen` (in `mond-mystik`/`zauberwald` aufgegangen)
durch die recherchierten Trend-Kategorien.

---

# TEIL I — ERWACHSENE / ANTI-STRESS

## A1 · Mandala & Meditation  (`mandala-meditation`, adult)

> Evergreen-Tragsäule. Winkel: Mandalas als *meditative Tagesreise* statt loser Sammlung.
> Diese Kategorie kann teils prozedural (bestehender `lib-art.mjs`) und teils via Replicate laufen.

### Buch 1 — "Reise durch den Tag" / "A Journey Through the Day"
- **Slug:** `mandala-reise-durch-den-tag` · **Audience:** adult · **Seiten:** 20 · **Preis:** 6,99 €
- **Story:** Vom ersten Sonnenstrahl bis zum Sternenhimmel — jedes Mandala fängt eine Tagesstunde ein.
  Wer Seite für Seite ausmalt, atmet sich einmal durch einen ganzen achtsamen Tag.
- **Beschreibung (DE):** 20 filigrane Mandalas, die den Bogen von Sonnenaufgang bis Mitternacht
  spannen. Feine Zentangle-Linien, von zart-luftig am Morgen bis dicht-funkelnd in der Nacht.
  Ideal zum Runterkommen nach Feierabend.
- **heroMotif (Cover):** `an intricate sunrise mandala with radiating sun rays and lotus petals`
- **Cover-Prompt:** `coloring book style illustration of an intricate sunrise mandala with radiating sun rays and lotus petals, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→20):**
  1. a delicate sunrise mandala with thin radiating rays
  2. a dewdrop mandala with morning leaves
  3. a blooming flower mandala opening up
  4. a songbird mandala with feather patterns
  5. a teacup and steam mandala
  6. a sun-at-its-peak mandala with sharp rays
  7. a butterfly and meadow mandala
  8. a flowing water and ripple mandala
  9. a tree-of-life mandala
  10. a wheat field and breeze mandala
  11. a sunflower mandala facing the sun
  12. an afternoon cloud mandala
  13. a sunset mandala with layered petals
  14. a candle flame mandala
  15. an owl mandala with night feathers
  16. a crescent moon mandala
  17. a star cluster mandala
  18. a dreamcatcher-style mandala
  19. a galaxy spiral mandala
  20. a deep-night mandala with dense stars and moon, and finally everything comes back together
- **Beispiel-Seitenprompts:**
  - *Seite 1:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, a delicate sunrise mandala with thin radiating rays, centered composition`
  - *Seite 15:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, an owl mandala with night feathers, surrounded by ornamental flourishes`

### Buch 2 — "Sanfte Kreise" / "Gentle Circles" (Bold & Easy)
- **Slug:** `mandala-sanfte-kreise` · **Audience:** all · **Seiten:** 16 · **Preis:** 5,99 €
- **Story:** Große, ruhige Mandalas mit dicken Linien — eine entschleunigte Reise von der einfachsten
  Blütenform bis zum vollen Kreis. Für Einsteiger, Senioren und alle, die filigrane Muster überfordern.
- **Beschreibung (DE):** 16 Bold-&-Easy-Mandalas mit großen Flächen und klaren, dicken Konturen.
  Stressfrei auszumalen, perfekt für ruhige Abende oder als Geschenk für die Großeltern.
- **heroMotif (Cover):** `a bold simple flower mandala with thick clean outlines and large petals`
- **Cover-Prompt:** `coloring book style illustration of a bold simple flower mandala with thick clean outlines and large petals, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a soft circle mandala surrounded by soft clouds
  2. a gentle ripple mandala framed by garden leaves
  3. a lotus mandala beside still water
  4. a crescent-moon mandala under a crescent moon
  5. a wave mandala ringed by tiny stars
  6. a petal mandala over a calm meadow
  7. a spiral mandala by a quiet pond
  8. a feather mandala in the morning sky
  9. a bubble mandala surrounded by soft clouds
  10. a leaf mandala framed by garden leaves
  11. a star mandala beside still water
  12. a seashell mandala under a crescent moon
  13. a cloud mandala ringed by tiny stars
  14. a sunburst mandala over a calm meadow
  15. a rose mandala by a quiet pond
  16. the whole gentle mandala scene coming back together at sunset
- **Beispiel-Seitenprompts:**
  - *Seite 1:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, a simple six-petal flower mandala, thick lines, centered composition`
  - *Seite 10:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, a simple lotus mandala, with a decorative patterned background`

### Buch 3 — "Mandalas der vier Elemente" / "Mandalas of the Four Elements"
- **Slug:** `mandala-vier-elemente` · **Audience:** adult · **Seiten:** 20 · **Preis:** 6,99 €
- **Story:** Eine Reise durch Erde, Wasser, Feuer und Luft — je fünf Mandalas pro Element, vom
  festen Kristall bis zum wirbelnden Wind. Vier Stimmungen, ein zusammenhängender Bogen.
- **Beschreibung (DE):** 20 anspruchsvolle Mandalas, in vier elementare Kapitel gegliedert.
  Erdige Wurzelmuster, fließende Wellen, lodernde Flammen, luftige Federn — meditatives Ausmalen
  mit Konzept.
- **heroMotif (Cover):** `an intricate mandala split into earth water fire and air quarters`
- **Cover-Prompt:** `coloring book style illustration of an intricate mandala split into earth water fire and air quarters, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→20):**
  1. an earth mandala with roots and crystals
  2. a stone and pebble mandala
  3. a mountain-range mandala
  4. a seed-and-sprout mandala
  5. a forest canopy mandala
  6. a water ripple mandala
  7. an ocean wave mandala
  8. a raindrop and cloud mandala
  9. a river-current spiral mandala
  10. a seashell and coral mandala
  11. a flame mandala with curling fire
  12. a sun-and-ember mandala
  13. a candle and spark mandala
  14. a phoenix-feather mandala
  15. a lightning and heat mandala
  16. a wind-swirl mandala
  17. a feather and breeze mandala
  18. a dandelion-seed mandala
  19. a bird-in-flight mandala
  20. a four-elements unity mandala combining all motifs, and finally everything comes back together
- **Beispiel-Seitenprompts:**
  - *Seite 11:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, a flame mandala with curling fire, surrounded by ornamental flourishes`
  - *Seite 20:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, a four-elements unity mandala combining all motifs, centered composition`

---

## A2 · Botanischer Garten  (`botanischer-garten`, adult)

> Bold-&-Easy-Floral ist laut Recherche ein Spitzen-Sub-Trend. Hier als botanische Spaziergänge.

### Buch 1 — "Ein Tag im Gewächshaus" / "A Day in the Greenhouse"
- **Slug:** `botanik-gewaechshaus` · **Audience:** adult · **Seiten:** 18 · **Preis:** 6,99 €
- **Story:** Ein Rundgang durch ein viktorianisches Gewächshaus — von den Farnen am Eingang über
  die Orchideentische bis zum Seerosenteich unter der Glaskuppel.
- **Beschreibung (DE):** 18 detailreiche botanische Studien, komponiert wie ein Spaziergang durch
  ein altes Gewächshaus. Zarte Adern, üppige Blätter, filigrane Blüten — Botanik-Ausmalen für ruhige Stunden.
- **heroMotif (Cover):** `a lush victorian greenhouse interior with hanging plants and a glass dome`
- **Cover-Prompt:** `coloring book style illustration of a lush victorian greenhouse interior with hanging plants and a glass dome, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→18):**
  1. an ornate greenhouse entrance with iron arch and ferns
  2. a cluster of potted ferns on a wooden bench
  3. a hanging basket of trailing ivy
  4. a tall monstera plant in a clay pot
  5. a shelf of succulents and cacti
  6. an orchid in full bloom on a table
  7. a watering can among flower pots
  8. a climbing rose on a trellis
  9. a row of tulips in terracotta pots
  10. a fig tree branch with broad leaves
  11. a butterfly resting on a fern frond
  12. a vintage botanical workbench with tools
  13. a stack of seed packets and a trowel
  14. a glass terrarium with tiny plants
  15. a lily pond under the glass dome
  16. a water lily with floating pads
  17. a dragonfly over the pond
  18. the full greenhouse view with glass dome and plants, all coming back together as one
- **Beispiel-Seitenprompts:**
  - *Seite 6:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, an orchid in full bloom on a table, close-up portrait`
  - *Seite 15:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, a lily pond under the glass dome, in a small scene with surroundings`

### Buch 2 — "Wildblumenwiese" / "Wildflower Meadow" (Bold & Easy)
- **Slug:** `botanik-wildblumenwiese` · **Audience:** all · **Seiten:** 16 · **Preis:** 5,99 €
- **Story:** Ein langsamer Spaziergang über eine Sommerwiese — von der ersten Mohnblume am Wegrand
  bis zum Strauß, den man am Ende heimträgt. Große, klare Blüten zum entspannten Ausmalen.
- **Beschreibung (DE):** 16 Bold-&-Easy-Wildblumen mit dicken Konturen und großen Flächen. Mohn,
  Kornblume, Margerite, Lavendel — sommerleichtes Ausmalen ohne Gefriemel.
- **heroMotif (Cover):** `a bold simple bouquet of wildflowers with thick outlines`
- **Cover-Prompt:** `coloring book style illustration of a bold simple bouquet of wildflowers with thick outlines, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a poppy bloom over a flower meadow
  2. a daisy cluster in a cottage garden
  3. a cornflower stem by a lily pond
  4. a buttercup patch across a wildflower field
  5. a clover leaf along the hedgerow
  6. a thistle head at the forest edge
  7. a dandelion puff by a quiet stream
  8. a foxglove spire in a sunny grove
  9. a bluebell bunch over a flower meadow
  10. a wild rose in a cottage garden
  11. a fern frond by a lily pond
  12. a grass tuft across a wildflower field
  13. a ladybird on a petal along the hedgerow
  14. a bee on a blossom at the forest edge
  15. a snail on a stalk by a quiet stream
  16. the whole wildflower meadow scene coming back together at sunset
- **Beispiel-Seitenprompts:**
  - *Seite 1:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, a single bold poppy flower, thick outlines, centered composition`
  - *Seite 16:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, a big wildflower bouquet tied with a ribbon, centered composition`

### Buch 3 — "Vom Samen zur Blüte" / "From Seed to Bloom"
- **Slug:** `botanik-samen-zur-bluete` · **Audience:** adult · **Seiten:** 18 · **Preis:** 6,99 €
- **Story:** Die visuelle Reise eines Gartens durch ein ganzes Jahr — vom vergrabenen Samen im Frühling
  über das volle Sommerbeet bis zu den Samenständen im Herbst, bereit für den nächsten Zyklus.
- **Beschreibung (DE):** 18 botanische Seiten, die das Werden und Vergehen im Garten erzählen.
  Keimling, Knospe, volle Blüte, Frucht, Samenstand — meditatives Naturstudium mit feiner Linienführung.
- **heroMotif (Cover):** `an intricate botanical illustration of a plant life cycle from seed to flower`
- **Cover-Prompt:** `coloring book style illustration of an intricate botanical illustration of a plant life cycle from seed to flower, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→18):**
  1. a seed packet and scattered seeds on soil
  2. a tiny sprout breaking through the ground
  3. a seedling with first two leaves
  4. a young plant with a forming bud
  5. a tulip bud about to open
  6. a half-opened rose
  7. a fully bloomed peony
  8. a flower bed in full summer bloom
  9. a bee pollinating a blossom
  10. a sunflower turning to the sun
  11. a flower with a visiting butterfly
  12. a wilting flower dropping petals
  13. a seed head of a dandelion
  14. a poppy seed pod
  15. dried allium seed spheres
  16. autumn leaves and fallen petals
  17. seeds being carried by the wind
  18. a full garden scene through all seasons, all coming back together as one
- **Beispiel-Seitenprompts:**
  - *Seite 7:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, a fully bloomed peony, close-up portrait`
  - *Seite 13:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, a seed head of a dandelion, surrounded by ornamental flourishes`

---

## A3 · Cottagecore & Hygge  (`cottagecore`, adult)

> NEU. Top-Trend mit niedriger Konkurrenz. Cozy Eskapismus, Pinterest/TikTok-stark.

### Buch 1 — "Tag im Landhaus" / "A Day at the Cottage"
- **Slug:** `cottagecore-tag-im-landhaus` · **Audience:** adult · **Seiten:** 18 · **Preis:** 6,99 €
- **Story:** Ein kompletter Tag in einem Cottage am Waldrand — vom Brotbacken am Morgen über das
  Picknick im Garten bis zum Lesen am Kamin, wenn draußen die Glühwürmchen tanzen.
- **Beschreibung (DE):** 18 gemütliche Szenen voller Cottagecore-Charme: rustikale Küche, Wildkräuter,
  Strickkorb, Kaminfeuer. Warmes, eskapistisches Ausmalen für graue Tage.
- **heroMotif (Cover):** `a cozy thatched cottage with a flower garden and smoking chimney`
- **Cover-Prompt:** `coloring book style illustration of a cozy thatched cottage with a flower garden and smoking chimney, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→18):**
  1. a cozy thatched cottage exterior with a garden gate
  2. a rustic kitchen with fresh bread and a rolling pin
  3. a cast-iron stove with a steaming kettle
  4. a windowsill with potted herbs and a cat
  5. a basket of just-picked vegetables
  6. a wooden table set for breakfast with jam jars
  7. a cottage pantry with hanging dried herbs
  8. a knitting basket with yarn and needles
  9. a rocking chair by a crackling fireplace
  10. a flower garden with a picket fence
  11. a wheelbarrow full of pumpkins
  12. a clothesline with linen in the breeze
  13. a picnic blanket under an apple tree
  14. a teapot and scones on a tray
  15. a bookshelf nook with a candle
  16. a hedgehog visiting the garden at dusk
  17. a starry night over the cottage roof
  18. a cozy bed with a quilt and a sleeping cat, and finally everything comes back together
- **Beispiel-Seitenprompts:**
  - *Seite 2:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, a rustic kitchen with fresh bread and a rolling pin, in a small scene with surroundings`
  - *Seite 9:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, a rocking chair by a crackling fireplace, in a small scene with surroundings`

### Buch 2 — "Pilzsammler im Zauberwald" / "Mushroom Foraging" (Bold & Easy)
- **Slug:** `cottagecore-pilzsammler` · **Audience:** all · **Seiten:** 16 · **Preis:** 5,99 €
- **Story:** Ein gemütlicher Streifzug durch den herbstlichen Wald mit dem Sammelkorb — von den ersten
  Fliegenpilzen am Wegrand bis zur dampfenden Pilzsuppe daheim. Große, klare Formen.
- **Beschreibung (DE):** 16 Bold-&-Easy-Seiten rund ums Pilzesammeln: Fliegenpilz, Moos, Sammelkorb,
  Waldhütte. Cozy-Herbststimmung mit dicken, entspannten Linien.
- **heroMotif (Cover):** `a bold cute basket full of mushrooms and autumn leaves`
- **Cover-Prompt:** `coloring book style illustration of a bold cute basket full of mushrooms and autumn leaves, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a toadstool cluster in a sunny meadow
  2. a wicker basket of mushrooms deep in the forest
  3. a chanterelle patch in a cottage garden
  4. a morel mushroom by a little pond
  5. a acorn pile on a green hill
  6. a fern frond beside a stream
  7. a wooden cottage in a forest clearing
  8. a lantern on a stump in a flower grove
  9. a hedgehog with a leaf in a sunny meadow
  10. a squirrel with a nut deep in the forest
  11. a owl on a branch in a cottage garden
  12. a berry bramble by a little pond
  13. a moss-covered log on a green hill
  14. a tiny wildflower beside a stream
  15. a woodland gate in a forest clearing
  16. the whole mushroom forage scene coming back together at sunset
- **Beispiel-Seitenprompts:**
  - *Seite 3:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, a big fly agaric mushroom with a snail, centered composition`
  - *Seite 13:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, a cozy cabin window with steam, in a small scene with surroundings`

### Buch 3 — "Die vier Jahreszeiten am Cottage" / "Four Seasons at the Cottage"
- **Slug:** `cottagecore-vier-jahreszeiten` · **Audience:** adult · **Seiten:** 20 · **Preis:** 7,99 €
- **Story:** Dasselbe kleine Cottage durch ein ganzes Jahr — Frühlingsblüten am Zaun, Sommerernte,
  goldener Herbst, verschneite Stille. Je fünf Seiten pro Jahreszeit, ein runder Kreislauf.
- **Beschreibung (DE):** 20 stimmungsvolle Cottagecore-Szenen, gegliedert in vier Jahreszeiten-Kapitel.
  Detailreich und warm — das Premium-Buch der Kategorie.
- **heroMotif (Cover):** `a cozy cottage shown across four seasons with a wreath of seasonal plants`
- **Cover-Prompt:** `coloring book style illustration of a cozy cottage surrounded by a wreath of seasonal flowers leaves and snow, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→20):**
  1. a spring cottage with blossoming cherry tree
  2. a basket of spring tulips by the door
  3. a nesting bird in the garden hedge
  4. a wheelbarrow of seedlings
  5. a spring picnic with lemonade
  6. a summer cottage with full rose bushes
  7. a vegetable garden in high summer
  8. a sunny porch with a hammock
  9. a jar of fresh-picked berries
  10. a summer evening with fireflies
  11. an autumn cottage with golden leaves
  12. a pumpkin harvest by the fence
  13. a steaming apple pie on the sill
  14. a rake and pile of leaves
  15. an autumn tea on the porch
  16. a winter cottage under snow
  17. a wreath on the cottage door
  18. a fireplace with stockings and a cat
  19. a snowman in the garden
  20. a candlelit cottage window on a snowy night, and finally everything comes back together
- **Beispiel-Seitenprompts:**
  - *Seite 6:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, a summer cottage with full rose bushes, in a small scene with surroundings`
  - *Seite 20:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, a candlelit cottage window on a snowy night, in a small scene with surroundings`

---
## A4 · Dark Academia  (`dark-academia`, adult)

> NEU. Extrem niedrige Konkurrenz, Premium-Preis, Gen-Z/Millennial-Ästhetik. Pairt mit Gothic.

### Buch 1 — "Die alte Bibliothek" / "The Old Library"
- **Slug:** `dark-academia-alte-bibliothek` · **Audience:** adult · **Seiten:** 20 · **Preis:** 7,99 €
- **Story:** Eine nächtliche Wanderung durch eine ehrwürdige Universitätsbibliothek — vom schweren
  Eingangstor über endlose Bücherregale und Globen bis zum Lesesaal, in dem eine einzige Kerze brennt.
- **Beschreibung (DE):** 20 atmosphärische Seiten voller Dark-Academia-Magie: Wendeltreppen,
  Folianten, Tintenfässer, Skelette der Anatomie. Filigrane Linien, melancholisch-elegant.
- **heroMotif (Cover):** `an old gothic library with tall bookshelves a spiral staircase and a candle`
- **Cover-Prompt:** `coloring book style illustration of an old gothic library with tall bookshelves a spiral staircase and a candle, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→20):**
  1. a heavy carved wooden library door with an iron handle
  2. an entrance hall with marble columns
  3. towering bookshelves with a rolling ladder
  4. a spiral staircase winding up between shelves
  5. a reading desk with an open book and candle
  6. a stack of ancient leather-bound tomes
  7. an antique globe on a brass stand
  8. an inkwell and quill with scattered papers
  9. a vintage typewriter on a desk
  10. an arched window with rain outside
  11. a marble bust of a philosopher
  12. a magnifying glass over an old map
  13. a pocket watch and chain on a book
  14. an anatomical skeleton model in a corner
  15. a botanical chart pinned to the wall
  16. a chandelier with dripping candles
  17. a fireplace with two armchairs
  18. a raven perched on a bookshelf
  19. a hidden door behind a bookcase
  20. the grand reading room by candlelight, all coming back together as one
- **Beispiel-Seitenprompts:**
  - *Seite 3:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, towering bookshelves with a rolling ladder, in a small scene with surroundings`
  - *Seite 14:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, an anatomical skeleton model in a corner, close-up portrait`

### Buch 2 — "Botanik & Alchemie" / "Botany & Alchemy"
- **Slug:** `dark-academia-botanik-alchemie` · **Audience:** adult · **Seiten:** 18 · **Preis:** 7,99 €
- **Story:** Das verstaubte Studierzimmer eines viktorianischen Gelehrten — gepresste Pflanzen,
  Glaskolben, geheimnisvolle Notizbücher. Eine Reise durch die Schnittstelle von Wissenschaft und Magie.
- **Beschreibung (DE):** 18 Seiten zwischen Botanik und Alchemie: Herbarien, Destillierkolben,
  Mottenkästen, Mondkarten. Dunkel-elegantes Ausmalen mit feinem Strich.
- **heroMotif (Cover):** `a victorian alchemy desk with glass flasks pressed flowers and old books`
- **Cover-Prompt:** `coloring book style illustration of a victorian alchemy desk with glass flasks pressed flowers and old books, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→18):**
  1. a pressed flower herbarium page
  2. a glass distillation flask with tubes
  3. a shelf of labeled apothecary bottles
  4. a botanical sketch of a fern with notes
  5. an open notebook with diagrams and ink stains
  6. a mortar and pestle with dried herbs
  7. a framed display of moths and butterflies
  8. a candlestick beside a stack of scrolls
  9. a brass microscope on a workbench
  10. a hanging bundle of drying lavender
  11. a star chart with constellations
  12. a crystal specimen on a wooden block
  13. a feather quill and wax seal
  14. an ornate hand mirror and comb
  15. a terrarium with a tiny fern
  16. a skull used as a candle holder with ivy
  17. a moon-phase diagram on parchment
  18. the full cluttered alchemist's desk, and finally everything comes back together
- **Beispiel-Seitenprompts:**
  - *Seite 7:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, a framed display of moths and butterflies, with a decorative patterned background`
  - *Seite 16:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, a skull used as a candle holder with ivy, close-up portrait`

### Buch 3 — "Gotische Architektur" / "Gothic Architecture"
- **Slug:** `dark-academia-gotische-architektur` · **Audience:** adult · **Seiten:** 18 · **Preis:** 7,99 €
- **Story:** Ein Spaziergang durch eine alte Universitätsstadt bei Nacht — vom Torbogen des Campus
  über Kreuzgänge und Kathedralenfenster bis zum Glockenturm über den Dächern.
- **Beschreibung (DE):** 18 architektonische Seiten im Dark-Academia-Stil: Spitzbögen, Maßwerk,
  Wasserspeier, verwitterte Statuen. Für Liebhaber von Symmetrie und Detail.
- **heroMotif (Cover):** `a gothic cathedral facade with rose window and pointed arches`
- **Cover-Prompt:** `coloring book style illustration of a gothic cathedral facade with rose window and pointed arches, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→18):**
  1. a gothic campus gateway with an iron lantern
  2. a stone archway leading to a courtyard
  3. a covered cloister walkway with columns
  4. an ornate rose window with tracery
  5. a row of pointed arch windows
  6. a carved stone gargoyle on a ledge
  7. a weathered statue of a scholar
  8. a vaulted ceiling seen from below
  9. a winding cobblestone street with lamps
  10. an old clock tower face
  11. a heavy studded wooden door
  12. a spiral stone staircase in a tower
  13. an ivy-covered college wall
  14. a fountain in a quiet courtyard
  15. a stained glass window pattern
  16. a bell hanging in the tower
  17. rooftops and spires under the moon
  18. the full cathedral facade at night, all coming back together as one
- **Beispiel-Seitenprompts:**
  - *Seite 4:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, an ornate rose window with tracery, centered composition`
  - *Seite 6:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, a carved stone gargoyle on a ledge, close-up portrait`

---

## A5 · Mond, Magie & Mystik  (`mond-mystik`, adult)

> NEU. #WitchTok, passionierte Käuferschaft, Premium-Preis. Nimmt Teile von "fantasy-drachen" auf.

### Buch 1 — "Die Reise der Mondphasen" / "Journey of the Moon Phases"
- **Slug:** `mystik-mondphasen` · **Audience:** adult · **Seiten:** 20 · **Preis:** 7,99 €
- **Story:** Ein voller Mondzyklus als visuelle Reise — von der dunklen Neumondnacht über die
  wachsende Sichel bis zum strahlenden Vollmond und zurück, begleitet von Kräutern, Kristallen und Sternen.
- **Beschreibung (DE):** 20 mystische Seiten rund um Mond, Kräuter und Kristalle. Mondphasen-Räder,
  Kräuterhexen-Stillleben, Sternbilder. Feine, magische Linienkunst für ruhige Ritualabende.
- **heroMotif (Cover):** `an ornate crescent moon with stars herbs and crystals`
- **Cover-Prompt:** `coloring book style illustration of an ornate crescent moon with stars herbs and crystals, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→20):**
  1. a new moon night with scattered stars
  2. a thin waxing crescent moon with a face
  3. a moon phase wheel diagram
  4. a hand holding a glowing crystal under the moon
  5. a bundle of dried sage and herbs
  6. an ornate first-quarter moon with patterns
  7. a celestial sun and moon entwined
  8. a tarot-style hand with a moth
  9. a waxing gibbous moon over mountains
  10. a cluster of crystals and geodes
  11. a full moon with a detailed rabbit pattern
  12. an owl flying across the full moon
  13. a cauldron with rising star-smoke
  14. a constellation map with a wolf
  15. a waning gibbous moon and pine trees
  16. a mystic eye surrounded by rays
  17. a pressed-flower and crescent arrangement
  18. a last-quarter moon with ornate border
  19. a waning crescent over still water
  20. a full moon-phase mandala combining all phases, and finally everything comes back together
- **Beispiel-Seitenprompts:**
  - *Seite 11:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, a full moon with a detailed rabbit pattern, centered composition`
  - *Seite 13:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, a cauldron with rising star-smoke, surrounded by ornamental flourishes`

### Buch 2 — "Die Hexenküche" / "The Witch's Kitchen"
- **Slug:** `mystik-hexenkueche` · **Audience:** adult · **Seiten:** 18 · **Preis:** 7,99 €
- **Story:** Ein Abend in der Apotheke einer modernen Kräuterhexe — vom Sammeln der Zutaten im
  Mondgarten über das Mischen der Tränke bis zum Aufschlagen des alten Zauberbuchs.
- **Beschreibung (DE):** 18 Seiten voller Kräuter, Tränke und Zauberwerkzeug. Trockensträuße,
  Apothekerregale, Grimoires, schwarze Katzen. Detailreiches, gemütlich-mystisches Ausmalen.
- **heroMotif (Cover):** `a witch's apothecary shelf with potion bottles herbs and a black cat`
- **Cover-Prompt:** `coloring book style illustration of a witch's apothecary shelf with potion bottles herbs and a black cat, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→18):**
  1. a moonlit herb garden with a basket
  2. a hand picking nightshade flowers
  3. a shelf of labeled potion bottles
  4. a bundle of hanging dried herbs
  5. a cauldron bubbling over a fire
  6. a mortar and pestle with crushed petals
  7. an open grimoire with handwritten spells
  8. a black cat curled on a spellbook
  9. a row of candles in ornate holders
  10. a crystal ball on a clawed stand
  11. a teapot brewing a magic infusion
  12. a wooden spoon and recipe scroll
  13. a jar of glowing fireflies
  14. a pentacle drawn with salt and herbs
  15. a broom leaning by the door
  16. a window with the full moon outside
  17. a familiar owl on a perch
  18. the full magical kitchen scene, all coming back together as one
- **Beispiel-Seitenprompts:**
  - *Seite 5:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, a cauldron bubbling over a fire, in a small scene with surroundings`
  - *Seite 8:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, a black cat curled on a spellbook, close-up portrait`

### Buch 3 — "Tarot & Tierwesen" / "Tarot & Spirit Animals"
- **Slug:** `mystik-tarot-tierwesen` · **Audience:** adult · **Seiten:** 18 · **Preis:** 7,99 €
- **Story:** Eine Reise durch die großen Arkana als Krafttiere — jede Seite ein symbolträchtiges
  Tarot-Motiv, von der Sonne bis zum Mond, bevölkert von Eulen, Schlangen, Wölfen und Raben.
- **Beschreibung (DE):** 18 Seiten im Tarot-Stil mit symbolischen Tieren und Ornamenten. Mondkarten,
  Sternenmotive, Krafttiere in dekorativen Rahmen. Mystisch und meditativ.
- **heroMotif (Cover):** `an ornate tarot-style card with a moth sun and moon symbols`
- **Cover-Prompt:** `coloring book style illustration of an ornate tarot-style card with a moth sun and moon symbols, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→18):**
  1. an ornate tarot frame with a rising sun
  2. a crescent moon card with a howling wolf
  3. a star card with a deer and constellations
  4. a snake coiled around an ornamental key
  5. an owl with spread wings in a decorative arch
  6. a hand holding a glowing lantern
  7. a raven perched on a skull and roses
  8. a butterfly framed by celestial symbols
  9. a fox surrounded by autumn ornaments
  10. a pair of koi fish in a circular border
  11. a phoenix rising within a sun motif
  12. a stag with antlers full of stars
  13. a spider and web mandala
  14. a bee with a honeycomb pattern
  15. a horse galloping through clouds
  16. a serpent and chalice card
  17. a moth with detailed wing patterns
  18. a sun-and-moon spirit animal card combining motifs, and finally everything comes back together
- **Beispiel-Seitenprompts:**
  - *Seite 5:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, an owl with spread wings in a decorative arch, surrounded by ornamental flourishes`
  - *Seite 17:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, a moth with detailed wing patterns, centered composition`

---

## A6 · Sternzeichen & Kosmos  (`sternzeichen-kosmos`, adult)

> NEU. Zodiac = Dauerbrenner, Serien-Potenzial (12 Zeichen). Hier als kosmische Reisen gebündelt.

### Buch 1 — "Reise durch den Tierkreis" / "Journey Through the Zodiac"
- **Slug:** `zodiak-tierkreis-reise` · **Audience:** adult · **Seiten:** 20 · **Preis:** 7,99 €
- **Story:** Eine Reise durch alle zwölf Sternzeichen — vom Widder im Frühling bis zu den Fischen,
  jedes als kunstvolle Verbindung aus Tier, Symbol und Sternbild, eingerahmt von kosmischen Ornamenten.
- **Beschreibung (DE):** 20 Seiten: alle 12 Sternzeichen plus kosmische Übergangsseiten (Sonne, Mond,
  Planeten, Sternenkarte). Filigrane Zodiac-Kunst zum Sammeln und Verschenken.
- **heroMotif (Cover):** `an ornate zodiac wheel with all twelve astrology symbols and stars`
- **Cover-Prompt:** `coloring book style illustration of an ornate zodiac wheel with all twelve astrology symbols and stars, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→20):**
  1. an ornate aries ram with constellation
  2. a taurus bull surrounded by flowers
  3. a gemini twins motif with mirrored ornaments
  4. a cancer crab with moon and waves
  5. a leo lion with a radiant sun mane
  6. a virgo maiden with wheat and stars
  7. a libra scales with balanced ornaments
  8. a scorpio scorpion with celestial border
  9. a sagittarius archer centaur with arrows
  10. a capricorn sea-goat with mountains
  11. an aquarius water bearer pouring stars
  12. a pisces two fish in a circular frame
  13. a radiant sun face with rays
  14. a crescent moon with stars
  15. a ringed planet with orbit lines
  16. a comet streaking across the sky
  17. a constellation map of the night sky
  18. a celestial hand holding a star
  19. an astrolabe instrument with dials
  20. the full zodiac wheel combining all signs, all coming back together as one
- **Beispiel-Seitenprompts:**
  - *Seite 5:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, a leo lion with a radiant sun mane, surrounded by ornamental flourishes`
  - *Seite 20:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, the full zodiac wheel combining all signs, centered composition`

### Buch 2 — "Kosmische Mandalas" / "Cosmic Mandalas"
- **Slug:** `zodiak-kosmische-mandalas` · **Audience:** adult · **Seiten:** 18 · **Preis:** 6,99 €
- **Story:** Eine Reise vom Zentrum des Universums nach außen — Sonne, Planeten, Sternennebel und
  Galaxien, jeweils als rundes Mandala. Vom Kern bis zum Rand des Kosmos.
- **Beschreibung (DE):** 18 kosmische Mandalas: Sonnensystem, Planeten, Galaxien, Sternbilder — alles
  in kreisrunder Symmetrie. Verbindet die Mandala-Fans mit der Astro-Nische.
- **heroMotif (Cover):** `an intricate cosmic mandala with planets sun and stars`
- **Cover-Prompt:** `coloring book style illustration of an intricate cosmic mandala with planets sun and stars, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→18):**
  1. a sun mandala at the center of the cosmos
  2. a mercury planet mandala
  3. a venus planet mandala with swirls
  4. an earth and moon mandala
  5. a mars planet mandala
  6. a jupiter mandala with banded patterns
  7. a saturn mandala with detailed rings
  8. a uranus and neptune mandala
  9. a comet mandala with a flowing tail
  10. an asteroid belt ring mandala
  11. a constellation mandala
  12. a shooting star mandala
  13. a nebula cloud mandala
  14. a spiral galaxy mandala
  15. a black hole spiral mandala
  16. a star cluster mandala
  17. an eclipse mandala with corona
  18. a full universe mandala combining all motifs, and finally everything comes back together
- **Beispiel-Seitenprompts:**
  - *Seite 7:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, a saturn mandala with detailed rings, centered composition`
  - *Seite 14:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, a spiral galaxy mandala, surrounded by ornamental flourishes`

### Buch 3 — "Himmel über uns" / "The Sky Above Us" (Bold & Easy)
- **Slug:** `zodiak-himmel-ueber-uns` · **Audience:** all · **Seiten:** 16 · **Preis:** 5,99 €
- **Story:** Eine sanfte Reise von der Abenddämmerung bis tief in die Nacht — der Mond steigt, die
  Sterne kommen heraus, ein Komet zieht vorbei. Große, ruhige Formen für entspanntes Ausmalen.
- **Beschreibung (DE):** 16 Bold-&-Easy-Himmelsmotive mit dicken Linien: Mond, Sterne, Planeten,
  Sternschnuppen. Der einfache Einstieg in die kosmische Welt — auch für Senioren ideal.
- **heroMotif (Cover):** `a bold simple smiling crescent moon with stars`
- **Cover-Prompt:** `coloring book style illustration of a bold simple smiling crescent moon with stars, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a aries ram drifting in orbit
  2. a taurus bull across a starfield
  3. a gemini twins near a giant planet
  4. a leo lion past the glowing moon
  5. a virgo maiden in a swirling galaxy
  6. a libra scales among distant stars
  7. a scorpio scorpion beside a ringed planet
  8. a sagittarius archer through a nebula cloud
  9. a capricorn goat drifting in orbit
  10. a aquarius waves across a starfield
  11. a pisces fish near a giant planet
  12. a crescent moon past the glowing moon
  13. a shooting star in a swirling galaxy
  14. a sun face among distant stars
  15. a constellation map beside a ringed planet
  16. the whole zodiac sky scene coming back together at sunset
- **Beispiel-Seitenprompts:**
  - *Seite 2:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, a simple crescent moon with a face, centered composition`
  - *Seite 16:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, a full starry sky with moon and planets, with a decorative patterned background`

---
## A7 · Japan & Zen  (`japan-zen`, adult)

> Behalten. Starke Ästhetik, stabiler Anti-Stress-Seller.

### Buch 1 — "Ein Tag in Kyoto" / "A Day in Kyoto"
- **Slug:** `japan-tag-in-kyoto` · **Audience:** adult · **Seiten:** 20 · **Preis:** 6,99 €
- **Story:** Ein Tag durch das alte Kyoto — vom Torii-Tor im Morgennebel über Teehaus und Bambushain
  bis zum Laternenfest am Fluss, wenn die Kirschblüten fallen.
- **Beschreibung (DE):** 20 Seiten japanischer Ruhe: Tempel, Koi-Teiche, Bonsai, Kraniche, Wellen
  im Hokusai-Stil. Feine, meditative Linien für tiefe Entspannung.
- **heroMotif (Cover):** `a japanese torii gate with cherry blossoms and a pagoda`
- **Cover-Prompt:** `coloring book style illustration of a japanese torii gate with cherry blossoms and a pagoda, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→20):**
  1. a torii gate in morning mist
  2. a stone path with lanterns
  3. a cherry blossom branch in bloom
  4. a traditional tea house with sliding doors
  5. a tea ceremony set on a tatami mat
  6. a bamboo grove with tall stalks
  7. a koi pond with a wooden bridge
  8. a pair of koi fish swimming
  9. a bonsai tree in a ceramic pot
  10. a zen rock garden with raked sand
  11. a pagoda among pine trees
  12. a crane standing in water
  13. a geisha's folding fan with patterns
  14. a wave in the style of hokusai
  15. mount fuji behind the clouds
  16. a paper lantern festival on the river
  17. a maple branch with autumn leaves
  18. a stone buddha statue with moss
  19. an origami crane and flowers
  20. the full kyoto temple scene at dusk, and finally everything comes back together
- **Beispiel-Seitenprompts:**
  - *Seite 14:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, a wave in the style of hokusai, centered composition`
  - *Seite 10:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, a zen rock garden with raked sand, in a small scene with surroundings`

### Buch 2 — "Koi & Wasser" / "Koi & Water"
- **Slug:** `japan-koi-und-wasser` · **Audience:** adult · **Seiten:** 18 · **Preis:** 6,99 €
- **Story:** Eine Reise dem Wasser folgend — von der Quelle im Bergbach über den Koi-Teich bis zur
  großen Welle am Meer. Das Element Wasser als roter Faden japanischer Ästhetik.
- **Beschreibung (DE):** 18 Seiten rund um Wasser und Koi: schwimmende Karpfen, Wellenmuster,
  Seerosen, Wasserfälle. Fließende, beruhigende Linienführung.
- **heroMotif (Cover):** `two ornate koi fish swimming among lotus flowers and waves`
- **Cover-Prompt:** `coloring book style illustration of two ornate koi fish swimming among lotus flowers and waves, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→18):**
  1. a mountain spring trickling over rocks
  2. a single koi fish with patterned scales
  3. two koi fish circling each other
  4. a lotus flower on the water surface
  5. a school of small koi
  6. a wave pattern in seigaiha style
  7. a water lily pad with a frog
  8. a waterfall between rocks
  9. a koi leaping out of the water
  10. ripples around a fallen leaf
  11. a dragon koi with flowing fins
  12. a pond with floating cherry petals
  13. a crane fishing in shallow water
  14. a wooden water wheel by a stream
  15. raindrops on a pond surface
  16. a turtle resting on a rock
  17. an ornate wave and foam pattern
  18. a full koi pond garden scene, all coming back together as one
- **Beispiel-Seitenprompts:**
  - *Seite 3:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, two koi fish circling each other, centered composition`
  - *Seite 11:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, a dragon koi with flowing fins, full body view`

### Buch 3 — "Zen-Garten" / "Zen Garden" (Bold & Easy)
- **Slug:** `japan-zen-garten` · **Audience:** all · **Seiten:** 16 · **Preis:** 5,99 €
- **Story:** Ein langsamer Gang durch einen Zen-Garten — vom Eingangstor über Trittsteine und
  Bonsai bis zur Bank unter dem Ahorn. Reduzierte, große Formen für stille Achtsamkeit.
- **Beschreibung (DE):** 16 Bold-&-Easy-Seiten japanischer Gelassenheit: Bonsai, Laterne, Koi,
  Bambus — mit dicken, ruhigen Linien. Der einfache Einstieg in die Zen-Welt.
- **heroMotif (Cover):** `a bold simple bonsai tree with a stone lantern`
- **Cover-Prompt:** `coloring book style illustration of a bold simple bonsai tree with a stone lantern, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a raked sand pattern surrounded by soft clouds
  2. a stone lantern framed by garden leaves
  3. a bonsai tree beside still water
  4. a koi in a pond under a crescent moon
  5. a cherry blossom branch ringed by tiny stars
  6. a bamboo grove over a calm meadow
  7. a tea house by a quiet pond
  8. a stepping stones in the morning sky
  9. a wooden bridge surrounded by soft clouds
  10. a lotus flower framed by garden leaves
  11. a crane bird beside still water
  12. a moss rock under a crescent moon
  13. a wind chime ringed by tiny stars
  14. a paper fan over a calm meadow
  15. a pagoda by a quiet pond
  16. the whole zen garden scene coming back together at sunset
- **Beispiel-Seitenprompts:**
  - *Seite 3:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, a simple bonsai tree in a pot, centered composition`
  - *Seite 16:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, a full zen garden scene with bench, in a small scene with surroundings`

---

## A8 · Gothic & Sugar Skulls  (`gothic-skulls`, adult)

> Behalten. Pairt stark mit Dark Academia. Día-de-los-Muertos + Gothic-Romantik.

### Buch 1 — "Día de los Muertos" / "Day of the Dead"
- **Slug:** `gothic-dia-de-los-muertos` · **Audience:** adult · **Seiten:** 18 · **Preis:** 6,99 €
- **Story:** Eine Reise durch die Nacht des Totenfests — von der ersten geschmückten Kerze über die
  reich verzierten Zuckerschädel und Marigold-Girlanden bis zur großen Parade im Mondlicht.
- **Beschreibung (DE):** 18 Seiten voller Día-de-los-Muertos-Pracht: ornamentale Sugar Skulls,
  Ringelblumen, Kerzen, Gitarren. Üppig verziert, ein Fest fürs detailverliebte Ausmalen.
- **heroMotif (Cover):** `an ornate decorated sugar skull with marigold flowers and candles`
- **Cover-Prompt:** `coloring book style illustration of an ornate decorated sugar skull with marigold flowers and candles, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→18):**
  1. a ornate sugar skull in the old town
  2. a marigold flower by the cathedral
  3. a candle holder on a cobbled street
  4. a papel picado banner at the market square
  5. a guitar with roses below the clock tower
  6. a lady catrina figure across a stone bridge
  7. a decorated cross along a quiet alley
  8. a rose garland in a courtyard
  9. a butterfly with patterns in the old town
  10. a skull with flowers by the cathedral
  11. a candlelit altar on a cobbled street
  12. a dove with a ribbon at the market square
  13. a feathered headdress below the clock tower
  14. a ornate frame across a stone bridge
  15. a heart with vines along a quiet alley
  16. a ornate sugar skull in a courtyard
  17. a marigold flower in the old town
  18. the whole day of the dead scene coming back together at sunset
- **Beispiel-Seitenprompts:**
  - *Seite 2:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, a decorated sugar skull with roses, centered composition`
  - *Seite 9:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, a skeleton lady in an ornate dress, full body view`

### Buch 2 — "Gothic Romance" / "Gothic Romance"
- **Slug:** `gothic-romance` · **Audience:** adult · **Seiten:** 18 · **Preis:** 6,99 €
- **Story:** Eine düster-romantische Reise durch ein altes Anwesen bei Nacht — verwelkte Rosen,
  Spinnweben-Kronleuchter, Raben am Fenster, ein verlassener Ballsaal voller Geheimnisse.
- **Beschreibung (DE):** 18 Seiten gotischer Romantik: schwarze Rosen, Totenkopf-Motten, schmiede-
  eiserne Tore, viktorianische Spiegel. Elegant-dunkel, für Liebhaber des Morbiden.
- **heroMotif (Cover):** `an ornate gothic rose with thorns a raven and a skull`
- **Cover-Prompt:** `coloring book style illustration of an ornate gothic rose with thorns a raven and a skull, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→18):**
  1. a ornate rose in the old town
  2. a raven on a branch by the cathedral
  3. a gothic window on a cobbled street
  4. a candelabra at the market square
  5. a lace fan below the clock tower
  6. a heart-shaped locket across a stone bridge
  7. a thorned vine along a quiet alley
  8. a moth with patterns in a courtyard
  9. a old key in the old town
  10. a velvet curtain by the cathedral
  11. a ornate mirror on a cobbled street
  12. a wilting bouquet at the market square
  13. a stone archway below the clock tower
  14. a feather quill across a stone bridge
  15. a filigree heart along a quiet alley
  16. a ornate rose in a courtyard
  17. a raven on a branch in the old town
  18. the whole gothic romance scene coming back together at sunset
- **Beispiel-Seitenprompts:**
  - *Seite 6:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, a death's-head moth with patterned wings, centered composition`
  - *Seite 9:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, a spider web chandelier, in a small scene with surroundings`

### Buch 3 — "Skulls & Flowers" / "Skulls & Flowers" (Bold & Easy)
- **Slug:** `gothic-skulls-und-flowers` · **Audience:** all · **Seiten:** 16 · **Preis:** 5,99 €
- **Story:** Eine sanfte Reise vom einzelnen Schädel zum blühenden Stillleben — große, klare
  Totenkopf-und-Blumen-Motive ohne Gefriemel, für Gothic-Fans, die es entspannt mögen.
- **Beschreibung (DE):** 16 Bold-&-Easy-Seiten: schlichte Sugar Skulls mit großen Blüten und dicken
  Linien. Der niederschwellige Einstieg in die Gothic-Welt.
- **heroMotif (Cover):** `a bold simple sugar skull with two big flowers`
- **Cover-Prompt:** `coloring book style illustration of a bold simple sugar skull with two big flowers, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a rose-crowned skull in the old town
  2. a peony skull by the cathedral
  3. a lily skull on a cobbled street
  4. a sunflower skull at the market square
  5. a vine-wrapped skull below the clock tower
  6. a butterfly skull across a stone bridge
  7. a dahlia skull along a quiet alley
  8. a ornate skull mask in a courtyard
  9. a blossom garland in the old town
  10. a thorned wreath by the cathedral
  11. a candle and skull on a cobbled street
  12. a moth and skull at the market square
  13. a feathered skull below the clock tower
  14. a lotus skull across a stone bridge
  15. a heart and skull along a quiet alley
  16. the whole skulls and flowers scene coming back together at sunset
- **Beispiel-Seitenprompts:**
  - *Seite 1:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, a bold simple skull with a flower crown, centered composition`
  - *Seite 16:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, a full skull and flowers bouquet, centered composition`

---

## A9 · Achtsamkeit & Affirmationen  (`achtsamkeit-affirmationen`, adult)

> Behalten + erweitert um Affirmationen (Wellness-Premium). Hinweis: Affirmations-Text als
> dekoratives Schriftband im Motiv mitdenken — flux setzt Text unsauber; daher Text optional
> serverseitig als Overlay statt im Bild. Motive hier bleiben textfrei, Stimmung trägt.

### Buch 1 — "Atemreise" / "A Breathing Journey"
- **Slug:** `achtsamkeit-atemreise` · **Audience:** adult · **Seiten:** 18 · **Preis:** 7,99 €
- **Story:** Eine Reise im Rhythmus des Atems — von der ruhigen Lotusblüte des Einatmens über
  weite, offene Landschaften bis zur Stille des Ausatmens unter dem Sternenhimmel.
- **Beschreibung (DE):** 18 beruhigende Seiten zum achtsamen Ausmalen: Lotus, sanfte Wellen, offene
  Hände, Federn, ruhige Horizonte. Gestaltet als visuelle Atemübung gegen Stress.
- **heroMotif (Cover):** `a serene lotus flower with gentle waves and a calm sun`
- **Cover-Prompt:** `coloring book style illustration of a serene lotus flower with gentle waves and a calm sun, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→18):**
  1. a calm lotus flower opening
  2. a pair of open hands holding light
  3. a single feather floating
  4. gentle concentric ripples on water
  5. a soft rolling hill at sunrise
  6. a meditating figure silhouette with patterns
  7. a leaf with delicate veins
  8. a calm wave curling slowly
  9. a dandelion releasing seeds
  10. a peaceful mountain horizon
  11. a bird gliding on the wind
  12. a tree with deep roots and a calm canopy
  13. a still pond reflecting the sky
  14. a candle with a steady flame
  15. a chain of smooth stones balanced
  16. a crescent moon over quiet hills
  17. a starlit sky with soft clouds
  18. a full serene landscape at dusk, and finally everything comes back together
- **Beispiel-Seitenprompts:**
  - *Seite 6:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, a meditating figure silhouette with patterns, centered composition`
  - *Seite 13:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, a still pond reflecting the sky, in a small scene with surroundings`

### Buch 2 — "Garten der guten Gedanken" / "Garden of Good Thoughts"
- **Slug:** `achtsamkeit-garten-gedanken` · **Audience:** adult · **Seiten:** 18 · **Preis:** 7,99 €
- **Story:** Ein Affirmations-Garten, der mit jeder Seite weiterwächst — von der ersten kleinen
  Knospe der Selbstfürsorge bis zum vollen Beet aus Mut, Dankbarkeit und Ruhe. Ornamentale Banner
  für eigene Affirmationen lassen Platz zum Beschriften.
- **Beschreibung (DE):** 18 dekorative Seiten mit Blüten, Herzen und leeren Schmuckbändern, die
  zum Eintragen eigener Affirmationen einladen. Verbindet Achtsamkeit mit kreativem Journaling.
- **heroMotif (Cover):** `an ornate floral wreath around an empty decorative banner ribbon`
- **Cover-Prompt:** `coloring book style illustration of an ornate floral wreath around an empty decorative banner ribbon, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→18):**
  1. a small flower bud with an empty banner below
  2. a heart wreath with blank center
  3. a sun with rays and a ribbon banner
  4. an open hand with a growing sprout
  5. a butterfly over a blank decorative frame
  6. a blooming flower with an empty scroll
  7. a pair of leaves framing a blank tag
  8. a rainbow arch over a banner
  9. a potted plant with an ornate label
  10. a bird carrying a ribbon
  11. a moon and stars around a blank circle
  12. a wreath of wildflowers with center space
  13. a cup of tea with a steam ribbon
  14. a mountain with a banner across it
  15. a bee and honeycomb with a label
  16. a flowing vine with empty plaques
  17. a heart in two hands with a banner
  18. a full flower garden framing a large blank banner, all coming back together as one
- **Beispiel-Seitenprompts:**
  - *Seite 2:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, a heart wreath with blank center, centered composition`
  - *Seite 18:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, a full flower garden framing a large blank banner, centered composition`

### Buch 3 — "Ruhe finden" / "Finding Calm" (Bold & Easy)
- **Slug:** `achtsamkeit-ruhe-finden` · **Audience:** all · **Seiten:** 16 · **Preis:** 5,99 €
- **Story:** Eine einfache Reise zur Ruhe — große, weiche Symbole der Gelassenheit von der Sonne
  am Morgen bis zum Mond am Abend. Dicke Linien, keine Überforderung, reines Durchatmen.
- **Beschreibung (DE):** 16 Bold-&-Easy-Seiten mit großen, beruhigenden Motiven: Sonne, Herz, Lotus,
  Wolke. Ideal für Senioren, Einsteiger und stressige Tage.
- **heroMotif (Cover):** `a bold simple smiling sun with a calm cloud and heart`
- **Cover-Prompt:** `coloring book style illustration of a bold simple smiling sun with a calm cloud and heart, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a open hand with a heart surrounded by soft clouds
  2. a breathing wave pattern framed by garden leaves
  3. a lotus pose figure beside still water
  4. a calm face with closed eyes under a crescent moon
  5. a candle flame ringed by tiny stars
  6. a feather drifting over a calm meadow
  7. a still teacup by a quiet pond
  8. a balanced stones in the morning sky
  9. a gentle rain pattern surrounded by soft clouds
  10. a soft cloud framed by garden leaves
  11. a blooming lotus beside still water
  12. a quiet bird under a crescent moon
  13. a warm sun ringed by tiny stars
  14. a leaf on water over a calm meadow
  15. a peaceful moon by a quiet pond
  16. the whole calm mindfulness scene coming back together at sunset
- **Beispiel-Seitenprompts:**
  - *Seite 4:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, a chunky lotus flower, centered composition`
  - *Seite 16:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, a full calm scene with sun moon and flowers, with a decorative patterned background`

---
## A10 · Vintage & Steampunk  (`vintage-steampunk`, adult)

> Behalten. Passionierte Nische (Maker, Retro-Fans), trägt Premium.

### Buch 1 — "Die Werkstatt des Erfinders" / "The Inventor's Workshop"
- **Slug:** `steampunk-werkstatt` · **Audience:** adult · **Seiten:** 18 · **Preis:** 6,99 €
- **Story:** Ein Streifzug durch die Werkstatt eines viktorianischen Erfinders — von der Wand voller
  Zahnräder über halbfertige Automaten bis zum großen Luftschiff, das durchs Dachfenster startet.
- **Beschreibung (DE):** 18 Seiten voll Zahnräder, Messing und Mechanik: Taschenuhren, Roboter-Eulen,
  Luftschiffe, Dampfmaschinen. Detailverliebtes Steampunk-Ausmalen.
- **heroMotif (Cover):** `a steampunk pocket watch with gears wings and a key`
- **Cover-Prompt:** `coloring book style illustration of a steampunk pocket watch with gears wings and a key, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→18):**
  1. a brass gear cluster in the old town
  2. a pocket watch by the cathedral
  3. a mechanical owl on a cobbled street
  4. a copper pipework at the market square
  5. a vintage telescope below the clock tower
  6. a cog-driven clock across a stone bridge
  7. a steam valve along a quiet alley
  8. a tinker's goggles in a courtyard
  9. a wind-up key in the old town
  10. a airship model by the cathedral
  11. a lever panel on a cobbled street
  12. a robot arm at the market square
  13. a pressure gauge below the clock tower
  14. a lantern and tools across a stone bridge
  15. a blueprint scroll along a quiet alley
  16. a brass gear cluster in a courtyard
  17. a pocket watch in the old town
  18. the whole inventor workshop scene coming back together at sunset
- **Beispiel-Seitenprompts:**
  - *Seite 3:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, a mechanical owl with gear feathers, centered composition`
  - *Seite 17:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, an airship with propellers and balloons, full body view`

### Buch 2 — "Reise mit dem Luftschiff" / "Airship Voyage"
- **Slug:** `steampunk-luftschiff-reise` · **Audience:** adult · **Seiten:** 18 · **Preis:** 6,99 €
- **Story:** Eine abenteuerliche Reise an Bord eines Luftschiffs — vom Ablegen über den Dächern
  einer Dampfstadt über Wolkenmeere und ferne Kontinente bis zur Landung in einer Messing-Metropole.
- **Beschreibung (DE):** 18 Seiten Steampunk-Fernweh: Luftschiffe, Karten, Fernrohre, schwebende
  Inseln, fantastische Maschinenstädte. Erzählerisch, abenteuerlich, detailreich.
- **heroMotif (Cover):** `a grand steampunk airship flying over a clockwork city`
- **Cover-Prompt:** `coloring book style illustration of a grand steampunk airship flying over a clockwork city, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→18):**
  1. an airship docked at a tower
  2. a captain's wheel and controls
  3. a brass telescope on the deck
  4. a map with a plotted route and compass
  5. the airship rising above rooftops
  6. a sea of clouds below the hull
  7. a flock of mechanical birds alongside
  8. a floating island with gears
  9. a steampunk lighthouse on a cliff
  10. a hot-air balloon caravan
  11. a storm with lightning and propellers
  12. a sky-port with many airships
  13. an engine room with pistons
  14. a crew member with goggles waving
  15. a distant clockwork mountain city
  16. an anchor dropping toward a platform
  17. a celebration with banners on deck
  18. the full brass metropolis at arrival, and finally everything comes back together
- **Beispiel-Seitenprompts:**
  - *Seite 8:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, a floating island with gears, in a small scene with surroundings`
  - *Seite 15:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, a distant clockwork mountain city, in a small scene with surroundings`

### Buch 3 — "Vintage Stillleben" / "Vintage Still Life" (Bold & Easy)
- **Slug:** `steampunk-vintage-stillleben` · **Audience:** all · **Seiten:** 16 · **Preis:** 5,99 €
- **Story:** Ein ruhiger Rundgang über einen Antik-Flohmarkt — große, klare Vintage-Objekte, von der
  Taschenuhr über das alte Grammophon bis zum Koffer voller Erinnerungen.
- **Beschreibung (DE):** 16 Bold-&-Easy-Seiten mit nostalgischen Objekten: Grammophon, Schreibmaschine,
  Kamera, Schlüssel. Dicke Linien, charmant-retro, leicht auszumalen.
- **heroMotif (Cover):** `a bold simple vintage gramophone and pocket watch`
- **Cover-Prompt:** `coloring book style illustration of a bold simple vintage gramophone and pocket watch, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a antique typewriter in the old town
  2. a stack of old books by the cathedral
  3. a brass compass on a cobbled street
  4. a ink bottle and quill at the market square
  5. a vintage camera below the clock tower
  6. a ornate teapot across a stone bridge
  7. a pocket watch chain along a quiet alley
  8. a candlestick in a courtyard
  9. a rolled map in the old town
  10. a magnifying glass by the cathedral
  11. a feathered hat on a cobbled street
  12. a wine bottle at the market square
  13. a gramophone below the clock tower
  14. a spectacles across a stone bridge
  15. a key ring along a quiet alley
  16. the whole vintage still life scene coming back together at sunset
- **Beispiel-Seitenprompts:**
  - *Seite 5:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, a bold gramophone with horn, centered composition`
  - *Seite 16:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, a full vintage shelf of objects, in a small scene with surroundings`

---

## A11 · Unterwasserwelt  (`unterwasserwelt`, adult)

> Behalten (Erwachsenen-Anti-Stress-Variante des Ozean-Themas). Ozean-Achtsamkeit liegt im Trend.

### Buch 1 — "Tauchgang zum Korallenriff" / "Dive to the Coral Reef"
- **Slug:** `unterwasser-korallenriff` · **Audience:** adult · **Seiten:** 20 · **Preis:** 6,99 €
- **Story:** Ein Tauchgang von der glitzernden Oberfläche bis zum lebendigen Korallenriff — vorbei an
  Schildkröten, Quallen und Schwärmen, immer tiefer in eine ornamentale Unterwasserwelt.
- **Beschreibung (DE):** 20 detailreiche Seiten unter Wasser: Korallen, Seepferdchen, Quallen,
  Schildkröten, Fischschwärme. Fließende Muster, meditativ und kühl.
- **heroMotif (Cover):** `an intricate coral reef with a sea turtle and tropical fish`
- **Cover-Prompt:** `coloring book style illustration of an intricate coral reef with a sea turtle and tropical fish, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→20):**
  1. a sea turtle swimming up toward the sunlit water surface
  2. a school of fish near the surface
  3. a sea turtle gliding down
  4. an ornate jellyfish with trailing tentacles
  5. a seahorse among seagrass
  6. a branching coral formation
  7. a clownfish in an anemone
  8. a manta ray with patterned wings
  9. a starfish on a rock
  10. an octopus with curling arms
  11. a pufferfish with spines
  12. a giant clam with a pearl
  13. a moray eel peeking from coral
  14. a swirl of tropical fish
  15. a detailed seashell collection
  16. a dolphin spiraling upward
  17. a forest of kelp
  18. a sunken treasure chest with bubbles
  19. an anglerfish in the deep
  20. the full coral reef panorama, and finally everything comes back together
- **Beispiel-Seitenprompts:**
  - *Seite 4:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, an ornate jellyfish with trailing tentacles, full body view`
  - *Seite 10:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, an octopus with curling arms, centered composition`

### Buch 2 — "Geheimnisse der Tiefsee" / "Secrets of the Deep"
- **Slug:** `unterwasser-tiefsee` · **Audience:** adult · **Seiten:** 18 · **Preis:** 6,99 €
- **Story:** Eine Reise in immer dunklere Tiefen — von dämmrigen Zwischenwassern zu biolumineszenten
  Wesen und schließlich den seltsamen Kreaturen am Meeresgrund. Geheimnisvoll und filigran.
- **Beschreibung (DE):** 18 Seiten der Tiefsee: Leuchtquallen, Anglerfische, Riesenkraken, Wale.
  Mysteriöse Formen mit feinen Mustern für tiefe Entspannung.
- **heroMotif (Cover):** `an ornate bioluminescent deep sea jellyfish and anglerfish`
- **Cover-Prompt:** `coloring book style illustration of an ornate bioluminescent deep sea jellyfish and anglerfish, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→18):**
  1. a whale silhouette in dim water
  2. a bioluminescent jellyfish with patterns
  3. a school of lanternfish with glowing dots
  4. a giant squid with long tentacles
  5. an anglerfish with a glowing lure
  6. a nautilus shell spiral
  7. a deep-sea coral with delicate branches
  8. a ray gliding over the seabed
  9. a cluster of glowing sea anemones
  10. a hatchetfish with reflective scales
  11. a hydrothermal vent with bubbles
  12. an ornate seahorse of the deep
  13. a viperfish with sharp patterns
  14. a basket star with branching arms
  15. a sunken ship covered in coral
  16. a sperm whale and squid encounter
  17. a swarm of glowing plankton
  18. the full deep-sea panorama, all coming back together as one
- **Beispiel-Seitenprompts:**
  - *Seite 5:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, an anglerfish with a glowing lure, centered composition`
  - *Seite 16:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, a sperm whale and squid encounter, in a small scene with surroundings`

### Buch 3 — "Sanfte Meeresfreunde" / "Gentle Sea Friends" (Bold & Easy)
- **Slug:** `unterwasser-sanfte-meeresfreunde` · **Audience:** all · **Seiten:** 16 · **Preis:** 5,99 €
- **Story:** Eine fröhliche, einfache Reise durchs flache Wasser — große, freundliche Meerestiere
  von der lächelnden Schildkröte bis zum runden Kugelfisch. Dicke Linien, gute Laune.
- **Beschreibung (DE):** 16 Bold-&-Easy-Seiten mit freundlichen Meerestieren: Wal, Delfin, Krabbe,
  Seestern. Einfach auszumalen, auch für jüngere Familienmitglieder geeignet.
- **heroMotif (Cover):** `a bold simple smiling whale with a starfish`
- **Cover-Prompt:** `coloring book style illustration of a bold simple smiling whale with a starfish, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a smiling sea turtle over the coral reef
  2. a playful dolphin in the open sea
  3. a curious clownfish on the sandy seabed
  4. a gentle whale in a kelp forest
  5. a tiny seahorse near a bright lagoon
  6. a friendly octopus along the ocean current
  7. a spotted ray by a rocky reef
  8. a starfish above the seabed
  9. a jellyfish with frills over the coral reef
  10. a puffer fish in the open sea
  11. a crab with bubbles on the sandy seabed
  12. a school of fish in a kelp forest
  13. a sea snail near a bright lagoon
  14. a anemone along the ocean current
  15. a baby seal by a rocky reef
  16. the whole gentle sea friends scene coming back together at sunset
- **Beispiel-Seitenprompts:**
  - *Seite 1:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, a bold simple smiling whale, centered composition`
  - *Seite 16:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, a full underwater scene with friends, in a small scene with surroundings`

---

## A12 · Schmetterlinge & Libellen  (`schmetterlinge-libellen`, adult)

> Behalten. Bold-&-Easy-Animals + filigrane Flügelmuster — doppelt anschlussfähig.

### Buch 1 — "Tanz der Schmetterlinge" / "Dance of the Butterflies"
- **Slug:** `schmetterlinge-tanz` · **Audience:** adult · **Seiten:** 18 · **Preis:** 6,99 €
- **Story:** Eine Reise durch einen Sommertag auf der Blumenwiese — vom Schlüpfen aus dem Kokon über
  das Flattern von Blüte zu Blüte bis zum großen Schwarm im Abendlicht.
- **Beschreibung (DE):** 18 Seiten voll filigraner Schmetterlinge mit reich gemusterten Flügeln,
  Blüten und Ranken. Symmetrisch, elegant, ein Klassiker fürs detailverliebte Ausmalen.
- **heroMotif (Cover):** `an ornate butterfly with intricate patterned wings on flowers`
- **Cover-Prompt:** `coloring book style illustration of an ornate butterfly with intricate patterned wings on flowers, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→18):**
  1. a monarch butterfly over a flower meadow
  2. a swallowtail butterfly in a cottage garden
  3. a blue morpho by a lily pond
  4. a moth with eyespots across a wildflower field
  5. a pair of fluttering wings along the hedgerow
  6. a butterfly on a daisy at the forest edge
  7. a chrysalis on a stem by a quiet stream
  8. a swirl of butterflies in a sunny grove
  9. a painted lady over a flower meadow
  10. a dragonfly in a cottage garden
  11. a ladybird by a lily pond
  12. a bee among petals across a wildflower field
  13. a rose with a butterfly along the hedgerow
  14. a lavender sprig at the forest edge
  15. a fern with wings by a quiet stream
  16. a poppy and a moth in a sunny grove
  17. a thistle bloom over a flower meadow
  18. the whole butterfly dance scene coming back together at sunset
- **Beispiel-Seitenprompts:**
  - *Seite 3:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, a single ornate butterfly opening its wings, centered composition`
  - *Seite 10:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, a butterfly with mandala-patterned wings, centered composition`

### Buch 2 — "Am Libellenteich" / "At the Dragonfly Pond"
- **Slug:** `schmetterlinge-libellenteich` · **Audience:** adult · **Seiten:** 18 · **Preis:** 6,99 €
- **Story:** Ein stiller Nachmittag am Teich — von den ersten Libellen über dem Schilf, ihren
  durchsichtigen Flügeln im Sonnenlicht, bis zum Tanz über den Seerosen am Abend.
- **Beschreibung (DE):** 18 Seiten mit Libellen, Schilf, Seerosen und Wasserläufern. Zarte Adern,
  filigrane Flügel, spiegelnde Wasseroberflächen. Ruhig und elegant.
- **heroMotif (Cover):** `an ornate dragonfly with detailed wings over a lily pond`
- **Cover-Prompt:** `coloring book style illustration of an ornate dragonfly with detailed wings over a lily pond, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→18):**
  1. a darting dragonfly over a flower meadow
  2. a damselfly on a reed in a cottage garden
  3. a lily pad with a frog by a lily pond
  4. a water lily bloom across a wildflower field
  5. a cattail stem along the hedgerow
  6. a pond skater at the forest edge
  7. a fish below the surface by a quiet stream
  8. a dragonfly nymph in a sunny grove
  9. a reed cluster over a flower meadow
  10. a ripple ring in a cottage garden
  11. a duck weed patch by a lily pond
  12. a frog on a stone across a wildflower field
  13. a iris flower along the hedgerow
  14. a willow branch at the forest edge
  15. a snail on a leaf by a quiet stream
  16. a moth at dusk in a sunny grove
  17. a bullrush over a flower meadow
  18. the whole dragonfly pond scene coming back together at sunset
- **Beispiel-Seitenprompts:**
  - *Seite 2:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, a dragonfly with detailed transparent wings, centered composition`
  - *Seite 13:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, intricate and highly detailed, ornate decorative patterns, fine delicate linework, zentangle style, a dragonfly hovering with mirrored wings, centered composition`

### Buch 3 — "Große Flügel" / "Big Wings" (Bold & Easy)
- **Slug:** `schmetterlinge-grosse-fluegel` · **Audience:** all · **Seiten:** 16 · **Preis:** 5,99 €
- **Story:** Eine leichte Reise durch den Garten — große Schmetterlinge und Libellen mit dicken
  Linien, von der einzelnen Blüte bis zum fröhlichen Flügelschwarm. Entspannt und einsteigerfreundlich.
- **Beschreibung (DE):** 16 Bold-&-Easy-Seiten mit großen Schmetterlingen, Libellen und Blüten.
  Klare, dicke Konturen, große Flächen — ideal für Senioren und ruhige Pausen.
- **heroMotif (Cover):** `a bold simple butterfly with big patterned wings on a flower`
- **Cover-Prompt:** `coloring book style illustration of a bold simple butterfly with big patterned wings on a flower, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a giant ornate butterfly over a flower meadow
  2. a atlas moth in a cottage garden
  3. a peacock butterfly by a lily pond
  4. a luna moth across a wildflower field
  5. a tiger swallowtail along the hedgerow
  6. a emperor butterfly at the forest edge
  7. a wings with mandala patterns by a quiet stream
  8. a symmetrical wing study in a sunny grove
  9. a butterfly with paisley wings over a flower meadow
  10. a moth with lace wings in a cottage garden
  11. a spread wings close-up by a lily pond
  12. a wing tip detail across a wildflower field
  13. a patterned wing pair along the hedgerow
  14. a blossom with a butterfly at the forest edge
  15. a vine with a moth by a quiet stream
  16. the whole great wings scene coming back together at sunset
- **Beispiel-Seitenprompts:**
  - *Seite 7:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, a big butterfly with swirl patterns, centered composition`
  - *Seite 16:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, a full garden scene with butterflies, in a small scene with surroundings`

---
# TEIL II — KINDER / FAMILIE

> Standard-Stil: **Bold & Easy** (Pipeline-`kids`). Seiten 15–16. Story = kindgerechte visuelle Reise.

## K1 · Niedliche Tiere  (`niedliche-tiere`, kids)

> Behalten. "Cute animals" + Party-Themen = Spitzen-Suchvolumen laut Recherche.

### Buch 1 — "Ein Tag auf der Tierwiese" / "A Day on the Animal Meadow"
- **Slug:** `tiere-tag-auf-der-wiese` · **Audience:** kids · **Seiten:** 16 · **Preis:** 4,99 €
- **Story:** Von früh bis spät auf einer fröhlichen Wiese — der Hase wacht auf, der Fuchs spielt,
  die Eule sagt gute Nacht. Jede Seite ein niedliches Tier mit großem Lächeln.
- **Beschreibung (DE):** 16 kunterbunte, niedliche Tiere mit dicken Linien — perfekt für kleine
  Hände. Hase, Fuchs, Bär, Eule und mehr, einfach und freudig auszumalen.
- **heroMotif (Cover):** `a cute happy fox and rabbit sitting in a meadow`
- **Cover-Prompt:** `coloring book style illustration of a cute happy fox and rabbit sitting in a meadow, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a happy rabbit in a sunny meadow
  2. a playful fox deep in the jungle
  3. a wise owl by the wide river
  4. a little hedgehog across the savanna
  5. a busy squirrel at the waterhole
  6. a spotted deer in the forest
  7. a buzzing bee on a grassy hill
  8. a singing bird near a jungle stream
  9. a fuzzy caterpillar in a sunny meadow
  10. a hopping frog deep in the jungle
  11. a field mouse by the wide river
  12. a ladybird across the savanna
  13. a butterfly at the waterhole
  14. a mole peeking out in the forest
  15. a duck family on a grassy hill
  16. the whole meadow animals scene coming back together at sunset
- **Beispiel-Seitenprompts:**
  - *Seite 2:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, a happy fox with a bushy tail, full body view`
  - *Seite 16:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, all the animal friends together in the meadow, in a small scene with surroundings`

### Buch 2 — "Die große Tierparty" / "The Big Animal Party"
- **Slug:** `tiere-grosse-tierparty` · **Audience:** kids · **Seiten:** 16 · **Preis:** 4,99 €
- **Story:** Alle Tiere feiern ein Fest — vom Aufblasen der Luftballons über Kuchen und Geschenke
  bis zum großen Tanz. Eine fröhliche Party-Geschichte von Anfang bis Ende.
- **Beschreibung (DE):** 16 Seiten Party-Spaß mit niedlichen Tieren: Luftballons, Torte, Hütchen,
  Tanz. Das beliebte "Tier-Party"-Thema, kindgerecht und bunt.
- **heroMotif (Cover):** `cute animals at a birthday party with balloons and cake`
- **Cover-Prompt:** `coloring book style illustration of cute animals at a birthday party with balloons and cake, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a dancing bear in a sunny meadow
  2. a lion with a party hat deep in the jungle
  3. a elephant with balloons by the wide river
  4. a monkey on a swing across the savanna
  5. a giraffe with streamers at the waterhole
  6. a zebra with a drum in the forest
  7. a hippo with cake on a grassy hill
  8. a parrot with confetti near a jungle stream
  9. a fox with a gift in a sunny meadow
  10. a rabbit with a ribbon deep in the jungle
  11. a owl with a lantern by the wide river
  12. a deer with flowers across the savanna
  13. a raccoon with snacks at the waterhole
  14. a penguin with a horn in the forest
  15. a tiger with a banner on a grassy hill
  16. the whole animal party scene coming back together at sunset
- **Beispiel-Seitenprompts:**
  - *Seite 3:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, a fox carrying a birthday cake, full body view`
  - *Seite 16:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, all the animals dancing at the party, in a small scene with surroundings`

### Buch 3 — "Baby-Tiere" / "Baby Animals"
- **Slug:** `tiere-baby-tiere` · **Audience:** kids · **Seiten:** 16 · **Preis:** 4,99 €
- **Story:** Eine Reise durch einen Tag voller Tierbabys — jedes kleine Tier lernt etwas Neues,
  vom ersten Wackeln des Entenkükens bis zum Einschlafen des Bärenjungen.
- **Beschreibung (DE):** 16 herzige Tierbabys mit besonders großen, einfachen Formen. Küken, Welpe,
  Kätzchen, Lämmchen — ideal schon für die Kleinsten.
- **heroMotif (Cover):** `a cute baby kitten and puppy together`
- **Cover-Prompt:** `coloring book style illustration of a cute baby kitten and puppy together, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a fluffy lion cub in a sunny meadow
  2. a baby elephant deep in the jungle
  3. a fox kit by the wide river
  4. a fawn in the grass across the savanna
  5. a duckling at the waterhole
  6. a kitten in the forest
  7. a puppy on a grassy hill
  8. a bunny near a jungle stream
  9. a baby owl in a sunny meadow
  10. a piglet deep in the jungle
  11. a lamb by the wide river
  12. a chick across the savanna
  13. a bear cub at the waterhole
  14. a baby penguin in the forest
  15. a joey in a pouch on a grassy hill
  16. the whole baby animals scene coming back together at sunset
- **Beispiel-Seitenprompts:**
  - *Seite 2:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, a fluffy kitten playing with yarn, full body view`
  - *Seite 16:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, all the baby animals napping together, in a small scene with surroundings`

---

## K2 · Gemütliche Freunde  (`gemuetliche-freunde`, all)

> NEU★ — das BobbieGoods-/Cozy-Character-Format. Viral, familientauglich (Kinder + Erwachsene).
> Wiederkehrende Hauptfigur pro Buch sorgt für Bindung und Serien-Effekt.

### Buch 1 — "Bär Bruno und der gemütliche Tag" / "Bruno Bear's Cozy Day"
- **Slug:** `cozy-bruno-gemuetlicher-tag` · **Audience:** all · **Seiten:** 16 · **Preis:** 5,99 €
- **Story:** Begleite den kleinen Bären Bruno durch seinen gemütlichsten Tag — vom Aufwachen im
  Bettchen über Pfannkuchen, einen Regenspaziergang und Kakao bis zum Einschlafen mit seinem Teddy.
- **Beschreibung (DE):** 16 herzerwärmende Cozy-Szenen mit Bär Bruno im angesagten BobbieGoods-Stil.
  Eine durchgehende Wohlfühl-Geschichte zum Ausmalen — für Kinder und Erwachsene, die es kuschelig mögen.
- **heroMotif (Cover):** `a cute cozy bear in a sweater holding a cup of cocoa`
- **Cover-Prompt:** `coloring book style illustration of a cute cozy bear in a sweater holding a cup of cocoa, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a steaming teapot on a kitchen shelf
  2. a stack of pancakes by a sunny window
  3. a open storybook in a cozy cafe room
  4. a knitted blanket on a garden table
  5. a warm fireplace at a market stall
  6. a mug of cocoa in a warm kitchen
  7. a basket of muffins by the bakery window
  8. a sleepy bear bruno in a snug room
  9. a potted plant on a kitchen shelf
  10. a rocking chair by a sunny window
  11. a slice of pie in a cozy cafe room
  12. a candle and book on a garden table
  13. a honey jar at a market stall
  14. a soft cushion in a warm kitchen
  15. a window with rain by the bakery window
  16. the whole cozy bear day scene coming back together at sunset
- **Beispiel-Seitenprompts:**
  - *Seite 3:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, a bear making pancakes in the kitchen, in a small scene with surroundings`
  - *Seite 10:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, a bear wrapped in a blanket with cocoa, in a small scene with surroundings`

### Buch 2 — "Häschen Lottas Café" / "Lotta Bunny's Café"
- **Slug:** `cozy-lotta-cafe` · **Audience:** all · **Seiten:** 16 · **Preis:** 5,99 €
- **Story:** Das Häschen Lotta eröffnet ihr eigenes kleines Café — von der Vorbereitung am Morgen
  über das Backen, die ersten Gäste und den großen Mittagsansturm bis zum gemütlichen Feierabend.
- **Beschreibung (DE):** 16 zuckersüße Café-Szenen mit Häschen Lotta: Kuchen backen, Tee servieren,
  Tische decken. Cozy-Charme im Trend-Stil, ein Liebling für Klein und Groß.
- **heroMotif (Cover):** `a cute bunny baker holding a tray of cupcakes in a cozy cafe`
- **Cover-Prompt:** `coloring book style illustration of a cute bunny baker holding a tray of cupcakes in a cozy cafe, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a frothy latte cup on a kitchen shelf
  2. a tray of cupcakes by a sunny window
  3. a tea pot and cups in a cozy cafe room
  4. a slice of layer cake on a garden table
  5. a bunny lotta serving at a market stall
  6. a cookie jar in a warm kitchen
  7. a menu board by the bakery window
  8. a vase of daisies in a snug room
  9. a croissant basket on a kitchen shelf
  10. a sugar bowl by a sunny window
  11. a cafe window seat in a cozy cafe room
  12. a lemonade jug on a garden table
  13. a macaron stack at a market stall
  14. a cream tart in a warm kitchen
  15. a checkered tablecloth by the bakery window
  16. the whole bunny cafe scene coming back together at sunset
- **Beispiel-Seitenprompts:**
  - *Seite 4:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, a bunny pulling cupcakes from the oven, in a small scene with surroundings`
  - *Seite 11:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, two animal friends at a cafe table, in a small scene with surroundings`

### Buch 3 — "Kater Mio am Meer" / "Mio Cat by the Sea"
- **Slug:** `cozy-mio-am-meer` · **Audience:** all · **Seiten:** 16 · **Preis:** 5,99 €
- **Story:** Kater Mio macht einen Sommerausflug ans Meer — vom Kofferpacken über die Bahnfahrt,
  Sandburgen, ein Picknick am Strand bis zum Sonnenuntergang mit Muscheln in der Tasche.
- **Beschreibung (DE):** 16 sonnige Cozy-Szenen mit Kater Mio am Meer: Strand, Boot, Eis, Muscheln.
  Sommerliche Wohlfühl-Reise im beliebten Charakter-Stil.
- **heroMotif (Cover):** `a cute cat in a sun hat sitting on a beach with a bucket`
- **Cover-Prompt:** `coloring book style illustration of a cute cat in a sun hat sitting on a beach with a bucket, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a cat mio with a bucket over the coral reef
  2. a sandcastle in the open sea
  3. a striped beach umbrella on the sandy seabed
  4. a seashell pile in a kelp forest
  5. a little sailboat near a bright lagoon
  6. a crab on the sand along the ocean current
  7. a starfish by a rocky reef
  8. a beach ball above the seabed
  9. a message in a bottle over the coral reef
  10. a picnic basket in the open sea
  11. a kite in the wind on the sandy seabed
  12. a deck chair in a kelp forest
  13. a seagull near a bright lagoon
  14. a ice cream cone along the ocean current
  15. a lighthouse by a rocky reef
  16. the whole cat at the sea scene coming back together at sunset
- **Beispiel-Seitenprompts:**
  - *Seite 6:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, a cat building a sandcastle, in a small scene with surroundings`
  - *Seite 15:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, a cat watching the sunset on the sand, in a small scene with surroundings`

---

## K3 · Dino-Welt  (`dino-welt`, kids)

> Behalten. Kinder-Evergreen mit hohem Suchvolumen.

### Buch 1 — "Abenteuer im Dinotal" / "Adventure in Dino Valley"
- **Slug:** `dino-abenteuer-dinotal` · **Audience:** kids · **Seiten:** 16 · **Preis:** 4,99 €
- **Story:** Eine Reise durch das Urzeittal an einem Tag — vom Schlüpfen eines Dino-Babys am Morgen
  über fröhliche Pflanzenfresser und einen freundlichen T-Rex bis zum Sonnenuntergang am Vulkan.
- **Beschreibung (DE):** 16 freundliche Dinosaurier mit dicken Linien: T-Rex, Triceratops, Brachiosaurus,
  Flugsaurier. Großes Abenteuer für kleine Dino-Fans.
- **heroMotif (Cover):** `a cute friendly t-rex and triceratops in a valley`
- **Cover-Prompt:** `coloring book style illustration of a cute friendly t-rex and triceratops in a valley, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a baby dinosaur hatching from an egg
  2. a friendly long-neck brontosaurus eating leaves
  3. a happy triceratops
  4. a smiling t-rex with tiny arms
  5. a stegosaurus with back plates
  6. a flying pterodactyl
  7. a baby dino chasing a dragonfly
  8. two dinos splashing in a lake
  9. a parasaurolophus by the trees
  10. a dino family walking together
  11. an ankylosaurus with a club tail
  12. a dino peeking from behind a fern
  13. a volcano in the distance with dinos
  14. a velociraptor running
  15. a dino nest with eggs
  16. all the dinosaurs together at sunset
- **Beispiel-Seitenprompts:**
  - *Seite 4:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, a smiling t-rex with tiny arms, full body view`
  - *Seite 16:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, all the dinosaurs together at sunset, in a small scene with surroundings`

### Buch 2 — "Baby-Dinos" / "Baby Dinos"
- **Slug:** `dino-baby-dinos` · **Audience:** kids · **Seiten:** 16 · **Preis:** 4,99 €
- **Story:** Ein Tag im Dino-Kindergarten — die kleinen Dinos schlüpfen, spielen, lernen laufen und
  kuscheln sich am Abend in ihr Nest. Besonders große, einfache Formen für die Kleinsten.
- **Beschreibung (DE):** 16 super-niedliche Baby-Dinos mit extra dicken Linien. Der sanfte Einstieg
  in die Dino-Welt — schon für Kindergartenkinder geeignet.
- **heroMotif (Cover):** `a cute baby dinosaur hatching from an egg`
- **Cover-Prompt:** `coloring book style illustration of a cute baby dinosaur hatching from an egg, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a t-rex hatchling in the deep jungle
  2. a triceratops calf by a rocky cave
  3. a stegosaurus baby across the wide river
  4. a baby brontosaurus in the green valley
  5. a pterodactyl chick below the volcano
  6. a egg cracking open in a fern grove
  7. a two playful hatchlings on a rocky hill
  8. a sleepy little dino near a jungle lake
  9. a curious baby dino in the deep jungle
  10. a raptor chick by a rocky cave
  11. a ankylosaurus baby across the wide river
  12. a duckbill hatchling in the green valley
  13. a baby dino with a bug below the volcano
  14. a nest of eggs in a fern grove
  15. a hatchling on a leaf on a rocky hill
  16. the whole baby dinos scene coming back together at sunset
- **Beispiel-Seitenprompts:**
  - *Seite 2:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, a tiny t-rex taking first steps, full body view`
  - *Seite 16:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, all the baby dinos cuddling in a nest, in a small scene with surroundings`

### Buch 3 — "Das große Vulkan-Abenteuer" / "The Great Volcano Adventure"
- **Slug:** `dino-vulkane` · **Audience:** kids · **Seiten:** 16 · **Preis:** 4,99 €
- **Story:** Ein großes Dino-Abenteuer rund um den Feuerberg — die Dinos entdecken Höhlen, überqueren
  Flüsse und erleben den rauchenden Vulkan, bevor sie sicher ins Tal zurückkehren.
- **Beschreibung (DE):** 16 actionreiche, aber kindgerechte Dino-Szenen mit Vulkanen, Höhlen und
  Urwald. Etwas mehr Szenerie für ältere Dino-Fans.
- **heroMotif (Cover):** `a friendly t-rex roaring near a smoking volcano`
- **Cover-Prompt:** `coloring book style illustration of a friendly t-rex roaring near a smoking volcano, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a smoking volcano in the deep jungle
  2. a t-rex explorer by a rocky cave
  3. a triceratops on a trail across the wide river
  4. a brontosaurus by a tree in the green valley
  5. a pterodactyl overhead below the volcano
  6. a stegosaurus near rocks in a fern grove
  7. a raptor pack on a rocky hill
  8. a river crossing on stones near a jungle lake
  9. a glowing lava flow in the deep jungle
  10. a ferns and footprints by a rocky cave
  11. a dino drinking water across the wide river
  12. a rocky cave mouth in the green valley
  13. a ash cloud below the volcano
  14. a dino lookout in a fern grove
  15. a herd on the move on a rocky hill
  16. the whole volcano adventure scene coming back together at sunset
- **Beispiel-Seitenprompts:**
  - *Seite 1:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, a smoking volcano with dinosaurs below, in a small scene with surroundings`
  - *Seite 13:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, a dino family at the cave for shelter, in a small scene with surroundings`

---
## K4 · Fahrzeuge & Maschinen  (`fahrzeuge-maschinen`, kids)

> Behalten. Kinder-Evergreen, besonders beliebt bei jüngeren Kindern.

### Buch 1 — "Ein Tag auf der Baustelle" / "A Day at the Construction Site"
- **Slug:** `fahrzeuge-baustelle` · **Audience:** kids · **Seiten:** 16 · **Preis:** 4,99 €
- **Story:** Von Sonnenaufgang bis Feierabend auf der Baustelle — Bagger gräbt, Kran hebt, Betonmischer
  rührt, bis am Ende das neue Haus fertig dasteht. Eine Maschinen-Geschichte mit Ziel.
- **Beschreibung (DE):** 16 große Baufahrzeuge mit dicken Linien: Bagger, Kran, Kipplaster, Walze.
  Maschinen-Spaß für kleine Baumeister.
- **heroMotif (Cover):** `a cute excavator and dump truck at a construction site`
- **Cover-Prompt:** `coloring book style illustration of a cute excavator and dump truck at a construction site, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a yellow excavator in the old town
  2. a dump truck by the cathedral
  3. a tower crane on a cobbled street
  4. a cement mixer at the market square
  5. a bulldozer below the clock tower
  6. a road roller across a stone bridge
  7. a front loader along a quiet alley
  8. a scaffolding frame in a courtyard
  9. a wheelbarrow in the old town
  10. a traffic cone row by the cathedral
  11. a digger bucket on a cobbled street
  12. a pile of bricks at the market square
  13. a crane hook below the clock tower
  14. a concrete pipe across a stone bridge
  15. a site office along a quiet alley
  16. the whole construction site scene coming back together at sunset
- **Beispiel-Seitenprompts:**
  - *Seite 1:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, an excavator digging a hole, full body view`
  - *Seite 16:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, the finished house with all the vehicles, in a small scene with surroundings`

### Buch 2 — "Das große Wettrennen" / "The Great Race Day"
- **Slug:** `fahrzeuge-rennen-flitzen` · **Audience:** kids · **Seiten:** 16 · **Preis:** 4,99 €
- **Story:** Ein großer Renntag — von der Startlinie über schnelle Rennautos, Motorräder und einen
  Monstertruck bis zum Pokal auf dem Siegerpodest. Tempo-Geschichte für Speed-Fans.
- **Beschreibung (DE):** 16 schnelle Fahrzeuge mit dicken Linien: Rennwagen, Motorrad, Monstertruck,
  Go-Kart. Action und Tempo, kindgerecht und bunt.
- **heroMotif (Cover):** `a cute race car zooming with a checkered flag`
- **Cover-Prompt:** `coloring book style illustration of a cute race car zooming with a checkered flag, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a speedy race car in the old town
  2. a checkered flag by the cathedral
  3. a motorbike racer on a cobbled street
  4. a go-kart at the market square
  5. a pit stop crew below the clock tower
  6. a trophy on a stand across a stone bridge
  7. a starting grid along a quiet alley
  8. a fast formula car in a courtyard
  9. a racing helmet in the old town
  10. a tire stack by the cathedral
  11. a finish line banner on a cobbled street
  12. a fuel can at the market square
  13. a spectator stand below the clock tower
  14. a winner's podium across a stone bridge
  15. a speed sign along a quiet alley
  16. the whole the big race scene coming back together at sunset
- **Beispiel-Seitenprompts:**
  - *Seite 4:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, a monster truck with big wheels, full body view`
  - *Seite 13:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, a race car crossing the finish line, in a small scene with surroundings`

### Buch 3 — "Fahrzeuge, die helfen" / "Vehicles That Help"
- **Slug:** `fahrzeuge-die-helfen` · **Audience:** kids · **Seiten:** 16 · **Preis:** 4,99 €
- **Story:** Ein Tag in der Stadt, an dem überall geholfen wird — das Feuerwehrauto löscht, der
  Krankenwagen eilt, der Müllwagen räumt auf. Helfer-Fahrzeuge im fröhlichen Einsatz.
- **Beschreibung (DE):** 16 hilfsbereite Fahrzeuge mit dicken Linien: Feuerwehr, Polizei, Krankenwagen,
  Müllwagen, Traktor. Verbindet Fahrzeug-Spaß mit Berufen.
- **heroMotif (Cover):** `a cute fire truck and ambulance in a town`
- **Cover-Prompt:** `coloring book style illustration of a cute fire truck and ambulance in a town, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a fire truck with a ladder
  2. an ambulance with a siren
  3. a police car
  4. a garbage truck lifting a bin
  5. a tractor with a trailer
  6. a school bus full of kids
  7. a mail delivery van
  8. a tow truck
  9. a street sweeper
  10. a snow plow clearing snow
  11. a helicopter landing
  12. a rescue boat
  13. a delivery truck with boxes
  14. a crane truck helping
  15. a fire truck spraying water
  16. all the helper vehicles in the town
- **Beispiel-Seitenprompts:**
  - *Seite 1:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, a fire truck with a ladder, full body view`
  - *Seite 16:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, all the helper vehicles in the town, in a small scene with surroundings`

---

## K5 · Weltraum & Planeten  (`weltraum-planeten`, kids)

> Behalten. Kinder-Liebling, verbindet Spiel mit Lernen.

### Buch 1 — "Reise zu den Sternen" / "Journey to the Stars"
- **Slug:** `weltraum-reise-zu-den-sternen` · **Audience:** kids · **Seiten:** 16 · **Preis:** 4,99 €
- **Story:** Ein kleiner Astronaut startet ins All — vom Countdown an der Rakete über den Flug an
  Planeten vorbei, ein Picknick auf dem Mond bis zur Heimkehr mit einem Glas voller Sterne.
- **Beschreibung (DE):** 16 fröhliche Weltraum-Szenen mit dicken Linien: Rakete, Astronaut, Planeten,
  Mond, Sterne. Großes Abenteuer für kleine Entdecker.
- **heroMotif (Cover):** `a cute astronaut floating with a rocket and planets`
- **Cover-Prompt:** `coloring book style illustration of a cute astronaut floating with a rocket and planets, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a rocket on the launch pad with countdown
  2. a rocket blasting off
  3. a cute astronaut floating in space
  4. the earth seen from space
  5. a smiling moon with craters
  6. a planet with a big ring
  7. an astronaut planting a flag on the moon
  8. a friendly alien waving
  9. a UFO with lights
  10. a shooting star and comet
  11. an astronaut having a moon picnic
  12. a space rover driving
  13. a constellation of stars
  14. a satellite orbiting
  15. an astronaut collecting stars in a jar
  16. the rocket flying home past the planets
- **Beispiel-Seitenprompts:**
  - *Seite 3:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, a cute astronaut floating in space, full body view`
  - *Seite 16:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, the rocket flying home past the planets, in a small scene with surroundings`

### Buch 2 — "Freunde im All" / "Friends in Space"
- **Slug:** `weltraum-freunde-im-all` · **Audience:** kids · **Seiten:** 16 · **Preis:** 4,99 €
- **Story:** Ein Astronaut trifft im All neue Freunde — niedliche Aliens, einen Roboter und sprechende
  Planeten. Gemeinsam erleben sie eine fröhliche Sternenparty. Freundschafts-Geschichte im Weltraum.
- **Beschreibung (DE):** 16 niedliche Weltraum-Freunde mit dicken Linien: Aliens, Roboter, lächelnde
  Planeten, Sternenwesen. Verspielt und herzig.
- **heroMotif (Cover):** `a cute alien and robot waving in space`
- **Cover-Prompt:** `coloring book style illustration of a cute alien and robot waving in space, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a friendly one-eyed alien
  2. a cute robot with antennae
  3. a smiling planet with a face
  4. an alien spaceship with friends inside
  5. a star with a happy face
  6. an astronaut shaking hands with an alien
  7. a three-eyed alien holding a balloon
  8. a robot dog floating
  9. a moon wearing a nightcap
  10. aliens playing with a ball
  11. a comet with a smiling face
  12. a tiny alien on a small planet
  13. a robot and astronaut high-fiving
  14. a group of aliens dancing
  15. a star party with planets
  16. all the space friends together
- **Beispiel-Seitenprompts:**
  - *Seite 6:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, an astronaut shaking hands with an alien, in a small scene with surroundings`
  - *Seite 16:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, all the space friends together, in a small scene with surroundings`

### Buch 3 — "Die acht Planeten" / "The Eight Planets" (lernend)
- **Slug:** `weltraum-acht-planeten` · **Audience:** kids · **Seiten:** 15 · **Preis:** 4,99 €
- **Story:** Eine lehrreiche Reise von der Sonne nach außen — Planet für Planet, von Merkur bis Neptun,
  jeder mit einem freundlichen Gesicht. Spielerisch das Sonnensystem entdecken.
- **Beschreibung (DE):** 15 Seiten zum spielerischen Lernen des Sonnensystems: Sonne, alle acht
  Planeten, Mond, Asteroiden. Educational Coloring im Trend — Spaß plus Wissen.
- **heroMotif (Cover):** `cute smiling planets of the solar system in a row`
- **Cover-Prompt:** `coloring book style illustration of cute smiling planets of the solar system in a row, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→15):**
  1. a fiery mercury drifting in orbit
  2. a cloudy venus across a starfield
  3. a blue earth near a giant planet
  4. a red mars past the glowing moon
  5. a giant jupiter in a swirling galaxy
  6. a ringed saturn among distant stars
  7. a tilted uranus beside a ringed planet
  8. a deep-blue neptune through a nebula cloud
  9. a bright sun drifting in orbit
  10. a zooming comet across a starfield
  11. a asteroid belt near a giant planet
  12. a crescent moon past the glowing moon
  13. a rocket ship in a swirling galaxy
  14. a shooting star among distant stars
  15. the whole the planets scene coming back together at sunset
- **Beispiel-Seitenprompts:**
  - *Seite 7:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, saturn with big rings, centered composition`
  - *Seite 15:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, the whole solar system around the sun, in a small scene with surroundings`

---

## K6 · Einhörner & Regenbogen  (`einhoerner-regenbogen`, kids)

> Behalten. Mädchen-Evergreen, hohe Nachfrage.

### Buch 1 — "Im Land der Einhörner" / "In the Land of Unicorns"
- **Slug:** `einhorn-im-land-der-einhoerner` · **Audience:** kids · **Seiten:** 16 · **Preis:** 4,99 €
- **Story:** Eine Reise ins Einhornland — über die Regenbogenbrücke, vorbei an Wolkenschlössern und
  blühenden Wiesen bis zum großen Einhornfest unter den Sternen.
- **Beschreibung (DE):** 16 zauberhafte Einhörner mit dicken Linien: Regenbogen, Wolken, Sterne,
  Schloss. Magisches Ausmalen für kleine Träumer.
- **heroMotif (Cover):** `a cute unicorn with a flowing mane and a rainbow`
- **Cover-Prompt:** `coloring book style illustration of a cute unicorn with a flowing mane and a rainbow, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a prancing unicorn in the enchanted forest
  2. a rainbow arch across a rainbow meadow
  3. a crystal castle by a crystal cave
  4. a winged pegasus in a starlit clearing
  5. a flower meadow foal in a flower garden
  6. a star-maned unicorn over a misty hill
  7. a magic fountain by a sparkling pond
  8. a cloud bridge deep in the woods
  9. a gem-studded crown in the enchanted forest
  10. a fairy companion across a rainbow meadow
  11. a heart-shaped tree by a crystal cave
  12. a sparkle pond in a starlit clearing
  13. a candy hill in a flower garden
  14. a shooting star over a misty hill
  15. a ribbon banner by a sparkling pond
  16. the whole unicorn land scene coming back together at sunset
- **Beispiel-Seitenprompts:**
  - *Seite 1:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, a cute unicorn standing in a meadow, full body view`
  - *Seite 16:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, all the unicorns under the rainbow, in a small scene with surroundings`

### Buch 2 — "Einhorn Stella und der Regenbogenzauber" / "Stella the Unicorn"
- **Slug:** `einhorn-stella-regenbogenzauber` · **Audience:** kids · **Seiten:** 16 · **Preis:** 4,99 €
- **Story:** Das Einhorn Stella muss die verschwundenen Regenbogenfarben zurückholen — eine Heldinnen-
  Reise von Farbe zu Farbe, bis der Regenbogen wieder leuchtet. Charakter-Geschichte mit Spannung.
- **Beschreibung (DE):** 16 Seiten mit der wiederkehrenden Heldin Stella auf magischer Mission:
  Regenbogen, Edelsteine, Wolken, Sterne. Spannend und verträumt.
- **heroMotif (Cover):** `a cute unicorn named stella with a rainbow horn and gems`
- **Cover-Prompt:** `coloring book style illustration of a cute unicorn with a rainbow horn surrounded by gems and stars, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a unicorn stella prancing in the enchanted forest
  2. a rainbow ribbon across a rainbow meadow
  3. a glowing horn by a crystal cave
  4. a sparkle trail in a starlit clearing
  5. a flower crown in a flower garden
  6. a cloud castle over a misty hill
  7. a star wand by a sparkling pond
  8. a butterfly friend deep in the woods
  9. a crystal pond in the enchanted forest
  10. a magic gem across a rainbow meadow
  11. a heart balloon by a crystal cave
  12. a fairy light in a starlit clearing
  13. a candy tree in a flower garden
  14. a moonbeam over a misty hill
  15. a wish fountain by a sparkling pond
  16. the whole stella's rainbow magic scene coming back together at sunset
- **Beispiel-Seitenprompts:**
  - *Seite 2:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, a unicorn finding a red gem, in a small scene with surroundings`
  - *Seite 14:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, the rainbow glowing bright again, in a small scene with surroundings`

### Buch 3 — "Magische Wesen" / "Magical Creatures"
- **Slug:** `einhorn-magische-wesen` · **Audience:** kids · **Seiten:** 16 · **Preis:** 4,99 €
- **Story:** Eine Reise durch ein Reich voller magischer Wesen — Einhörner, Pegasusse, kleine Drachen
  und Feen treffen sich zum Zauberfest. Bunte Fantasie für Fans des Magischen.
- **Beschreibung (DE):** 16 magische Wesen mit dicken Linien: Einhorn, Pegasus, Mini-Drache, Fee,
  Meerjungfrau. Die ganze Fantasiewelt in einem Buch.
- **heroMotif (Cover):** `a cute unicorn pegasus and baby dragon together`
- **Cover-Prompt:** `coloring book style illustration of a cute unicorn pegasus and baby dragon together, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a cute unicorn with a star
  2. a winged pegasus flying
  3. a friendly baby dragon
  4. a little fairy with a wand
  5. a mermaid waving
  6. a phoenix with bright feathers
  7. a magic castle on a hill
  8. a tiny pixie on a flower
  9. a unicorn and a dragon playing
  10. a fairy riding a butterfly
  11. a friendly forest gnome
  12. a magic crystal glowing
  13. a pegasus and a rainbow
  14. a fairy ring of mushrooms
  15. magical creatures at a festival
  16. all the magical creatures together
- **Beispiel-Seitenprompts:**
  - *Seite 3:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, a friendly baby dragon, full body view`
  - *Seite 16:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, all the magical creatures together, in a small scene with surroundings`

---
## K7 · Zauberwald & Feen  (`zauberwald-feen`, all)

> Behalten. Cottagecore-nah, familientauglich (Kinder + Erwachsene).

### Buch 1 — "Das Geheimnis des Zauberwalds" / "The Secret of the Enchanted Forest"
- **Slug:** `zauberwald-geheimnis` · **Audience:** all · **Seiten:** 16 · **Preis:** 5,99 €
- **Story:** Ein Spaziergang tief in den Zauberwald — vorbei an Pilzhäuschen, sprechenden Bäumen und
  Glühwürmchen bis zur geheimen Lichtung, wo die Feen tanzen.
- **Beschreibung (DE):** 16 verwunschene Waldszenen mit mittlerem Detailgrad: Pilzhäuser, Feen,
  Baumgesichter, Glühwürmchen. Magisch für Kinder, hübsch genug für Erwachsene.
- **heroMotif (Cover):** `a magical mushroom house with a fairy in an enchanted forest`
- **Cover-Prompt:** `coloring book style illustration of a magical mushroom house with a fairy in an enchanted forest, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a forest path with glowing mushrooms
  2. a little mushroom house with a door
  3. a tree with a friendly face
  4. a fairy sitting on a flower
  5. a toadstool village
  6. a gnome with a lantern
  7. fireflies dancing over a stream
  8. a fairy with delicate wings
  9. a hidden door in a tree trunk
  10. a snail on a mushroom
  11. a fairy ring of flowers
  12. an owl watching from a branch
  13. a tiny bridge over a brook
  14. a deer in a moonlit clearing
  15. fairies dancing in a circle
  16. the full enchanted forest clearing at night, and finally everything comes back together
- **Beispiel-Seitenprompts:**
  - *Seite 4:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, a fairy sitting on a flower, centered composition`
  - *Seite 16:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, the full enchanted forest clearing at night, in a small scene with surroundings`

### Buch 2 — "Fee Lumi und das Sternenlicht" / "Lumi the Fairy and the Starlight"
- **Slug:** `zauberwald-fee-lumi` · **Audience:** all · **Seiten:** 16 · **Preis:** 5,99 €
- **Story:** Die kleine Fee Lumi sammelt Sternenlicht, um den dunklen Wald wieder zum Leuchten zu
  bringen — eine zarte Heldinnen-Reise von Blüte zu Blüte, bis der ganze Wald funkelt.
- **Beschreibung (DE):** 16 Seiten mit der wiederkehrenden Fee Lumi: Laternen, Blüten, Glühwürmchen,
  Sterne. Eine poetische Lichtgeschichte zum Ausmalen.
- **heroMotif (Cover):** `a cute fairy holding a glowing lantern among flowers`
- **Cover-Prompt:** `coloring book style illustration of a cute fairy holding a glowing lantern among flowers, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a fairy lumi flying in the enchanted forest
  2. a glowing lantern flower across a rainbow meadow
  3. a mushroom house by a crystal cave
  4. a firefly swarm in a starlit clearing
  5. a wise old owl in a flower garden
  6. a acorn cottage over a misty hill
  7. a star-shaped leaf by a sparkling pond
  8. a dewdrop on a web deep in the woods
  9. a tiny gnome in the enchanted forest
  10. a moonflower bloom across a rainbow meadow
  11. a sparkling stream by a crystal cave
  12. a toadstool ring in a starlit clearing
  13. a hedgehog friend in a flower garden
  14. a crystal pebble over a misty hill
  15. a willow with lights by a sparkling pond
  16. the whole fairy lumi's starlight scene coming back together at sunset
- **Beispiel-Seitenprompts:**
  - *Seite 3:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, a fairy catching a falling star, in a small scene with surroundings`
  - *Seite 16:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, the whole forest sparkling with starlight, in a small scene with surroundings`

### Buch 3 — "Zu Besuch bei den Waldtieren" / "Visiting the Forest Animals"
- **Slug:** `zauberwald-waldtiere-haeuser` · **Audience:** kids · **Seiten:** 16 · **Preis:** 4,99 €
- **Story:** Eine Reise durch den Wald, bei der wir entdecken, wo alle Tiere wohnen — vom Fuchsbau
  über das Eichhörnchen-Nest bis zum gemütlichen Igelhaus unter den Wurzeln.
- **Beschreibung (DE):** 16 niedliche Waldtiere in ihren gemütlichen Behausungen, dicke Linien.
  Cozy-Wald für Kinder mit kleinem Lerneffekt über Tierheime.
- **heroMotif (Cover):** `a cute fox and squirrel in a cozy forest tree house`
- **Cover-Prompt:** `coloring book style illustration of a cute fox and squirrel in a cozy forest tree house, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a fox peeking from its cozy den
  2. a squirrel in a tree nest with acorns
  3. a hedgehog house under tree roots
  4. an owl in a tree hollow
  5. a rabbit in a burrow with carrots
  6. a beaver lodge by the stream
  7. a mouse in a tiny acorn house
  8. a bird family in a nest
  9. a badger at its tunnel door
  10. a frog on a lily pad home
  11. a bee in a honeycomb hive
  12. a deer resting in tall grass
  13. a chipmunk gathering seeds
  14. a turtle in a log
  15. all the animal homes in one tree
  16. the whole forest village of animal homes
- **Beispiel-Seitenprompts:**
  - *Seite 1:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, a fox peeking from its cozy den, in a small scene with surroundings`
  - *Seite 16:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, the whole forest village of animal homes, in a small scene with surroundings`

---

## K8 · Meerjungfrauen & Meereszauber  (`meerjungfrauen`, kids)

> NEU. Stark nachgefragte Mädchen-Fantasy-Nische, ergänzt die Ozean-Welt.

### Buch 1 — "Im Reich der Meerjungfrauen" / "In the Mermaid Kingdom"
- **Slug:** `meerjungfrau-reich` · **Audience:** kids · **Seiten:** 16 · **Preis:** 4,99 €
- **Story:** Eine Reise durch das Unterwasser-Königreich — von der Korallenstadt über den Perlenmarkt
  bis zum großen Fest im Muschelschloss. Glitzernde Meereswelt für kleine Träumer.
- **Beschreibung (DE):** 16 zauberhafte Meerjungfrauen-Szenen mit dicken Linien: Korallenschloss,
  Seepferdchen, Muscheln, Perlen. Magisches Unterwasser-Ausmalen.
- **heroMotif (Cover):** `a cute mermaid with a seashell crown and a seahorse`
- **Cover-Prompt:** `coloring book style illustration of a cute mermaid with a seashell crown and a seahorse, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a cute mermaid swimming
  2. a coral castle in the sea
  3. a mermaid with a seashell crown
  4. a friendly seahorse
  5. a mermaid riding a dolphin
  6. a treasure chest with pearls
  7. a mermaid combing her hair with a shell
  8. a baby mermaid with a fish friend
  9. a pearl market with shells
  10. a mermaid and a sea turtle
  11. a starfish and bubbles
  12. a mermaid singing on a rock
  13. a clam with a big pearl
  14. mermaids playing with fish
  15. a grand shell palace ballroom
  16. all the mermaids at the underwater festival
- **Beispiel-Seitenprompts:**
  - *Seite 1:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, a cute mermaid swimming, full body view`
  - *Seite 16:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, all the mermaids at the underwater festival, in a small scene with surroundings`

### Buch 2 — "Meerjungfrau Perla und die verlorene Perle" / "Perla and the Lost Pearl"
- **Slug:** `meerjungfrau-perla-perle` · **Audience:** kids · **Seiten:** 16 · **Preis:** 4,99 €
- **Story:** Die Meerjungfrau Perla sucht die verlorene Zauberperle des Meeres — eine Abenteuer-Reise
  durch Höhlen, Schiffswracks und Korallengärten, bis sie die Perle zurück ins Schloss bringt.
- **Beschreibung (DE):** 16 Seiten mit der Heldin Perla auf Schatzsuche: Höhlen, Wracks, Tintenfisch,
  Schatz. Spannendes Unterwasser-Abenteuer im wiederkehrenden Charakter-Format.
- **heroMotif (Cover):** `a cute mermaid holding a glowing pearl near a shipwreck`
- **Cover-Prompt:** `coloring book style illustration of a cute mermaid holding a glowing pearl near a shipwreck, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a mermaid perla swimming over the coral reef
  2. a giant glowing pearl in the open sea
  3. a open treasure clam on the sandy seabed
  4. a seahorse guide in a kelp forest
  5. a coral archway near a bright lagoon
  6. a dolphin friend along the ocean current
  7. a sunken ship by a rocky reef
  8. a jellyfish lantern above the seabed
  9. a starfish marker over the coral reef
  10. a octopus in a cave in the open sea
  11. a kelp curtain on the sandy seabed
  12. a pearl oyster bed in a kelp forest
  13. a ray gliding by near a bright lagoon
  14. a bubble trail along the ocean current
  15. a shell crown by a rocky reef
  16. the whole perla's lost pearl scene coming back together at sunset
- **Beispiel-Seitenprompts:**
  - *Seite 6:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, a mermaid exploring a sunken ship, in a small scene with surroundings`
  - *Seite 14:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, the pearl shining on its stand again, in a small scene with surroundings`

### Buch 3 — "Unterwegs mit den Meeresfreunden" / "Adventures with the Sea Friends"
- **Slug:** `meerjungfrau-tierfreunde` · **Audience:** kids · **Seiten:** 16 · **Preis:** 4,99 €
- **Story:** Jede Meerjungfrau hat einen tierischen Freund — eine fröhliche Reise durchs Meer, bei
  der wir Delfin, Schildkröte, Seestern und Co. besuchen. Freundschafts-Geschichte unter Wasser.
- **Beschreibung (DE):** 16 Seiten mit Meerjungfrauen und niedlichen Meerestieren, dicke Linien.
  Verbindet Meerjungfrauen-Magie mit dem Tier-Liebling-Thema.
- **heroMotif (Cover):** `a cute mermaid hugging a dolphin friend`
- **Cover-Prompt:** `coloring book style illustration of a cute mermaid hugging a dolphin friend, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a mermaid with a turtle over the coral reef
  2. a playful dolphin pod in the open sea
  3. a seahorse herd on the sandy seabed
  4. a clownfish school in a kelp forest
  5. a gentle whale near a bright lagoon
  6. a octopus juggling shells along the ocean current
  7. a crab band by a rocky reef
  8. a sea otter above the seabed
  9. a puffer fish over the coral reef
  10. a manta ray in the open sea
  11. a starfish cluster on the sandy seabed
  12. a jellyfish drift in a kelp forest
  13. a baby seal near a bright lagoon
  14. a angelfish pair along the ocean current
  15. a narwhal by a rocky reef
  16. the whole mermaid sea friends scene coming back together at sunset
- **Beispiel-Seitenprompts:**
  - *Seite 4:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, a mermaid riding a seahorse, full body view`
  - *Seite 16:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, all the mermaids and sea friends together, in a small scene with surroundings`

---

## K9 · Bauernhof & Tierfreunde  (`bauernhof`, kids)

> NEU. Cozy-Farm + Bold-&-Easy-Tiere — sehr starke Kombination für jüngere Kinder.

### Buch 1 — "Ein Tag auf dem Bauernhof" / "A Day on the Farm"
- **Slug:** `bauernhof-ein-tag` · **Audience:** kids · **Seiten:** 16 · **Preis:** 4,99 €
- **Story:** Von früh bis spät auf dem Bauernhof — der Hahn weckt alle, die Kühe werden gefüttert,
  Eier eingesammelt, bis am Abend alle Tiere müde in den Stall gehen.
- **Beschreibung (DE):** 16 fröhliche Bauernhoftiere mit dicken Linien: Kuh, Schwein, Huhn, Schaf,
  Pferd, Traktor. Der Klassiker für die Kleinsten.
- **heroMotif (Cover):** `a cute cow pig and chicken in front of a barn`
- **Cover-Prompt:** `coloring book style illustration of a cute cow pig and chicken in front of a barn, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a rooster crowing on a fence
  2. a big red barn with a sun
  3. a friendly cow with a bell
  4. a happy pig in the mud
  5. a hen with little chicks
  6. a fluffy sheep
  7. a horse in the stable
  8. a farmer feeding the animals
  9. a goat on a hay bale
  10. a duck pond with ducklings
  11. a tractor in the field
  12. a basket of fresh eggs
  13. a cat chasing a mouse in the barn
  14. a scarecrow in the corn
  15. a wheelbarrow of vegetables
  16. all the farm animals at sunset by the barn
- **Beispiel-Seitenprompts:**
  - *Seite 3:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, a friendly cow with a bell, full body view`
  - *Seite 16:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, all the farm animals at sunset by the barn, in a small scene with surroundings`

### Buch 2 — "Die kleinen Bauernhofbabys" / "The Little Farm Babies"
- **Slug:** `bauernhof-tierbabys` · **Audience:** kids · **Seiten:** 15 · **Preis:** 4,99 €
- **Story:** Ein Frühlingstag voller Tierbabys auf dem Hof — vom Küken, das schlüpft, bis zum Fohlen,
  das seine ersten Schritte macht. Ganz große, einfache Formen für die Allerkleinsten.
- **Beschreibung (DE):** 15 super-niedliche Bauernhof-Babys mit extra dicken Linien: Küken, Ferkel,
  Lämmchen, Fohlen. Erstes Ausmalen ab dem Kindergarten.
- **heroMotif (Cover):** `a cute baby chick piglet and lamb together`
- **Cover-Prompt:** `coloring book style illustration of a cute baby chick piglet and lamb together, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→15):**
  1. a fluffy chick by the red barn
  2. a wobbly lamb in a green meadow
  3. a piglet across the farm field
  4. a calf in the orchard
  5. a foal on the pasture
  6. a duckling near the duck pond
  7. a kitten in hay by the chicken coop
  8. a puppy by the gate beside the stable
  9. a goat kid by the red barn
  10. a bunny in a green meadow
  11. a gosling across the farm field
  12. a donkey foal in the orchard
  13. a turkey poult on the pasture
  14. a baby goose near the duck pond
  15. the whole farm babies scene coming back together at sunset
- **Beispiel-Seitenprompts:**
  - *Seite 2:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, a baby piglet, full body view`
  - *Seite 15:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, all the farm babies together, in a small scene with surroundings`

### Buch 3 — "Im Gemüsegarten" / "In the Vegetable Garden"
- **Slug:** `bauernhof-gemuesegarten` · **Audience:** kids · **Seiten:** 16 · **Preis:** 4,99 €
- **Story:** Eine Reise durch das Gartenjahr auf dem Hof — Samen säen, gießen, wachsen sehen und am
  Ende den großen Korb voll Gemüse ernten. Mit netten Tier-Helfern an jeder Ecke.
- **Beschreibung (DE):** 16 Seiten rund um Garten und Ernte mit dicken Linien: Möhren, Kürbisse,
  Tomaten, Gartentiere. Spielerischer Bezug zu Natur und Essen.
- **heroMotif (Cover):** `a cute rabbit with a basket of garden vegetables`
- **Cover-Prompt:** `coloring book style illustration of a cute rabbit with a basket of garden vegetables, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a ripe tomato vine by the red barn
  2. a row of carrots in a green meadow
  3. a leafy lettuce head across the farm field
  4. a pumpkin on the ground in the orchard
  5. a corn stalk on the pasture
  6. a pea pods on a trellis near the duck pond
  7. a potato patch by the chicken coop
  8. a scarecrow beside the stable
  9. a watering can by the red barn
  10. a bee on a blossom in a green meadow
  11. a ladybird on a leaf across the farm field
  12. a wheelbarrow of veg in the orchard
  13. a garden snail on the pasture
  14. a sunflower near the duck pond
  15. a basket of harvest by the chicken coop
  16. the whole vegetable garden scene coming back together at sunset
- **Beispiel-Seitenprompts:**
  - *Seite 4:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, a big pumpkin with a snail, centered composition`
  - *Seite 16:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, all the animals celebrating the harvest, in a small scene with surroundings`

---
## K10 · Kawaii Food & Süßes  (`kawaii-food`, all)

> Behalten. Kawaii ist dauerhaft beliebt, sehr social-media-tauglich (TikTok/Pinterest).

### Buch 1 — "Die Kawaii-Bäckerei" / "The Kawaii Bakery"
- **Slug:** `kawaii-baeckerei` · **Audience:** all · **Seiten:** 16 · **Preis:** 5,99 €
- **Story:** Ein Tag in einer süßen Bäckerei voller lächelnder Leckereien — vom ersten Croissant am
  Morgen über Törtchen und Donuts bis zur großen Tortenvitrine am Nachmittag. Alles mit Gesicht.
- **Beschreibung (DE):** 16 super-süße Kawaii-Backwaren mit Gesichtern und dicken Linien: Cupcake,
  Donut, Croissant, Torte. Fröhlich, niedlich, für Klein und Groß.
- **heroMotif (Cover):** `a cute kawaii cupcake and donut with happy faces`
- **Cover-Prompt:** `coloring book style illustration of a cute kawaii cupcake and donut with happy faces, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a smiling cupcake on a kitchen shelf
  2. a happy croissant by a sunny window
  3. a cheerful donut in a cozy cafe room
  4. a blushing macaron on a garden table
  5. a winking cookie at a market stall
  6. a cream cake slice in a warm kitchen
  7. a pretzel with a face by the bakery window
  8. a bread loaf buddy in a snug room
  9. a cinnamon roll on a kitchen shelf
  10. a strawberry tart by a sunny window
  11. a muffin pal in a cozy cafe room
  12. a gingerbread friend on a garden table
  13. a cake pop at a market stall
  14. a jam jar in a warm kitchen
  15. a rolling pin by the bakery window
  16. the whole kawaii bakery scene coming back together at sunset
- **Beispiel-Seitenprompts:**
  - *Seite 2:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, a happy cupcake with a cherry, centered composition`
  - *Seite 16:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, all the kawaii bakery friends together, in a small scene with surroundings`

### Buch 2 — "Kawaii-Eisdiele" / "Kawaii Ice Cream Parlor"
- **Slug:** `kawaii-eisdiele` · **Audience:** all · **Seiten:** 16 · **Preis:** 5,99 €
- **Story:** Ein sommerlicher Besuch in der niedlichsten Eisdiele der Welt — von der ersten Eiskugel
  über Milchshakes und Bubble Tea bis zum riesigen Eisbecher zum Schluss. Erfrischend süß.
- **Beschreibung (DE):** 16 kawaii Sommer-Leckereien mit Gesichtern: Eiscreme, Milchshake, Bubble Tea,
  Eis am Stiel. Knallbunt und fröhlich.
- **heroMotif (Cover):** `a cute kawaii ice cream cone and milkshake with faces`
- **Cover-Prompt:** `coloring book style illustration of a cute kawaii ice cream cone and milkshake with faces, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a smiling ice cream cone on a kitchen shelf
  2. a happy popsicle by a sunny window
  3. a sundae with a face in a cozy cafe room
  4. a cheerful milkshake on a garden table
  5. a bubble tea buddy at a market stall
  6. a frozen yogurt swirl in a warm kitchen
  7. a snow cone by the bakery window
  8. a banana split in a snug room
  9. a gelato scoop on a kitchen shelf
  10. a waffle cone pal by a sunny window
  11. a sprinkle jar in a cozy cafe room
  12. a cherry on top on a garden table
  13. a soft-serve swirl at a market stall
  14. a ice pop trio in a warm kitchen
  15. a parfait glass by the bakery window
  16. the whole kawaii ice cream scene coming back together at sunset
- **Beispiel-Seitenprompts:**
  - *Seite 3:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, a smiling milkshake with a straw, centered composition`
  - *Seite 16:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, all the kawaii ice cream friends together, in a small scene with surroundings`

### Buch 3 — "Kawaii-Tierchen & Snacks" / "Kawaii Critters & Snacks"
- **Slug:** `kawaii-tierchen-snacks` · **Audience:** all · **Seiten:** 16 · **Preis:** 5,99 €
- **Story:** Eine fröhliche Reise durch eine Welt, in der süße Tierchen und Snacks beste Freunde sind
  — die Katze trifft das Sushi, der Panda den Bubble Tea. Verspielte Kawaii-Begegnungen.
- **Beschreibung (DE):** 16 Seiten mit Kawaii-Tieren und niedlichem Essen kombiniert: Katze mit Sushi,
  Panda mit Bambus, Hund mit Keks. Doppelt süß, doppelt beliebt.
- **heroMotif (Cover):** `a cute kawaii cat holding sushi with a happy face`
- **Cover-Prompt:** `coloring book style illustration of a cute kawaii cat holding sushi with a happy face, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a cat-shaped cookie on a kitchen shelf
  2. a bunny rice ball by a sunny window
  3. a bear pancake in a cozy cafe room
  4. a panda cupcake on a garden table
  5. a frog matcha cup at a market stall
  6. a duck custard bun in a warm kitchen
  7. a hedgehog bread by the bakery window
  8. a penguin onigiri in a snug room
  9. a fox tart on a kitchen shelf
  10. a owl muffin by a sunny window
  11. a piglet pudding in a cozy cafe room
  12. a chick egg cup on a garden table
  13. a puppy donut at a market stall
  14. a kitten macaron in a warm kitchen
  15. a lamb marshmallow by the bakery window
  16. the whole kawaii animal snacks scene coming back together at sunset
- **Beispiel-Seitenprompts:**
  - *Seite 2:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, a happy panda with bubble tea, centered composition`
  - *Seite 16:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, all the kawaii critters and snacks together, in a small scene with surroundings`

---

## K11 · Dschungel & Safari  (`dschungel-safari`, kids)

> NEU. Exotische Tiere = hohe Kinder-Nachfrage, ergänzt "niedliche Tiere" um wilde Welt.

### Buch 1 — "Safari-Abenteuer" / "Safari Adventure"
- **Slug:** `safari-abenteuer` · **Audience:** kids · **Seiten:** 16 · **Preis:** 4,99 €
- **Story:** Eine Jeep-Tour durch die Savanne — von den Löwen am Morgen über Elefanten am Wasserloch
  bis zu den Giraffen im Abendlicht. Großes Tier-Abenteuer für kleine Entdecker.
- **Beschreibung (DE):** 16 freundliche Safari-Tiere mit dicken Linien: Löwe, Elefant, Giraffe, Zebra,
  Nashorn. Wilde Welt, kindgerecht und niedlich.
- **heroMotif (Cover):** `a cute lion elephant and giraffe on a safari`
- **Cover-Prompt:** `coloring book style illustration of a cute lion elephant and giraffe on a safari, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a safari jeep driving into the savanna
  2. a friendly lion with a big mane
  3. an elephant spraying water
  4. a tall giraffe eating leaves
  5. a striped zebra
  6. a rhino with a small bird
  7. a hippo in a water hole
  8. a cheetah resting on a rock
  9. a family of meerkats
  10. a warthog trotting
  11. a flock of flamingos
  12. a baby elephant with its mom
  13. an acacia tree at sunset
  14. a crocodile by the river
  15. animals gathering at the water hole
  16. all the safari animals at sunset
- **Beispiel-Seitenprompts:**
  - *Seite 2:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, a friendly lion with a big mane, full body view`
  - *Seite 16:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, all the safari animals at sunset, in a small scene with surroundings`

### Buch 2 — "Im tiefen Dschungel" / "Deep in the Jungle"
- **Slug:** `dschungel-tiefer-dschungel` · **Audience:** kids · **Seiten:** 16 · **Preis:** 4,99 €
- **Story:** Eine Entdeckungsreise durch den dichten Dschungel — vorbei an schaukelnden Affen, bunten
  Papageien und einem versteckten Wasserfall bis zur geheimnisvollen Tempelruine.
- **Beschreibung (DE):** 16 Dschungel-Tiere und -Szenen mit dicken Linien: Affe, Papagei, Tiger,
  Frosch, Schlange. Abenteuer im Grünen für neugierige Kinder.
- **heroMotif (Cover):** `a cute monkey and parrot in a jungle with big leaves`
- **Cover-Prompt:** `coloring book style illustration of a cute monkey and parrot in a jungle with big leaves, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. big jungle leaves and vines
  2. a monkey swinging on a vine
  3. a colorful parrot on a branch
  4. a friendly tiger peeking through leaves
  5. a tree frog on a leaf
  6. a curled-up snake on a branch
  7. a toucan with a big beak
  8. a sloth hanging upside down
  9. a chameleon on a twig
  10. a jaguar resting
  11. a hidden waterfall
  12. a butterfly over a jungle flower
  13. a family of monkeys
  14. a gorilla sitting calmly
  15. an ancient temple ruin with vines
  16. all the jungle animals together
- **Beispiel-Seitenprompts:**
  - *Seite 2:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, a monkey swinging on a vine, full body view`
  - *Seite 15:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, an ancient temple ruin with vines, in a small scene with surroundings`

### Buch 3 — "Baby-Tiere der Wildnis" / "Baby Animals of the Wild"
- **Slug:** `safari-baby-tiere-wildnis` · **Audience:** kids · **Seiten:** 15 · **Preis:** 4,99 €
- **Story:** Eine sanfte Reise zu den Tierkindern der Wildnis — vom Löwenbaby, das gähnt, bis zum
  kleinen Elefanten, der lernt zu trompeten. Besonders niedlich, besonders einfach.
- **Beschreibung (DE):** 15 super-niedliche Safari- und Dschungelbabys mit extra dicken Linien:
  Löwenbaby, Elefantenbaby, Äffchen, Giraffenkind. Für die jüngsten Tierfreunde.
- **heroMotif (Cover):** `a cute baby lion and baby elephant together`
- **Cover-Prompt:** `coloring book style illustration of a cute baby lion and baby elephant together, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→15):**
  1. a lion cub in a sunny meadow
  2. a baby elephant deep in the jungle
  3. a giraffe calf by the wide river
  4. a zebra foal across the savanna
  5. a hippo calf at the waterhole
  6. a rhino baby in the forest
  7. a cheetah cub on a grassy hill
  8. a baby monkey near a jungle stream
  9. a warthog piglet in a sunny meadow
  10. a meerkat pup deep in the jungle
  11. a crocodile hatchling by the wide river
  12. a ostrich chick across the savanna
  13. a buffalo calf at the waterhole
  14. a leopard cub in the forest
  15. the whole safari babies scene coming back together at sunset
- **Beispiel-Seitenprompts:**
  - *Seite 1:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, a baby lion yawning, full body view`
  - *Seite 15:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, very simple, minimal detail, thick bold clean outlines, large simple shapes, cute and friendly, for young children, all the baby wild animals napping, in a small scene with surroundings`

---

## K12 · Jahreszeiten & Feste  (`jahreszeiten-feste`, all)

> Behalten. Saisonale Bücher erzeugen starke Q4-/Feiertags-Spitzen — wichtig fürs Marketing.

### Buch 1 — "Winterzauber & Weihnachten" / "Winter Magic & Christmas"
- **Slug:** `feste-winterzauber-weihnachten` · **Audience:** all · **Seiten:** 16 · **Preis:** 5,99 €
- **Story:** Eine Reise durch die schönste Winterzeit — vom ersten Schneeflöckchen über Schneemann,
  Schlittenfahrt und Plätzchenbacken bis zum festlich geschmückten Weihnachtsbaum.
- **Beschreibung (DE):** 16 festliche Winter- und Weihnachtsmotive: Schneemann, Geschenke, Baum,
  Lebkuchen. Saisonliebling fürs Weihnachtsgeschäft. (Veröffentlichen ab Q3.)
- **heroMotif (Cover):** `a cute snowman with a christmas tree and gifts`
- **Cover-Prompt:** `coloring book style illustration of a cute snowman with a christmas tree and gifts, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a single big snowflake
  2. a happy snowman with a scarf
  3. children on a sled
  4. a decorated christmas tree
  5. a stack of wrapped gifts
  6. a gingerbread house
  7. a cup of cocoa with marshmallows
  8. a wreath with a bow
  9. a reindeer with a bell
  10. a stocking by the fireplace
  11. a plate of christmas cookies
  12. a cute robin on a snowy branch
  13. candles and ornaments
  14. carolers under a lantern
  15. a winter village in the snow
  16. the full festive christmas scene, all coming back together as one
- **Beispiel-Seitenprompts:**
  - *Seite 2:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, a happy snowman with a scarf, full body view`
  - *Seite 16:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, the full festive christmas scene, in a small scene with surroundings`

### Buch 2 — "Gruseliges Halloween" / "Spooky Halloween"
- **Slug:** `feste-gruseliges-halloween` · **Audience:** all · **Seiten:** 16 · **Preis:** 5,99 €
- **Story:** Eine nicht-zu-gruselige Reise durch die Halloween-Nacht — vom Kürbisschnitzen über das
  Verkleiden bis zum fröhlichen Süßes-oder-Saures-Zug durch die Nachbarschaft.
- **Beschreibung (DE):** 16 niedlich-gruselige Halloween-Motive: Kürbis, Geist, Hexe, Fledermaus,
  Bonbons. Kindgerecht-spooky, Saisonliebling für Oktober. (Veröffentlichen ab Sommer.)
- **heroMotif (Cover):** `a cute jack-o-lantern with a friendly ghost and bat`
- **Cover-Prompt:** `coloring book style illustration of a cute jack-o-lantern with a friendly ghost and bat, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a smiling jack-o-lantern in a snowy village
  2. a friendly ghost through the autumn forest
  3. a little witch in a spring garden
  4. a black cat at the festive town square
  5. a candy bucket across the pumpkin field
  6. a bat trio by a cozy home
  7. a spooky house along the village street
  8. a spider on a web in a frosty meadow
  9. a scarecrow in a snowy village
  10. a owl on a branch through the autumn forest
  11. a monster pal in a spring garden
  12. a skeleton waving at the festive town square
  13. a broomstick across the pumpkin field
  14. a candy corn pile by a cozy home
  15. a full moon along the village street
  16. the whole friendly halloween scene coming back together at sunset
- **Beispiel-Seitenprompts:**
  - *Seite 1:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, a smiling carved pumpkin, centered composition`
  - *Seite 16:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, the full friendly halloween night scene, in a small scene with surroundings`

### Buch 3 — "Frühlingsfest & Ostern" / "Spring Festival & Easter"
- **Slug:** `feste-fruehlingsfest-ostern` · **Audience:** all · **Seiten:** 16 · **Preis:** 5,99 €
- **Story:** Eine fröhliche Frühlingsreise — vom Eierfärben über die Ostereiersuche im Garten bis
  zum Blütenfest mit dem Osterhasen und seinen Tierfreunden.
- **Beschreibung (DE):** 16 frühlingshafte Oster-Motive: Osterhase, bemalte Eier, Küken, Blumen,
  Körbchen. Heller, fröhlicher Saisonliebling fürs Frühjahr.
- **heroMotif (Cover):** `a cute easter bunny with a basket of decorated eggs`
- **Cover-Prompt:** `coloring book style illustration of a cute easter bunny with a basket of decorated eggs, bold black outlines with several areas filled in bright vibrant colors, half colored half black-and-white line art, playful, cheerful, white background, no text`
- **Motiv-Liste (Seite 1→16):**
  1. a cute easter bunny waving
  2. a basket of decorated eggs
  3. a chick hatching in spring
  4. a single patterned easter egg
  5. a bunny painting an egg
  6. tulips and daffodils blooming
  7. a lamb in a spring meadow
  8. an egg hunt in the garden
  9. a butterfly over flowers
  10. a bird building a nest
  11. a bunny family picnic
  12. a watering can and sprouts
  13. a rainbow over a meadow
  14. a basket of spring flowers
  15. animals at a spring festival
  16. the full spring celebration scene, all coming back together as one
- **Beispiel-Seitenprompts:**
  - *Seite 1:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, a cute easter bunny waving, full body view`
  - *Seite 16:* `coloring book page, black and white line art, clean bold black outlines, line art only, no shading, no grayscale, no color, pure white background, full page illustration, clean detailed outlines, balanced level of detail, friendly, the full spring celebration scene, in a small scene with surroundings`

---
# TEIL III — BUNDLES, BETRIEB & QUELLEN

## 4. Empfohlene kuratierte Bundles (für `bundles`-Tabelle)

Bundles sind laut Recherche und eurer Goal.md ein zentraler Umsatzhebel. Vorschläge (Festpreis,
Ersparnis ggü. Einzelkauf sichtbar machen):

- **"Anti-Stress-Komplettset"** — alle 3 Bücher aus Mandala + Achtsamkeit + Japan-Zen (Premium, ~17,99 €).
- **"Cozy-Vibes-Paket"** — Cottagecore + Gemütliche Freunde + Kawaii Food (Trend-Bundle, ~14,99 €).
- **"Dark-&-Mystic-Bundle"** — Dark Academia + Mond/Mystik + Gothic (Premium-Nische, ~18,99 €).
- **"Kinderzimmer-Megapack"** — Niedliche Tiere + Dino + Einhörner + Fahrzeuge (Familien-Bestseller, ~16,99 €).
- **"Magische Welten"** — Einhörner + Meerjungfrauen + Zauberwald (Mädchen-Fantasy, ~12,99 €).
- **"Tierfreunde-Sammlung"** — Niedliche Tiere + Bauernhof + Safari (Tier-Liebhaber, ~12,99 €).
- **Saison-Bundle "Festtage"** — Winterzauber + Halloween + Ostern (ganzjährig, Q4-Push, ~13,99 €).

Zusätzlich greift weiter die dynamische Mengenstaffel (2 −10 %, 3 −20 %, 5 −30 %, 10 −40 %) und der
Build-your-own-Bundle.

## 5. Welten / Worlds (optionale Top-Navigation)

Eure DB kennt `worlds` (Oberkategorien). Vorschlag zur Bündelung der 24 Kategorien in 4 Welten:

- **"Ruhe & Achtsamkeit"** (adult): Mandala, Botanik, Japan-Zen, Achtsamkeit, Unterwasserwelt, Schmetterlinge.
- **"Mystik & Ästhetik"** (adult): Cottagecore, Dark Academia, Mond/Mystik, Sternzeichen, Gothic, Vintage/Steampunk.
- **"Kleine Entdecker"** (kids): Niedliche Tiere, Dino, Fahrzeuge, Weltraum, Bauernhof, Safari.
- **"Fantasie & Spaß"** (kids/all): Gemütliche Freunde, Einhörner, Zauberwald, Meerjungfrauen, Kawaii Food, Jahreszeiten/Feste.

## 6. Replicate-Betrieb (praktische Hinweise)

- **Pro Buch erzeugen:** Cover (1×) + Seiten (15–20×). Bei 72 Büchern ≈ 72 Cover + ~1.270 Seiten.
- **Reihenfolge = Story:** `motifsForCategory` muss die **buchspezifische** Liste liefern, nicht die
  alte kategorieweite. Empfehlung: Motivlisten pro **Buch** speichern (z. B. neues Feld
  `books.motifs jsonb` oder Mapping-Datei `src/lib/generator/storybooks.ts`), statt global pro Kategorie.
- **Schwierigkeit kommt aus `audience`** — `kids` ⇒ Bold & Easy automatisch. Daher bei Kinderbüchern
  die Motive bewusst simpel halten (1 Hauptobjekt/Seite), bei `adult` ruhig komplexe Szenen.
- **`flux-schnell` + Text:** Modell schreibt Text unsauber. Deshalb tragen die Affirmationsbücher
  (A9) **leere Schmuckbänder** als Motiv; der konkrete Spruch kommt serverseitig als Overlay (oder
  bleibt zum Selbstbeschriften leer). Keine Worte in den Bild-Prompt.
- **Konsistenz Charakter-Bücher (K2, K6-B2, K7-B2, K8-B2):** flux hält Figuren nicht perfekt konstant.
  Pragmatisch: einfache, generische Figur ("a cute bear", "a cute bunny") beschreiben und über alle
  Seiten denselben Wortlaut nutzen; kleinere Abweichungen sind im Bold-&-Easy-Stil unkritisch.
- **Qualität:** Nach `threshold(140)` Konturen prüfen; bei zu vollen Erwachsenenseiten ggf.
  `threshold` leicht erhöhen oder Motiv weniger "ornate" formulieren.
- **Seitenzahl-Feld:** Buch-`page_count` = Länge der Motiv-Liste. In diesem Konzept 15–20 wie angegeben.

## 7. Migrationshinweis (Alt → Neu)

- **Behalten & umbenennen:** Slugs teils geändert (z. B. `meereswelt`→`unterwasserwelt`,
  `achtsamkeit`→`achtsamkeit-affirmationen`). Bei DB-Migration Redirects der alten Slugs einplanen (SEO).
- **Entfernen/Archivieren:** `geometrisch`, `paisley-henna`, `fashion`, `staedte`, `abc-zahlen`,
  `fantasy-drachen` als Kategorie. Vorhandene prozedurale Master (Mandala/Geometrisch/Paisley) können
  als Motiv-Quelle für `mandala-meditation` weiterverwendet werden.
- **Cover neu generieren:** Alle neuen Bücher brauchen neue, story-passende Cover (Prompts oben).

## 8. Verifikation dieses Konzepts (Soll/Ist)

- Kategorien: **24** (Soll ≥ 20) ✓ — 12 Erwachsene, 12 Kinder (50/50) ✓
- Bücher je Kategorie: **3** (Soll ≥ 3) ✓ — gesamt **72** Bücher
- Seiten je Buch: **15–20** ✓ (Kinder 15–16, Erwachsene 18–20)
- Pro Buch vorhanden: Story ✓ · Beschreibung ✓ · Motiv-Liste (story-geordnet) ✓ · Cover-Prompt + heroMotif ✓ · 2 Beispiel-Seitenprompts ✓
- Story-Typ: visuelle Reise (narrativ) ✓ · Prompt-Tiefe: Liste + Beispielseiten ✓

## 9. Quellen (Trend-Recherche, Juni 2026)

- KDPEasy — 15+ Best Coloring Book Niches for Amazon KDP 2026: https://www.kdpeasy.com/blog/best-coloring-book-niches-kdp
- KDPEasy — Coloring Book Trends 2026: 10 Hottest Niches: https://www.kdpeasy.com/guides/coloring-book-trends-2026
- Accio — Top Selling Coloring Books on Amazon 2026: https://www.accio.com/business/top-selling-coloring-books-on-amazon
- Accio — Colouring Book Trend TikTok 2025: https://www.accio.com/business/colouring_book_trend_tiktok
- Accio — 2025 Coloring Books Trending (Themes & Market Insights): https://www.accio.com/business/coloring_books_trending
- JMC Colors — Amazon Coloring Book Trends June 2025: https://jmccolors.com/blogs/coloring-book-guides/amazon-coloring-book-trends-june-2025
- Bobbie Goods — Cozy Coloring (BobbieGoods-Stil, Referenz "visuelle Reise"): https://bobbiegoods.com/collections/coloring-books

> Hinweis: Markt-/Suchvolumen-Zahlen aus o.g. Quellen sind Anbieter-Schätzungen und schwanken.
> Sie dienen der Trend-Richtung, nicht als exakte Prognose.
