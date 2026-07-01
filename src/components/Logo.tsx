/** Coloreo-Wortmarke (Design): c o(terracotta) l o(blaugrau) re o(sage), warme Serif. */
export default function Logo({ size = 26, dark = false }: { size?: number; dark?: boolean }) {
  const base = dark ? "#FBF8F2" : "#3A352E";
  return (
    <span
      className="font-display select-none"
      style={{ fontFamily: "var(--font-display), Fraunces, Georgia, serif", fontWeight: 600, fontSize: size, lineHeight: 1, letterSpacing: "-0.005em", color: base }}
    >
      c<span style={{ color: "#C0714E" }}>o</span>l<span style={{ color: "#6D86A3" }}>o</span>re<span style={{ color: "#7A8B6E" }}>o</span>
    </span>
  );
}

/** Kompaktes Zeichen für Favicon/kleine Flächen (gedämpfte Punkte). */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="11" cy="20" r="7" fill="none" stroke="#C0714E" strokeWidth="4" />
      <circle cx="26" cy="20" r="7" fill="none" stroke="#7A8B6E" strokeWidth="4" />
    </svg>
  );
}
