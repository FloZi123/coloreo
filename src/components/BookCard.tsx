"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/store";
import { formatPrice } from "@/lib/pricing";
import Stars from "@/components/Stars";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export interface BookCardData {
  id: string;
  slug: string;
  title: string;
  priceCents: number;
  pageCount: number;
  coverUrl: string | null;
  emoji?: string | null;
  rating?: { avg: number; count: number } | null;
}

export default function BookCard({
  book,
  locale,
  dict,
}: {
  book: BookCardData;
  locale: Locale;
  dict: Dictionary;
}) {
  const { addBook, has } = useCart();
  const inCart = has(book.id);
  const href = `/${locale}/buch/${book.slug}`;

  return (
    <div className="card group overflow-hidden transition hover:-translate-y-1 hover:shadow-lg">
      <Link href={href} className="block">
        <div className="relative aspect-[3/4] overflow-hidden">
          {book.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={book.coverUrl} alt={book.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-primary-soft to-accent-soft">
              <span className="text-5xl">{book.emoji ?? "🎨"}</span>
              <span className="mt-3 px-4 text-center font-display text-sm font-semibold text-ink-soft">
                {book.title}
              </span>
            </div>
          )}
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-ink-soft">
            {book.pageCount} {dict.common.pages}
          </span>
        </div>
      </Link>
      <div className="p-4">
        <Link href={href}>
          <h3 className="line-clamp-2 min-h-[2.5rem] font-display text-sm font-semibold text-ink hover:text-primary">
            {book.title}
          </h3>
        </Link>
        {book.rating && book.rating.count > 0 && (
          <div className="mt-1 flex items-center gap-1 text-xs text-muted">
            <Stars value={book.rating.avg} size={13} />
            <span>({book.rating.count})</span>
          </div>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="font-display text-lg font-bold text-primary">
            {formatPrice(book.priceCents, locale)}
          </span>
          <button
            onClick={() =>
              addBook({
                id: book.id,
                slug: book.slug,
                title: book.title,
                coverUrl: book.coverUrl,
                unitPriceCents: book.priceCents,
              })
            }
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              inCart ? "bg-success text-white" : "btn-primary"
            }`}
          >
            {inCart ? "✓ " + dict.common.inCart : dict.common.addToCart}
          </button>
        </div>
      </div>
    </div>
  );
}
