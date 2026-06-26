/** Coloreo-Wortmarke (Design): c o(coral) l o(blau) re o(grün), Fredoka. */
export default function Logo({ size = 26, dark = false }: { size?: number; dark?: boolean }) {
  const base = dark ? "#FBF7F0" : "#221E1B";
  return (
    <span
      className="font-display select-none"
      style={{ fontFamily: "var(--font-display), Fredoka, sans-serif", fontWeight: 700, fontSize: size, lineHeight: 1, letterSpacing: "-0.01em", color: base }}
    >
      c<span style={{ color: "#FF5A4D" }}>o</span>l<span style={{ color: "#3B8EEA" }}>o</span>re<span style={{ color: "#3FBF87" }}>o</span>
    </span>
  );
}

/** Kompaktes Zeichen für Favicon/kleine Flächen (mehrfarbige Punkte). */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="11" cy="20" r="7" fill="none" stroke="#FF5A4D" strokeWidth="4" />
      <circle cx="26" cy="20" r="7" fill="none" stroke="#3B8EEA" strokeWidth="4" />
    </svg>
  );
}
