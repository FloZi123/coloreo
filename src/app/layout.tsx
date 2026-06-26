import "./globals.css";

// Root-Layout ist Pass-through; <html>/<body> liegen in app/[locale]/layout.tsx,
// damit das lang-Attribut der gewählten Sprache folgt.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
