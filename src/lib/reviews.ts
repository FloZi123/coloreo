/** Sterne/Bewertung erst ab dieser Anzahl echter Reviews anzeigen (kein „toter" 0-Sterne-Zustand). */
export const REVIEW_THRESHOLD = Number(process.env.NEXT_PUBLIC_REVIEW_THRESHOLD ?? 3);

/** True, wenn genügend echte Bewertungen für eine Anzeige vorliegen. */
export function showRating(count?: number | null): boolean {
  return (count ?? 0) >= REVIEW_THRESHOLD;
}
