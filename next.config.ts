import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Eindeutigen Workspace-Root setzen (mehrere Lockfiles im Eltern-Verzeichnis vorhanden)
  turbopack: {
    root: path.join(__dirname),
  },
  // Native Module nicht bundeln (PDF-Rasterizer + Bildverarbeitung)
  serverExternalPackages: ["pdf-to-img", "@napi-rs/canvas", "sharp", "pdf-lib"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "ubgjdvbnmfnirsntyslr.supabase.co" },
    ],
  },
};

export default nextConfig;
