# Coloreo – Design-Brief (für Website-Prototyp)

## 1. Was ist Coloreo?
Ein **Online-Shop für digitale Malbücher** (PDF, A4, druckfertig, Sofort-Download nach Kauf).
- **Zweisprachig:** Deutsch (Standard) + Englisch.
- **Zielgruppen:** Kern **Erwachsene / Anti-Stress** (filigrane Motive), zweite Säule **Kinder/Familie** (einfache, bunte Motive).
- **Markenidee:** „Das ausgemalte o" – aus Umriss wird Farbe. Logo = das „o" halb Linienkunst, halb farbig + Funke. Wortmarke **coloreo** (klein).
- **Taglines:** „Mal dir deine Welt." / „Color your world."
- **USP:** Sofort verfügbar, druckfertig, große Auswahl (24 Kategorien, ~49 Bücher), faire Preise, Bundle-Rabatte.

## 2. Marke & Stil
- **Farben:** Violett `#7C4DFF` (primär) · Coral `#FF7A59` · Gold `#FFC857` · Mint `#2BBF8A` (Kinder) · Tinte `#2B2540` (Text) · Papier `#FAF6F1` (Hintergrund) · Weiß `#FFFFFF` (Karten) · Linie `#ECE5DB`.
- **Schriften:** Quicksand (Überschriften, rund/freundlich) · Nunito (Fließtext).
- **Anmutung:** warm, kreativ, vertrauenswürdig. Runde Ecken (16–28px), viel Weißraum, sanfte Karten.
- **Dual-Mood:** Kinder = verspielt/bunt (Coral/Gold/Mint); Erwachsene = ruhig/elegant (Violett/Tinte, feine Linien).
- Sentence case, keine Versalien-Headlines.

## 3. Preis- & Verkaufslogik (wichtig fürs UI)
- Einzelpreis **4,99–7,99 €**.
- **Mengenrabatt** (automatisch): 2 Bücher −10 %, 3 −20 %, 5 −30 %, 10 −40 % → im Warenkorb & Bundle-Builder live anzeigen, inkl. „Noch X Bücher bis Y % Rabatt".
- **Kuratierte Bundles** (Festpreis) + **Build-your-own-Bundle**.
- **Gutscheine** (z. B. WILLKOMMEN10 = 10 %).
- **Bewertungen** (Sterne + Anzahl) auf Karten & Produktseiten.
- Jede PDF wird **personalisiert (Wasserzeichen)** geliefert; Vorschau zeigt nur wenige Seiten mit Wasserzeichen.

## 4. Seitenstruktur (Screens für den Prototyp)
Globale Elemente auf allen Storefront-Seiten:
- **Header:** Logo (Mark + „coloreo"), Navigation (Kategorien · Bundles · Bundle-Builder · Gratis-Vorlagen · Meine Bibliothek), Suche-Icon, Sprachumschalter (DE/EN), Warenkorb mit Anzahl-Badge.
- **Footer:** Logo + Tagline, Spalten (Kategorien/Bundles, Hilfe, Legal), Copyright.
- **Schwebend:** Chat-Assistent (unten rechts), „In den Warenkorb"-Toast, Erstkäufer-Popup (10 %-Gutschein gegen E-Mail).

Screens:
1. **Startseite** – Hero (Headline + 2 CTAs „Jetzt entdecken" / „Bundles & Rabatte" + Kategorie-Kacheln), Trust-Bar (Sofort-Download · druckfertig · sichere Zahlung), beliebte Bücher (Karten-Grid), Kategorien-Grid, Bundle-Teaser („Mehr kaufen, mehr sparen"), Freebie-Sektion (E-Mail-Eingabe).
2. **Kategorien-Übersicht** – getrennt nach Erwachsene / Kinder, Karten mit Emoji + Name.
3. **Kategorie-Detail** – Header (Emoji, Name, Beschreibung) + Buch-Karten-Grid.
4. **Produktseite** – Cover groß, Titel, Sterne-Bewertung, Preis, „In den Warenkorb"/„Zur Kasse", **Vorschau-Blätterer (Wasserzeichen)**, Details (Seitenzahl, Format A4-PDF, Kategorie), Wasserzeichen-Hinweis, Bewertungen, „Das könnte dir gefallen".
5. **Suche** – Suchfeld + Filter (Zielgruppe, Kategorie) + Sortierung (Beliebt/Neu/Preis), Ergebnis-Grid.
6. **Bundles-Übersicht** + **Bundle-Detail** (enthaltene Bücher, Festpreis, Ersparnis).
7. **Bundle-Builder** – Bücher anklicken, Live-Preis mit wachsendem Rabatt, „Bundle in den Warenkorb".
8. **Warenkorb** – Positionen (mit Menge), Mengenrabatt-Hinweis, Gutschein-Feld, Aufschlüsselung (Zwischensumme · Rabatt · Gesamt · Ersparnis), „Sicher zur Kasse".
9. **Kasse** – läuft über Stripe (Karte/PayPal), eigener Screen optional.
10. **Danke-/Erfolgsseite** – Bestätigung + Sofort-Download-Links.
11. **Meine Bibliothek** – Login per Magic-Link **oder** E-Mail-Abfrage → Liste der gekauften Bücher mit Download-Buttons.
12. **Login** – E-Mail → Magic-Link.
13. **Gratis-Vorlagen** – E-Mail-Eingabe für kostenlose Probeseiten (Newsletter, Double-Opt-in).
14. **Rechtsseiten** – Impressum, Datenschutz, AGB, Widerruf, Kontakt (schlichtes Textlayout).

Eine **Buchkarte** (überall wiederkehrend): Cover (3:4), Seitenzahl-Badge, Titel, Sterne, Preis, „In den Warenkorb"-Button.

## 5. Kern-Flow
Stöbern → Produkt → in den Warenkorb → Warenkorb (dynamischer Rabatt) → Stripe-Kasse → Danke-Seite mit Downloads → Bibliothek.

## 6. Tech-Kontext (nur zur Info – Design muss das nicht abbilden)
Next.js + Tailwind, Supabase, Stripe, bestehende Shop-/Admin-Logik bleibt. Das Design liefert das **Aussehen**; die Funktion ist bereits gebaut. Admin-Bereich (Dashboard/Bücher/Bestellungen/Generator) ist intern und braucht **kein** Design.

## 7. Was ich aus dem Prototyp brauche, um ihn umzusetzen
Layout & Komponenten je Screen, Spacing/Typo-Skala, Farb-Einsatz, Logo als SVG, Hover/aktiv-Zustände, mobile Ansicht.
