import React from "react";

const CDN = "https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg";

// Wandelt einen Emoji-String in die Twemoji-Codepoint-Sequenz (z. B. "1f30a").
// Entfernt den Variation-Selector U+FE0F, behält ZWJ-Sequenzen.
function codepoints(emoji: string): string {
  const pts: string[] = [];
  for (const ch of emoji) {
    const cp = ch.codePointAt(0);
    if (cp === undefined) continue;
    if (cp === 0xfe0f) continue; // variation selector entfernen
    pts.push(cp.toString(16));
  }
  return pts.join("-");
}

/**
 * Rendert ein Emoji als einheitliches Twemoji-SVG (gleich auf allen Geräten).
 * Höhe folgt der Font-Größe des Eltern-Elements (text-2xl/-7xl etc. greift weiter).
 */
export function Emoji({
  emoji,
  label,
  className,
}: {
  emoji?: string | null;
  label?: string;
  className?: string;
}) {
  const value = (emoji ?? "🎨").trim();
  const code = codepoints(value);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${CDN}/${code}.svg`}
      alt={label ?? value}
      draggable={false}
      loading="lazy"
      className={className}
      style={{ height: "1em", width: "1em", display: "inline-block", verticalAlign: "-0.125em" }}
    />
  );
}
