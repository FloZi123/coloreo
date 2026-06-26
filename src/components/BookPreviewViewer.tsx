"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export default function BookPreviewViewer({
  images,
  totalPages,
  locale,
  dict,
}: {
  images: string[];
  totalPages: number;
  locale: Locale;
  dict: Dictionary;
}) {
  const [i, setI] = useState(0);
  if (!images || images.length === 0) return null;

  const prev = () => setI((v) => (v - 1 + images.length) % images.length);
  const next = () => setI((v) => (v + 1) % images.length);

  const note =
    locale === "de"
      ? `Vorschau (${images.length} von ${totalPages} Seiten) · Vollversion ohne Wasserzeichen nach dem Kauf`
      : `Preview (${images.length} of ${totalPages} pages) · full version without watermark after purchase`;

  return (
    <div>
      <h3 className="mb-3 font-display text-lg font-bold">{dict.product.preview}</h3>
      <div
        className="relative mx-auto max-w-md select-none overflow-hidden rounded-2xl border"
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[i]}
          alt={`${dict.product.preview} ${i + 1}`}
          draggable={false}
          className="pointer-events-none w-full select-none"
          style={{ WebkitUserSelect: "none", WebkitTouchCallout: "none" }}
        />
        {/* zusätzlicher CSS-Wasserzeichen-Layer (Screenshot-Abschreckung) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-30deg, transparent 0 90px, rgba(124,77,255,0.05) 90px 92px)",
          }}
        />
        {/* Navigation */}
        {images.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 px-3 py-2 text-lg shadow hover:bg-white" aria-label="zurück">‹</button>
            <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 px-3 py-2 text-lg shadow hover:bg-white" aria-label="weiter">›</button>
          </>
        )}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white">
          {i + 1} / {images.length}
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-muted">{note}</p>
    </div>
  );
}
