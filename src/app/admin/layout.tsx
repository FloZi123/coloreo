import "../globals.css";
import { Nunito, Fredoka } from "next/font/google";

const body = Nunito({ subsets: ["latin"], weight: ["400", "600", "700", "800"], variable: "--font-body", display: "swap" });
const display = Fredoka({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-display", display: "swap" });

export const metadata = { title: "Coloreo Admin" };

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${body.variable} ${display.variable} h-full`}>
      <body className="min-h-full bg-paper">{children}</body>
    </html>
  );
}
