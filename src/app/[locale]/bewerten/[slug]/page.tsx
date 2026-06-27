"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Stars from "@/components/Stars";

const labels: Record<string, Record<string, string>> = {
  de: {
    title: "Bewertung abgeben",
    nameLabel: "Dein Name",
    namePlaceholder: "z. B. Maria K.",
    ratingLabel: "Deine Bewertung",
    textLabel: "Dein Kommentar (optional)",
    textPlaceholder: "Was hat dir gut gefallen?",
    emailLabel: "Deine E-Mail (wird nicht veröffentlicht)",
    emailPlaceholder: "deine@email.de",
    submit: "Bewertung absenden",
    success: "Vielen Dank! Deine Bewertung wird nach Prüfung veröffentlicht.",
    errorNotEligible: "Diese E-Mail ist nicht berechtigt, eine Bewertung abzugeben (kein Kauf und keine gültige Einladung gefunden).",
    errorAlreadyReviewed: "Du hast dieses Buch bereits bewertet.",
    errorGeneric: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
    errorMissing: "Bitte fülle alle Pflichtfelder aus.",
    selectStars: "Bitte wähle eine Sternebewertung.",
  },
  en: {
    title: "Leave a review",
    nameLabel: "Your name",
    namePlaceholder: "e.g. Maria K.",
    ratingLabel: "Your rating",
    textLabel: "Your comment (optional)",
    textPlaceholder: "What did you like?",
    emailLabel: "Your email (not published)",
    emailPlaceholder: "you@email.com",
    submit: "Submit review",
    success: "Thank you! Your review will be published after approval.",
    errorNotEligible: "This email is not eligible to leave a review (no purchase or valid invite found).",
    errorAlreadyReviewed: "You have already reviewed this book.",
    errorGeneric: "Something went wrong. Please try again.",
    errorMissing: "Please fill in all required fields.",
    selectStars: "Please select a star rating.",
  },
};

function t(locale: string, key: string): string {
  const l = labels[locale] ?? labels["en"];
  return l[key] ?? labels["en"][key] ?? key;
}

export default function ReviewPage() {
  const params = useParams();
  const locale = typeof params?.locale === "string" ? params.locale : "de";
  const slug = typeof params?.slug === "string" ? params.slug : "";

  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setStatus("error");
      setErrorMsg(t(locale, "errorMissing"));
      return;
    }
    if (rating === 0) {
      setStatus("error");
      setErrorMsg(t(locale, "selectStars"));
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name, rating, body, email }),
      });
      const json = await res.json();
      if (json.ok) {
        setStatus("success");
      } else {
        setStatus("error");
        if (json.error === "not_eligible") setErrorMsg(t(locale, "errorNotEligible"));
        else if (json.error === "already_reviewed") setErrorMsg(t(locale, "errorAlreadyReviewed"));
        else setErrorMsg(t(locale, "errorGeneric"));
      }
    } catch {
      setStatus("error");
      setErrorMsg(t(locale, "errorGeneric"));
    }
  }

  if (status === "success") {
    return (
      <div className="container-page py-20 text-center">
        <div className="mx-auto max-w-md card p-10">
          <div className="text-5xl mb-4">✓</div>
          <p className="font-display text-lg font-semibold">{t(locale, "success")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-lg">
        <h1 className="font-display text-3xl font-bold mb-8">{t(locale, "title")}</h1>
        <form onSubmit={handleSubmit} className="card p-8 space-y-6">
          {/* Star picker */}
          <div>
            <label className="block text-sm font-semibold mb-2">{t(locale, "ratingLabel")} *</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  className="text-3xl leading-none transition-transform hover:scale-110"
                  aria-label={`${star} Stern${star !== 1 ? "e" : ""}`}
                >
                  <span style={{ color: (hover || rating) >= star ? "#FFC857" : "#ECE5DB" }}>★</span>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold mb-1">{t(locale, "nameLabel")} *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t(locale, "namePlaceholder")}
              maxLength={100}
              className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-semibold mb-1">{t(locale, "textLabel")}</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t(locale, "textPlaceholder")}
              maxLength={2000}
              rows={4}
              className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold mb-1">{t(locale, "emailLabel")} *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t(locale, "emailPlaceholder")}
              className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {status === "error" && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full btn-primary py-3 disabled:opacity-60"
          >
            {status === "loading" ? "…" : t(locale, "submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
