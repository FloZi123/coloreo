# Pin-Save-Test — Coloreo (Nischen-Validierung)

> Ziel: Beweisen (oder widerlegen), dass die gewählte Nische **Cottagecore / Anti-Stress**
> bei der Pinterest-Zielgruppe zündet — BEVOR mehr Energie in Struktur/Content fließt.
> Council-Kernpunkt: Der Engpass ist **Nachfrage/Ästhetik-Fit**, nicht die Technik.

## Hypothese
„Erdig-elegante Cottagecore-Malvorlagen sprechen Pinterest-Frauen (Anti-Stress) so an, dass
sie die Pins **speichern** und über die **Gratis-Probeseite** ihre E-Mail hinterlassen."

## Erfolgsschwellen (VORHER festlegen — sonst misst der Test nichts)
Vorschlag als Startpunkt (anpassen):
- **Primär — Freebie-Signup-Rate:** ≥ **25 %** der Besucher der Gratis-Probeseite tragen die E-Mail ein,
  gemessen über die ersten **~200** Pinterest-Besucher der Anti-Stress-Kollektion.
- **Sekundär — Pinterest Save-Rate:** ≥ **3 %** (Saves/Impressions) der Held-Pins = Ästhetik-Fit.
- **Sekundär — Add-to-Cart-Rate:** Orientierung, kein Kill-Kriterium in Phase 1.

**Kill/Pivot:** Liegt die Signup-Rate nach ~200 Besuchern klar unter der Schwelle →
**Nische wechseln** (Cottagecore ↔ Mond/Celestial ↔ Dark Academia), NICHT weiter an der IA drehen.

## Messung (bereits verdrahtet ✓)
- **UTM:** Social-Links tragen `utm_source=pinterest&utm_medium=organic&utm_campaign=<slug>` (siehe `linkFor` in `scripts/generate-social.ts`).
- **Attribution:** `parseUtm` hängt utm_source/medium/campaign an `$pageview` UND `freebie_signup` (consent-gated) — `src/lib/analytics.ts`.
- **Conversion:** `freebie_signup` (Doppel-Opt-in via FreebieForm) und `purchase_completed` (Webhook, mit `currency`).

### PostHog-Funnel (Projekt „Default project" 211116, EU)
Funnel-Schritte anlegen:
1. `$pageview` mit `properties.utm_source = pinterest`
2. `$pageview` auf Pfad enthält `/gratis`
3. `freebie_signup`
→ Breakdown nach `utm_campaign` (= Buch-Slug) zeigt, welche Pins/Motive konvertieren.
Zusätzliches Dashboard-Tile: `purchase_completed` (Value/Currency) für ROAS-Sicht.

## Assets (Held-Pins, neues erdiges Branding)
Gerendert (2:3 Pinterest-Pins, realistisch koloriert, Serif-Wortmarke, KI-Kennzeichnung):
- `public/social/cottagecore-tag-im-landhaus/de/pin-1..6.webp`
- `public/social/cottagecore-pilzsammler/de/pin-1..6.webp`
- `public/social/cottagecore-vier-jahreszeiten/de/pin-1..6.webp`
Neu erzeugen/erweitern: `npx tsx scripts/generate-social.ts <slug> --force` (optional `--upload` in den Bucket, `--locale de,en`).

## Ablauf
1. Pins auf Pinterest posten (Held-Motive oben), Link → `/gratis` (bzw. `/kategorien/cottagecore`).
2. ~2–4 Wochen / bis ~200 Besucher laufen lassen.
3. Funnel + Save-Rate auswerten (Breakdown nach Kampagne/Motiv).
4. Über Schwelle → skalieren (mehr Pins, Traffic). Drunter → Nische pivotieren (unten).

## Nischen-Pivot (1-Zeilen-Umschaltung in `src/app/globals.css`)
Nur `--color-primary` / `-dark` / `-soft` + `--color-accent` tauschen (Rest bleibt):
- **Cottagecore (Standard):** Primär Sage `#7A8B6E` · Akzent Terracotta `#C0714E`
- **Mond/Celestial:** Primär Indigo `#3E3A6E` · Akzent Gold `#C9A24B`
- **Dark Academia:** Primär Oxblood `#7A3B34` / Forest `#3C4A3E` · Akzent Alt-Gold `#B08D57`
Nach dem Wechsel Cover/Pins der neuen Nische neu rendern (`generate-social.ts` / `rebrand-covers.ts`).

## Wichtig (Council)
Dieser Umbau war der 2-Stunden-Teil. Danach geht die Energie in **Pins + Traffic**, nicht in weitere Struktur.
