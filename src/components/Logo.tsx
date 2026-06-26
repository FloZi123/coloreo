/** Coloreo-Logo: das „ausgemalte o" (Linienkunst-Hälfte + farbige Hälfte + Funke) + Wortmarke. */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="shrink-0">
      <path d="M60 60 L60 16 A44 44 0 0 1 98.1 38 Z" fill="#7C4DFF" />
      <path d="M60 60 L98.1 38 A44 44 0 0 1 98.1 82 Z" fill="#FF7A59" />
      <path d="M60 60 L98.1 82 A44 44 0 0 1 60 104 Z" fill="#FFC857" />
      <path d="M60 16 A44 44 0 0 0 60 104 Z" fill="#FFFFFF" />
      <path d="M60 29 A31 31 0 0 0 60 91" fill="none" stroke="#2B2540" strokeWidth="1.6" />
      <path d="M60 42 A18 18 0 0 0 60 78" fill="none" stroke="#2B2540" strokeWidth="1.6" />
      <path d="M60 51 A9 9 0 0 0 60 69" fill="none" stroke="#2B2540" strokeWidth="1.6" />
      <line x1="60" y1="16" x2="60" y2="104" stroke="#2B2540" strokeWidth="1.6" />
      <circle cx="60" cy="60" r="44" fill="none" stroke="#2B2540" strokeWidth="3.2" />
      <path d="M101 18 L104.5 29 L116 28 L107 35 L111 46 L101 39 L91 46 L95 35 L86 28 L97.5 29 Z" fill="#FFC857" stroke="#2B2540" strokeWidth="0.9" />
    </svg>
  );
}

export default function Logo({ size = 30, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      <span className="font-display font-bold tracking-tight text-ink" style={{ fontSize: size * 0.72 }}>
        coloreo
      </span>
    </span>
  );
}
