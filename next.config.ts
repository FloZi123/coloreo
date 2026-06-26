import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Eindeutigen Workspace-Root setzen (mehrere Lockfiles im Eltern-Verzeichnis vorhanden)
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "ubgjdvbnmfnirsntyslr.supabase.co" },
    ],
  },
};

export default nextConfig;
