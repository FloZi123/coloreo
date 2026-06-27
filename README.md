This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Social-Content-Pipeline

Erzeugt pro Buch teilbaren Social-Content aus dem Master-PDF: **6 Pinterest-Pins** (2:3,
Vorlage/ausgemalt) und zwei **9:16-Videos** (Flip-Through + Reveal, stumm) — gebrandet mit
`coloreo`-Wortmarke und `coloreo.de`-CTA.

```bash
npm run social:gen <slug>            # einzelnes Buch
npm run social:gen <slug> --upload   # + Upload nach Supabase-Bucket "social-assets"
npm run social:gen:all -- --upload   # alle veröffentlichten Bücher
```

Flags: `--locale de,en` (Sprachen der Assets; KI-Kolorierung laeuft nur einmal), `--upload` (Supabase-Bucket), `--flat` (flache Markenfüllung statt realistischer
AI-Farben, spart Replicate-Kosten), `--force` (Vorhandenes neu erzeugen statt überspringen).

Output liegt in `public/social/<slug>/` (`pin-1..6.webp`, `video-flip.mp4`, `video-reveal.mp4`,
`social.json`). `public/social/` ist gitignored (reproduzierbar).

**Voraussetzungen / Hinweise**
- `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `REPLICATE_API_TOKEN`.
- **ffmpeg** kommt über das npm-Paket `ffmpeg-static` — kein System-Install nötig.
- Realistische Farben: jede Seite wird via Replicate (flux-dev img2img) koloriert (~7 Bilder/Buch).
- **Videos sind bewusst stumm** — Trend-Sounds werden später in der TikTok/Reels-App ergänzt (Lizenz).
- Rendering läuft nur per CLI/Job, **nicht** im Web-Request.
