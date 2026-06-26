# Coloreo – Markenkonzept & Design-Guide

> Konzept-Stand für Claude Design. Status: **Entwurf zur Abstimmung** (Florian arbeitet an Logo/Brand).
> Taglines: **„Mal dir deine Welt."** / **„Color your world."**

## Leitidee — „Das ausgemalte o"
Das **„o" in Coloreo ist eine Malseite beim Ausmalen**: linke Hälfte = Linienkunst-Vorlage
(schwarz-weiß), rechte Hälfte = mit den Markenfarben koloriert. Aus Umriss wird Farbe — genau das,
was ein Malbuch tut. Ein kleiner Funke (✦) steht für Freude/Magie.

Warum stark:
- **Selbsterklärend & einprägsam** (man versteht es in einer Sekunde).
- **Ownable** – direkt aus dem Namen entwickelt, keine generische Mal-Bildmarke.
- **Kohärent mit Cover-Stil B** (halb Linienkunst, halb koloriert) → Logo, Cover und Produkt sprechen
  dieselbe Sprache.
- **Skaliert**: nur das „o"-Zeichen als App-Icon/Favicon, volle Wortmarke „coloreo" für den Header.

Offene Designfrage: das farbige „o" **in die Wortmarke integrieren** („colore" + Kreis-o) statt als
separates Icon daneben — wäre die ikonischste Variante.

## Farbpalette
| Rolle | Name | Hex | Einsatz |
|---|---|---|---|
| Primär | Violett | `#7C4DFF` | Buttons, Links, Marke; ruhig/kreativ |
| Akzent | Coral | `#FF7A59` | Highlights, Badges, Wärme |
| Highlight | Gold | `#FFC857` | Freude, Sterne/Funke, Aktionen |
| Kinder-Akzent | Mint | `#2BBF8A` | frischer Ton für Kinder-Sektion / Erfolg |
| Neutral dunkel | Tinte | `#2B2540` | Text, Konturen |
| Neutral hell | Papier | `#FAF6F1` | Hintergrund |
| Fläche | Surface | `#FFFFFF` | Karten |
| Linie | Line | `#ECE5DB` | Trenner, Rahmen |

(Bereits als CSS-Variablen in `src/app/globals.css` hinterlegt.)

## Typografie
- **Überschriften:** Quicksand (rund, freundlich, beide Zielgruppen). 500/600/700.
- **Fließtext:** Nunito (klar, gut lesbar). 400/700.
- Sentence case, keine Versalien-Headlines.

## Dual-Mood (eine Marke, zwei Stimmungen)
- **Kinder:** verspielt & bunt — mehr Coral, Gold, Mint; runde Formen; volle bunte Cover.
- **Erwachsene / Anti-Stress:** ruhig & elegant — Violett & Tinte; feine Linien; viel Weißraum;
  teilkolorierte, dezente Cover.

## Anwendung
- **Header/Footer:** Icon-„o" + Wortmarke „coloreo" (aktuell „✦ Coloreo" – auf neue Marke umstellen).
- **Cover-Template:** Cover-Stil B (teilkoloriert) + Branding-Overlay (Logo/Titel/Kategorie).
- **E-Mails:** Logo-Kopf in Violett, sonst neutral.
- **Favicon/App-Icon:** nur das farbige „o"-Zeichen.

## Logo-Asset — Icon „o" (SVG, wiederverwendbar)
Standalone-Marke (Viewbox 120×120), einsetzbar als Favicon/Header-Icon:

```svg
<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <path d="M60 60 L60 16 A44 44 0 0 1 98.1 38 Z" fill="#7C4DFF"/>
  <path d="M60 60 L98.1 38 A44 44 0 0 1 98.1 82 Z" fill="#FF7A59"/>
  <path d="M60 60 L98.1 82 A44 44 0 0 1 60 104 Z" fill="#FFC857"/>
  <path d="M60 16 A44 44 0 0 0 60 104 Z" fill="#FFFFFF"/>
  <path d="M60 29 A31 31 0 0 0 60 91" fill="none" stroke="#2B2540" stroke-width="1.6"/>
  <path d="M60 42 A18 18 0 0 0 60 78" fill="none" stroke="#2B2540" stroke-width="1.6"/>
  <path d="M60 51 A9 9 0 0 0 60 69" fill="none" stroke="#2B2540" stroke-width="1.6"/>
  <line x1="60" y1="16" x2="60" y2="104" stroke="#2B2540" stroke-width="1.6"/>
  <circle cx="60" cy="60" r="44" fill="none" stroke="#2B2540" stroke-width="3.2"/>
  <path d="M101 18 L104.5 29 L116 28 L107 35 L111 46 L101 39 L91 46 L95 35 L86 28 L97.5 29 Z" fill="#FFC857" stroke="#2B2540" stroke-width="0.9"/>
</svg>
```

## Nächste Schritte (wenn freigegeben)
1. Entwurf verfeinern (Funke-Position, Farbaufteilung, „o" in Wortmarke integrieren).
2. Asset-Set bauen: Wortmarke, Icon, Favicon, Hell/Dunkel-Varianten.
3. Im Shop ausrollen: Header, Footer, Cover-Template, E-Mails, Favicon.
4. Danach: Cover-Re-Run (Stil B) mit neuem Branding (siehe `ART-UPGRADE.md`).
